import { Component, computed, effect, input, output, signal } from '@angular/core';
import QRCode from 'qrcode';
import { AdminAccount, scopeLabel, systemRole } from '../admin-account';

const SHEET_SIZES = [6, 8, 10, 12] as const;
type SheetSize = (typeof SHEET_SIZES)[number];

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
  protected readonly sheetSize = signal<SheetSize>(8);
  protected readonly isGenerating = signal(true);
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
