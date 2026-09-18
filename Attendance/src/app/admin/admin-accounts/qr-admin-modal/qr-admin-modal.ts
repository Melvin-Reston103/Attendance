import { Component, effect, input, output, signal } from '@angular/core';
import QRCode from 'qrcode';
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
  protected onPrint(): void { window.print(); }
}
