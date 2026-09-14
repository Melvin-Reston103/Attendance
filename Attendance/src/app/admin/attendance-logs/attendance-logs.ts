import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  AttendanceLogDto,
  AttendanceLogsApi,
  ATTENDANCE_LOGS_API_URL,
} from '../../core/attendance-logs-api';
import { StudentDto, STUDENTS_API_URL, toStudent } from '../../core/students-api';
import { DEPARTMENTS, Department, FACTIONS, Faction, FactionId, Student } from '../student-directory/student';
import {
  AttendanceLog,
  FACTION_REPORT_BADGE_CLASSES,
  Kiosk,
  KioskId,
  KIOSKS,
  LogType,
} from './attendance-log';
import { FactionAverageModal, FactionAverageRow } from './faction-average-modal/faction-average-modal';

/** Event day option for the log date filter. */
interface EventDay {
  id: string;
  label: string;
}

const EVENT_DAYS: readonly EventDay[] = [
  { id: 'day1', label: 'Day 1 - September 23, 2025' },
  { id: 'day2', label: 'Day 2 - September 24, 2026' },
  { id: 'day3', label: 'Day 3 - September 25, 2026' },
  { id: 'day4', label: 'Day 4 - September 26, 2026' },
  { id: 'day5', label: 'Day 5 - September 28, 2026' },
  { id: 'all', label: 'All Event Days' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

/** Converts a `yyyy-MM-dd` date input value into the long-form label stored on scan logs. */
function toScanDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return '';
  }
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Today's date as a `yyyy-MM-dd` string, suitable for a native date input. */
function todayAsIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

@Component({
  selector: 'app-attendance-logs',
  imports: [DecimalPipe, FactionAverageModal],
  templateUrl: './attendance-logs.html',
  styleUrl: './attendance-logs.scss',
})
export class AttendanceLogs {
  protected readonly eventDays: readonly EventDay[] = EVENT_DAYS;
  protected readonly departments: readonly Department[] = DEPARTMENTS;
  protected readonly factions: readonly Faction[] = FACTIONS;
  protected readonly kiosks: readonly Kiosk[] = KIOSKS;
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly factionBadgeClasses = FACTION_REPORT_BADGE_CLASSES;

  private readonly attendanceLogsApi = inject(AttendanceLogsApi);

  private readonly studentsResource = httpResource<StudentDto[]>(() => STUDENTS_API_URL, {
    defaultValue: [],
  });
  private readonly logsResource = httpResource<AttendanceLogDto[]>(() => ATTENDANCE_LOGS_API_URL, {
    defaultValue: [],
  });

  protected readonly isLoadingLogs = computed(
    () => this.studentsResource.isLoading() || this.logsResource.isLoading(),
  );
  protected readonly loadError = computed(
    () => Boolean(this.studentsResource.error()) || Boolean(this.logsResource.error()),
  );

  private readonly studentsById = computed(() => {
    const map = new Map<string, Student>();
    if (this.studentsResource.hasValue()) {
      for (const dto of this.studentsResource.value()) {
        map.set(dto.id, toStudent(dto));
      }
    }
    return map;
  });

  /** Official attendance logs, decorated with the matching student's roster details. */
  private readonly logs = computed<readonly AttendanceLog[]>(() => {
    const studentsById = this.studentsById();
    const decorated: AttendanceLog[] = [];
    const rawLogs = this.logsResource.hasValue() ? this.logsResource.value() : [];
    for (const log of rawLogs) {
      const student = studentsById.get(log.studentId);
      if (!student) {
        continue;
      }
      decorated.push({
        id: log.id,
        scanRef: log.scanRef,
        scanDate: log.scanDate,
        scanTime: log.scanTime,
        studentId: student.id,
        studentName: student.name,
        photoUrl: student.photoUrl,
        course: student.course,
        yearSection: student.yearSection,
        departmentId: student.departmentId,
        factionId: student.factionId,
        logType: log.logType,
        kioskId: log.kioskId,
        verified: log.verified,
      });
    }
    return decorated;
  });

  protected readonly searchTerm = signal('');
  protected readonly selectedEventDayId = signal(EVENT_DAYS[0].id);
  protected readonly selectedLogType = signal<LogType | ''>('');
  protected readonly selectedFactionId = signal<FactionId | ''>('');
  protected readonly selectedKioskId = signal<KioskId | ''>('');
  protected readonly pageSize = signal<number>(PAGE_SIZE_OPTIONS[0]);
  protected readonly currentPage = signal(1);
  protected readonly deletingLogId = signal<number | null>(null);
  protected readonly selectedLogIds = signal<ReadonlySet<number>>(new Set());
  protected readonly isDeletingSelected = signal(false);
  protected readonly deleteErrorMessage = signal<string | null>(null);

  protected readonly isFactionAverageModalOpen = signal(false);
  protected readonly factionAverageDate = signal(todayAsIsoDate());

  /** Per-faction average of time in/out scans against total roster students for the chosen date. */
  protected readonly factionAverageRows = computed<readonly FactionAverageRow[]>(() => {
    const dateLabel = toScanDateLabel(this.factionAverageDate());
    const studentsById = this.studentsById();

    const totalsByFaction = new Map<FactionId, number>();
    for (const student of studentsById.values()) {
      totalsByFaction.set(student.factionId, (totalsByFaction.get(student.factionId) ?? 0) + 1);
    }

    const scansByFaction = new Map<FactionId, { timeIn: number; timeOut: number }>();
    for (const log of this.logs()) {
      if (log.scanDate !== dateLabel) {
        continue;
      }
      const entry = scansByFaction.get(log.factionId) ?? { timeIn: 0, timeOut: 0 };
      if (log.logType === 'TIME IN') {
        entry.timeIn += 1;
      } else {
        entry.timeOut += 1;
      }
      scansByFaction.set(log.factionId, entry);
    }

    return this.factions.map((faction) => {
      const totalStudents = totalsByFaction.get(faction.id) ?? 0;
      const scans = scansByFaction.get(faction.id) ?? { timeIn: 0, timeOut: 0 };
      const timeInPercent = totalStudents > 0 ? (scans.timeIn / totalStudents) * 100 : 0;
      const timeOutPercent = totalStudents > 0 ? (scans.timeOut / totalStudents) * 100 : 0;
      return {
        factionId: faction.id,
        factionLabel: faction.label,
        badgeClasses: this.factionBadgeClasses[faction.id],
        totalStudents,
        timeInCount: scans.timeIn,
        timeOutCount: scans.timeOut,
        timeInPercent,
        timeOutPercent,
      };
    });
  });

  private readonly filteredLogs = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const logType = this.selectedLogType();
    const factionId = this.selectedFactionId();
    const kioskId = this.selectedKioskId();

    return this.logs().filter((log) => {
      const matchesLogType = !logType || log.logType === logType;
      const matchesFaction = !factionId || log.factionId === factionId;
      const matchesKiosk = !kioskId || log.kioskId === kioskId;
      const matchesTerm =
        !term ||
        log.studentName.toLowerCase().includes(term) ||
        log.studentId.toLowerCase().includes(term) ||
        log.scanRef.toLowerCase().includes(term);
      return matchesLogType && matchesFaction && matchesKiosk && matchesTerm;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredLogs().length / this.pageSize())),
  );

  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  protected readonly pagedLogs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredLogs().slice(start, start + this.pageSize());
  });

  protected readonly rangeStart = computed(() =>
    this.filteredLogs().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );

  protected readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredLogs().length),
  );

  protected readonly totalFilteredCount = computed(() => this.filteredLogs().length);
  protected readonly selectedLogCount = computed(() => this.selectedLogIds().size);
  protected readonly areAllFilteredLogsSelected = computed(() => {
    const logs = this.filteredLogs();
    const selectedIds = this.selectedLogIds();
    return logs.length > 0 && logs.every((log) => selectedIds.has(log.id));
  });

  protected onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  protected onEventDayChange(value: string): void {
    this.selectedEventDayId.set(value);
    this.currentPage.set(1);
  }

  protected onLogTypeChange(value: string): void {
    this.selectedLogType.set(value as LogType | '');
    this.currentPage.set(1);
  }

  protected onFactionChange(value: string): void {
    this.selectedFactionId.set(value as FactionId | '');
    this.currentPage.set(1);
  }

  protected onKioskChange(value: string): void {
    this.selectedKioskId.set(value as KioskId | '');
    this.currentPage.set(1);
  }

  protected onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  protected initials(studentName: string): string {
    return studentName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  protected departmentLabel(departmentId: AttendanceLog['departmentId']): string {
    return this.departments.find((department) => department.id === departmentId)?.label ?? departmentId;
  }

  protected factionLabel(factionId: FactionId): string {
    return this.factions.find((faction) => faction.id === factionId)?.label ?? factionId;
  }

  protected deleteLog(log: AttendanceLog): void {
    if (this.deletingLogId() !== null || this.isDeletingSelected()) {
      return;
    }

    const confirmed = window.confirm(`Delete the ${log.logType} record for ${log.studentName}?`);
    if (!confirmed) {
      return;
    }

    this.deleteErrorMessage.set(null);
    this.deletingLogId.set(log.id);
    this.attendanceLogsApi.delete(log.id).subscribe({
      next: () => {
        this.deletingLogId.set(null);
        this.selectedLogIds.update((ids) => {
          const next = new Set(ids);
          next.delete(log.id);
          return next;
        });
        this.logsResource.reload();
      },
      error: () => {
        this.deletingLogId.set(null);
        this.deleteErrorMessage.set('Unable to delete the attendance record. Please try again.');
      },
    });
  }

  protected toggleLogSelection(logId: number, selected: boolean): void {
    this.selectedLogIds.update((ids) => {
      const next = new Set(ids);
      if (selected) {
        next.add(logId);
      } else {
        next.delete(logId);
      }
      return next;
    });
  }

  protected toggleAllFilteredLogs(selected: boolean): void {
    const filteredIds = this.filteredLogs().map((log) => log.id);
    this.selectedLogIds.update((ids) => {
      const next = new Set(ids);
      for (const id of filteredIds) {
        if (selected) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }

  protected deleteSelectedLogs(): void {
    const ids = [...this.selectedLogIds()];
    if (ids.length === 0 || this.isDeletingSelected() || this.deletingLogId() !== null) {
      return;
    }

    const confirmed = window.confirm(`Delete ${ids.length} selected attendance record(s)? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.deleteErrorMessage.set(null);
    this.isDeletingSelected.set(true);
    this.attendanceLogsApi.deleteBulk(ids).subscribe({
      next: () => {
        this.isDeletingSelected.set(false);
        this.selectedLogIds.set(new Set());
        this.currentPage.set(1);
        this.logsResource.reload();
      },
      error: () => {
        this.isDeletingSelected.set(false);
        this.deleteErrorMessage.set('Unable to delete the selected attendance records. Please try again.');
      },
    });
  }

  protected printOfficialLogSheet(): void {
    window.print();
  }

  protected openFactionAverageModal(): void {
    this.isFactionAverageModalOpen.set(true);
  }

  protected closeFactionAverageModal(): void {
    this.isFactionAverageModalOpen.set(false);
  }

  protected onFactionAverageDateChange(value: string): void {
    this.factionAverageDate.set(value);
  }
}
