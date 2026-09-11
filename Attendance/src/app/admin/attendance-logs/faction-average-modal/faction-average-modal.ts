import { Component, computed, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

/** Per-faction attendance average summary for a specific event date. */
export interface FactionAverageRow {
  factionId: string;
  factionLabel: string;
  badgeClasses: string;
  totalStudents: number;
  timeInCount: number;
  timeOutCount: number;
  timeInPercent: number;
  timeOutPercent: number;
}

/** Which log type average to display in the summary table. */
export type FactionAverageLogTypeFilter = 'all' | 'TIME IN' | 'TIME OUT';

@Component({
  selector: 'app-faction-average-modal',
  imports: [DecimalPipe],
  templateUrl: './faction-average-modal.html',
  styleUrl: './faction-average-modal.scss',
})
export class FactionAverageModal {
  readonly rows = input.required<readonly FactionAverageRow[]>();
  readonly selectedDate = input.required<string>();

  readonly dateChange = output<string>();
  readonly close = output<void>();

  protected readonly logTypeFilter = signal<FactionAverageLogTypeFilter>('all');
  protected readonly showTimeIn = computed(() => this.logTypeFilter() !== 'TIME OUT');
  protected readonly showTimeOut = computed(() => this.logTypeFilter() !== 'TIME IN');

  protected onCancel(): void {
    this.close.emit();
  }

  protected onDateChange(value: string): void {
    this.dateChange.emit(value);
  }

  protected onLogTypeFilterChange(value: string): void {
    this.logTypeFilter.set(value as FactionAverageLogTypeFilter);
  }
}
