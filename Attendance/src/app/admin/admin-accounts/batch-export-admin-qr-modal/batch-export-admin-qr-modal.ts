import { Component, computed, effect, input, output, signal } from '@angular/core';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { AdminAccount, scopeLabel, systemRole } from '../admin-account';

const SHEET_SIZES = [5, 10, 15, 20, 25] as const;
type SheetSize = (typeof SHEET_SIZES)[number];

const SHEET_LAYOUTS: Record<SheetSize, { cols: number; rows: number }> = {
  5: { cols: 5, rows: 1 },
  10: { cols: 5, rows: 2 },
  15: { cols: 5, rows: 3 },
  20: { cols: 5, rows: 4 },
  25: { cols: 5, rows: 5 },
};

interface AdminQrPass {
  account: AdminAccount;
  qrDataUrl: string | null;
  error: boolean;
}

@Component({
  selector: 'app-batch-export-admin-qr-modal',
  imports: [],
  templateUrl: './batch-export-admin-qr-modal.html',
  styleUrl: './batch-export-admin-qr-modal.scss',
})
export class BatchExportAdminQrModal {
  readonly accounts = input.required<readonly AdminAccount[]>();
  readonly close = output<void>();

  protected readonly sheetSizes = SHEET_SIZES;
  protected readonly sheetSize = signal<SheetSize>(10);
  protected readonly isGenerating = signal(true);
  protected readonly isExportingPdf = signal(false);
  protected readonly passes = signal<readonly AdminQrPass[]>([]);

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.accounts().length / this.sheetSize())));
  protected readonly currentPage = signal(1);
  protected readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, index) => index + 1));
  protected readonly pagedPasses = computed(() => {
    const start = (this.currentPage() - 1) * this.sheetSize();
    return this.passes().slice(start, start + this.sheetSize());
  });
  protected readonly rangeEnd = computed(() => Math.min(this.currentPage() * this.sheetSize(), this.accounts().length));
  protected readonly printPages = computed(() => {
    const pages: AdminQrPass[][] = [];
    for (let start = 0; start < this.passes().length; start += this.sheetSize()) {
      pages.push(this.passes().slice(start, start + this.sheetSize()));
    }
    return pages.length ? pages : [[]];
  });

  constructor() {
    effect(() => void this.generatePasses(this.accounts()));
  }

  protected onSheetSizeChange(value: string): void {
    this.sheetSize.set(Number(value) as SheetSize);
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  protected roleLabel(role: AdminAccount['role']): string {
    return systemRole(role).label;
  }

  protected scopeText(account: AdminAccount): string {
    return scopeLabel(account.scope);
  }

  protected onCancel(): void {
    this.close.emit();
  }

  protected onPrint(): void {
    if (this.isGenerating() || this.passes().length === 0) return;
    window.print();
  }

  protected async onExportPdf(): Promise<void> {
    if (this.isGenerating() || this.isExportingPdf() || this.passes().length === 0) return;

    this.isExportingPdf.set(true);
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const margin = 20;
      const gap = 6;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const { cols, rows } = SHEET_LAYOUTS[this.sheetSize()];
      const cardWidth = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;
      const qrSize = cardWidth - 10;
      const cardHeight = qrSize + 38;

      this.printPages().forEach((page, pageIndex) => {
        if (pageIndex > 0) doc.addPage();
        page.forEach((pass, index) => {
          const column = index % cols;
          const row = Math.floor(index / cols);
          this.drawPdfCard(
            doc,
            pass,
            margin + column * (cardWidth + gap),
            margin + row * (cardHeight + gap),
            cardWidth,
            cardHeight,
          );
        });
      });

      doc.save(`staff-qr-pass-export-${this.accounts().length}-accounts.pdf`);
    } finally {
      this.isExportingPdf.set(false);
    }
  }

  private drawPdfCard(doc: jsPDF, pass: AdminQrPass, x: number, y: number, width: number, height: number): void {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.75);
    doc.roundedRect(x, y, width, height, 6, 6);

    const qrSize = Math.min(width - 10, height - 34);
    const qrX = x + (width - qrSize) / 2;
    const qrY = y + 4;
    if (pass.qrDataUrl) {
      doc.addImage(pass.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } else {
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      doc.text('QR generation failed', x + width / 2, qrY + qrSize / 2, { align: 'center' });
    }

    let textY = qrY + qrSize + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(pass.account.name, x + width / 2, textY, { align: 'center', maxWidth: width - 10 });
    textY += 10;
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(pass.account.employeeId, x + width / 2, textY, { align: 'center' });
    textY += 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`${this.roleLabel(pass.account.role)} - ${this.scopeText(pass.account)}`, x + width / 2, textY, {
      align: 'center',
      maxWidth: width - 10,
    });
  }

  private async generatePasses(accounts: readonly AdminAccount[]): Promise<void> {
    this.isGenerating.set(true);
    this.passes.set([]);
    const generated: AdminQrPass[] = [];
    for (const account of accounts) {
      try {
        const qrDataUrl = await QRCode.toDataURL(
          JSON.stringify({ accountId: account.id, employeeId: account.employeeId, name: account.name }),
          { width: 220, margin: 1, color: { dark: '#0c1322', light: '#ffffff' } },
        );
        generated.push({ account, qrDataUrl, error: false });
      } catch {
        generated.push({ account, qrDataUrl: null, error: true });
      }
      this.passes.set([...generated]);
    }
    this.isGenerating.set(false);
  }
}
