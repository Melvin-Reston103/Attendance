import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { AttendanceRecord } from '../attendance-record';

const AUTO_RESET_SECONDS = 4;

@Component({
  selector: 'app-confirmation-modal',
  imports: [],
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.scss',
})
export class ConfirmationModal {
  readonly record = input.required<AttendanceRecord>();
  readonly confirmNext = output<void>();
  readonly printSlip = output<void>();

  protected readonly secondsRemaining = signal(AUTO_RESET_SECONDS);
  protected readonly progressPercent = computed(
    () => ((AUTO_RESET_SECONDS - this.secondsRemaining()) / AUTO_RESET_SECONDS) * 100,
  );

  constructor() {
    // Auto-advance to the next student, mirroring the kiosk's "auto-resetting" countdown.
    const intervalId = setInterval(() => {
      const secondsLeft = this.secondsRemaining();
      if (secondsLeft <= 1) {
        this.secondsRemaining.set(AUTO_RESET_SECONDS);
        this.confirmNext.emit();
        return;
      }
      this.secondsRemaining.set(secondsLeft - 1);
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalId));
  }

  protected onConfirmClick(): void {
    this.confirmNext.emit();
  }

  protected onPrintClick(): void {
    this.printSlip.emit();
  }
}
