import { Component, computed, effect, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import QRCode from 'qrcode';
import {
  DEPARTMENTS,
  Department,
  DepartmentId,
  FACTIONS,
  Faction,
  FactionId,
  Student,
} from '../student';

interface StudentQrPass {
  student: Student;
  qrDataUrl: string | null;
  error: boolean;
}

/** Number of QR codes generated per batch, keeping change detection/render churn low for large rosters. */
const BATCH_SIZE = 20;

/** Badge sheet layouts offered on the export panel, keyed by cards printed per page. */
const SHEET_SIZE_OPTIONS = [8, 10, 12, 15, 20, 24] as const;
type SheetSize = (typeof SHEET_SIZE_OPTIONS)[number];

/** Grid columns/rows used to pack each sheet size tightly onto one Letter page. */
const SHEET_LAYOUTS: Record<SheetSize, { cols: number; rows: number }> = {
  8: { cols: 4, rows: 2 },
  10: { cols: 5, rows: 2 },
  12: { cols: 4, rows: 3 },
  15: { cols: 5, rows: 3 },
  20: { cols: 5, rows: 4 },
  24: { cols: 6, rows: 4 },
};

/** Top color bar gradient per faction, mirrors the faction accent colors used elsewhere. */
const FACTION_BAR_CLASSES: Record<FactionId, string> = {
  'duces-mercaturae': 'from-indigo-600 to-indigo-400 border-indigo-500/40',
  'luminary-acharya': 'from-purple-600 to-fuchsia-400 border-purple-500/40',
  'gray-wolves': 'from-slate-600 to-slate-400 border-slate-500/40',
  'blue-bobcat': 'from-sky-600 to-cyan-400 border-sky-500/40',
  'golden-falcon': 'from-amber-500 to-yellow-400 border-amber-500/40',
};

@Component({
  selector: 'app-batch-export-qr-modal',
  imports: [NgTemplateOutlet],
  templateUrl: './batch-export-qr-modal.html',
  styleUrl: './batch-export-qr-modal.scss',
})
export class BatchExportQrModal {
  readonly students = input.required<readonly Student[]>();
  readonly close = output<void>();

  protected readonly departments: readonly Department[] = DEPARTMENTS;
  protected readonly factions: readonly Faction[] = FACTIONS;
  protected readonly sheetSizeOptions = SHEET_SIZE_OPTIONS;

  protected readonly selectedFactionId = signal<FactionId | ''>('');
  protected readonly selectedDepartmentId = signal<DepartmentId | ''>('');
  protected readonly showFactionBar = signal(true);
  protected readonly showCourseSection = signal(true);
  protected readonly sheetSize = signal<SheetSize>(8);
  protected readonly currentPage = signal(1);

  protected readonly maxCount = computed(() => this.students().length);
  protected readonly studentsToExport = computed(() => {
    const factionId = this.selectedFactionId();
    const departmentId = this.selectedDepartmentId();
    return this.students().filter(
      (student) =>
        (!factionId || student.factionId === factionId) &&
        (!departmentId || student.departmentId === departmentId),
    );
  });

  protected readonly isGenerating = signal(true);
  protected readonly passes = signal<readonly StudentQrPass[]>([]);
  protected readonly generatedCount = computed(() => this.passes().length);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.studentsToExport().length / this.sheetSize())),
  );
  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );
  protected readonly pagedPasses = computed(() => {
    const start = (this.currentPage() - 1) * this.sheetSize();
    return this.passes().slice(start, start + this.sheetSize());
  });
  protected readonly rangeStart = computed(() =>
    this.studentsToExport().length === 0 ? 0 : (this.currentPage() - 1) * this.sheetSize() + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.sheetSize(), this.studentsToExport().length),
  );

  /** All generated passes chunked into Letter-size print pages, one chunk per printed sheet. */
  protected readonly printPages = computed(() => {
    const size = this.sheetSize();
    const items = this.passes();
    const pages: StudentQrPass[][] = [];
    for (let start = 0; start < items.length; start += size) {
      pages.push(items.slice(start, start + size));
    }
    return pages.length ? pages : [[]];
  });

  constructor() {
    effect(() => {
      void this.generatePasses(this.studentsToExport());
    });
  }

  protected onFactionChange(value: string): void {
    this.selectedFactionId.set(value as FactionId | '');
    this.currentPage.set(1);
  }

  protected onDepartmentChange(value: string): void {
    this.selectedDepartmentId.set(value as DepartmentId | '');
    this.currentPage.set(1);
  }

  protected onSheetSizeChange(value: string): void {
    this.sheetSize.set(Number(value) as SheetSize);
    this.currentPage.set(1);
  }

  protected onResetFilters(): void {
    this.selectedFactionId.set('');
    this.selectedDepartmentId.set('');
    this.sheetSize.set(8);
    this.showFactionBar.set(true);
    this.showCourseSection.set(true);
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  protected factionLabel(factionId: FactionId): string {
    return this.factions.find((faction) => faction.id === factionId)?.label ?? factionId;
  }

  protected factionBarClasses(factionId: FactionId): string {
    return FACTION_BAR_CLASSES[factionId];
  }

  protected departmentLabel(departmentId: DepartmentId): string {
    return this.departments.find((department) => department.id === departmentId)?.label ?? departmentId;
  }

  /** Grid template (columns x rows) sized to pack cards tightly onto one Letter page. */
  protected printPageGridStyle(): string {
    const { cols, rows } = SHEET_LAYOUTS[this.sheetSize()];
    return `grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, auto);`;
  }

  private async generatePasses(students: readonly Student[]): Promise<void> {
    this.isGenerating.set(true);
    this.passes.set([]);

    const passes: StudentQrPass[] = [];
    for (let start = 0; start < students.length; start += BATCH_SIZE) {
      const batch = students.slice(start, start + BATCH_SIZE);
      const batchPasses = await Promise.all(batch.map((student) => this.generatePass(student)));
      passes.push(...batchPasses);
      this.passes.set([...passes]);
      // Yield to the event loop between batches so the UI stays responsive on large rosters.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    this.isGenerating.set(false);
  }

  private async generatePass(student: Student): Promise<StudentQrPass> {
    const payload = JSON.stringify({ studentId: student.id, name: student.name });
    try {
      const qrDataUrl = await QRCode.toDataURL(payload, {
        width: 200,
        margin: 1,
        color: { dark: '#0c1322', light: '#ffffff' },
      });
      return { student, qrDataUrl, error: false };
    } catch {
      return { student, qrDataUrl: null, error: true };
    }
  }

  protected onCancel(): void {
    this.close.emit();
  }

  protected onPrint(): void {
    window.print();
  }

  protected onExportCsv(): void {
    const header = ['Student ID', 'Name', 'Department', 'Course', 'Year & Section', 'Faction'];
    const rows = this.studentsToExport().map((student) => [
      student.id,
      student.name,
      this.departmentLabel(student.departmentId),
      student.course,
      student.yearSection,
      this.factionLabel(student.factionId),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qr-pass-export-index.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
