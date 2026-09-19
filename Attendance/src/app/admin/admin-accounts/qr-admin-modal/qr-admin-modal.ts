import { Component, effect, input, output, signal } from '@angular/core';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { AdminAccount } from '../admin-account';

@Component({
  selector: 'app-qr-admin-modal',
  imports: [],
  templateUrl: './qr-admin-modal.html',
  styleUrl: './qr-admin-modal.scss',
})
export class QrAdminModal {
  readonly account = input.required<AdminAccount>();
  readonly close = output<void>();
  protected readonly qrDataUrl = signal<string | null>(null);
  protected readonly qrError = signal(false);
  protected readonly isExportingPdf = signal(false);

  constructor() {
    effect(() => {
      const account = this.account();
      this.qrDataUrl.set(null);
      this.qrError.set(false);
      QRCode.toDataURL(JSON.stringify({ accountId: account.id, employeeId: account.employeeId, name: account.name }), {
        width: 240,
        margin: 1,
        color: { dark: '#0c1322', light: '#ffffff' },
      }).then((dataUrl) => this.qrDataUrl.set(dataUrl)).catch(() => this.qrError.set(true));
    });
  }

  protected onCancel(): void { this.close.emit(); }
  protected onPrint(): void {
    const dataUrl = this.qrDataUrl();
    if (!dataUrl) return;

    const printWindow = window.open('', '_blank', 'popup,width=640,height=760');
    if (!printWindow) return;

    const document = printWindow.document;
    document.title = `QR Pass - ${this.account().name}`;
    document.head.innerHTML = `
      <meta charset="utf-8">
      <title>QR Pass</title>
      <style>
        @page { margin: 0.5in; }
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; color: #0f172a; }
        main { text-align: center; }
        img { display: block; width: 3in; height: 3in; margin: 0 auto 20px; }
        h1 { margin: 0 0 8px; font-size: 20px; }
        p { margin: 4px 0; font-size: 14px; }
        .employee-id { font-family: monospace; }
        @media print { body { min-height: auto; } }
      </style>`;

    const main = document.createElement('main');
    const image = document.createElement('img');
    image.src = dataUrl;
    image.alt = `QR pass for ${this.account().name}`;
    const name = document.createElement('h1');
    name.textContent = this.account().name;
    const employeeId = document.createElement('p');
    employeeId.className = 'employee-id';
    employeeId.textContent = this.account().employeeId;
    const email = document.createElement('p');
    email.textContent = this.account().email;

    main.append(image, name, employeeId, email);
    document.body.replaceChildren(main);
    image.addEventListener('load', () => {
      printWindow.focus();
      printWindow.print();
      printWindow.addEventListener('afterprint', () => printWindow.close(), { once: true });
    }, { once: true });
  }

  protected onExportPdf(): void {
    const dataUrl = this.qrDataUrl();
    if (!dataUrl || this.isExportingPdf()) return;

    this.isExportingPdf.set(true);
    try {
      const account = this.account();
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const qrSize = 280;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 110;

      doc.setFillColor(12, 19, 34);
      doc.rect(0, 0, pageWidth, 74, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('SMCH Staff QR Pass', pageWidth / 2, 44, { align: 'center' });
      doc.setDrawColor(34, 211, 238);
      doc.setLineWidth(2);
      doc.line(qrX, qrY - 12, qrX + qrSize, qrY - 12);
      doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(account.name, pageWidth / 2, qrY + qrSize + 42, { align: 'center' });
      doc.setFont('courier', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(8, 145, 178);
      doc.text(account.employeeId, pageWidth / 2, qrY + qrSize + 64, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(account.email, pageWidth / 2, qrY + qrSize + 84, { align: 'center' });
      doc.text('Present this pass at authorized attendance stations.', pageWidth / 2, qrY + qrSize + 122, { align: 'center' });
      doc.save(`staff-qr-pass-${account.employeeId}.pdf`);
    } finally {
      this.isExportingPdf.set(false);
    }
  }
}
