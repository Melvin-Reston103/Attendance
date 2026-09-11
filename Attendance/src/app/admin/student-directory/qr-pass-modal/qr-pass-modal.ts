import { Component, computed, effect, input, output, signal } from '@angular/core';
import QRCode from 'qrcode';
import { FACTIONS, Student } from '../student';

@Component({
  selector: 'app-qr-pass-modal',
  imports: [],
  templateUrl: './qr-pass-modal.html',
  styleUrl: './qr-pass-modal.scss',
})
export class QrPassModal {
  readonly student = input.required<Student>();
  readonly close = output<void>();

  protected readonly qrDataUrl = signal<string | null>(null);
  protected readonly qrError = signal(false);
  protected readonly factionLabel = computed(() =>
    FACTIONS.find((faction) => faction.id === this.student().factionId)?.label ?? this.student().factionId,
  );

  constructor() {
    // Re-encode the pass whenever the target student changes.
    effect(() => {
      const student = this.student();
      const payload = JSON.stringify({ studentId: student.id, name: student.name });
      this.qrDataUrl.set(null);
      this.qrError.set(false);
      QRCode.toDataURL(payload, { width: 240, margin: 1, color: { dark: '#0c1322', light: '#ffffff' } })
        .then((dataUrl) => this.qrDataUrl.set(dataUrl))
        .catch(() => this.qrError.set(true));
    });
  }

  protected onCancel(): void {
    this.close.emit();
  }

  protected onPrint(): void {
    window.print();
  }
}
