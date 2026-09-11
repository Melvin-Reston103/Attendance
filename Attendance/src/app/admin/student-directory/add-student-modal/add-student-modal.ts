import { Component, computed, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  COURSES_BY_DEPARTMENT,
  DEFAULT_STUDENT_PHOTO_URL,
  DEPARTMENTS,
  Department,
  DepartmentId,
  FACTIONS,
  FACTIONS_BY_DEPARTMENT,
  Faction,
  FactionId,
  NewStudentInput,
} from '../student';

type EntryMode = 'single' | 'bulk';

interface AddStudentForm {
  studentId: FormControl<string>;
  name: FormControl<string>;
  yearSection: FormControl<string>;
  departmentId: FormControl<DepartmentId | ''>;
  factionId: FormControl<FactionId | ''>;
  photoUrl: FormControl<string>;
}

const DEPARTMENT_IDS: readonly DepartmentId[] = DEPARTMENTS.map((department) => department.id);
const FACTION_IDS: readonly FactionId[] = FACTIONS.map((faction) => faction.id);
const CSV_REQUIRED_COLUMNS = ['studentid', 'name', 'course', 'department', 'faction'] as const;

@Component({
  selector: 'app-add-student-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './add-student-modal.html',
  styleUrl: './add-student-modal.scss',
})
export class AddStudentModal {
  protected readonly departments: readonly Department[] = DEPARTMENTS;

  protected readonly entryMode = signal<EntryMode>('single');
  protected readonly courseOptions = signal<readonly string[]>([]);
  protected readonly factionOptions = signal<readonly Faction[]>([]);

  protected readonly selectedFileName = signal<string | null>(null);
  protected readonly parsedStudents = signal<readonly NewStudentInput[]>([]);
  protected readonly parseErrors = signal<readonly string[]>([]);
  protected readonly bulkSubmitLabel = computed(() =>
    this.parsedStudents().length > 0 ? `Upload ${this.parsedStudents().length} Student(s)` : 'Upload Students',
  );

  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly create = output<NewStudentInput>();
  readonly createBulk = output<readonly NewStudentInput[]>();
  readonly close = output<void>();

  protected readonly form = new FormGroup<AddStudentForm>({
    studentId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    yearSection: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    departmentId: new FormControl<DepartmentId | ''>('', { nonNullable: true, validators: [Validators.required] }),
    factionId: new FormControl<FactionId | ''>('', { nonNullable: true, validators: [Validators.required] }),
    photoUrl: new FormControl('', { nonNullable: true }),
  });

  protected isEntryMode(mode: EntryMode): boolean {
    return this.entryMode() === mode;
  }

  protected setEntryMode(mode: EntryMode): void {
    this.entryMode.set(mode);
  }

  protected onDepartmentChange(): void {
    const departmentId = this.form.controls.departmentId.value;
    this.courseOptions.set(departmentId ? COURSES_BY_DEPARTMENT[departmentId] : []);
    this.factionOptions.set(
      departmentId ? FACTIONS.filter((faction) => FACTIONS_BY_DEPARTMENT[departmentId].includes(faction.id)) : [],
    );
    this.form.controls.yearSection.setValue('');
    this.form.controls.factionId.setValue('');
  }

  protected factionDisplayName(faction: Faction): string {
    return faction.label;
  }

  protected isFactionSelected(factionId: FactionId): boolean {
    return this.form.controls.factionId.value === factionId;
  }

  protected selectFaction(factionId: FactionId): void {
    this.form.controls.factionId.setValue(factionId);
    this.form.controls.factionId.markAsTouched();
  }

  protected fieldInvalid(fieldName: keyof AddStudentForm): boolean {
    const control = this.form.controls[fieldName];
    return control.invalid && control.touched;
  }

  protected onCancel(): void {
    this.close.emit();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFileName.set(file?.name ?? null);
    this.parsedStudents.set([]);
    this.parseErrors.set([]);

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const { rows, errors } = this.parseCsv(text);
      this.parsedStudents.set(rows);
      this.parseErrors.set(errors);
    };
    reader.readAsText(file);
  }

  protected onSubmit(): void {
    if (this.entryMode() === 'bulk') {
      if (this.parsedStudents().length === 0) {
        return;
      }
      this.createBulk.emit(this.parsedStudents());
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.create.emit({
      id: value.studentId,
      name: value.name,
      course: value.yearSection,
      yearSection: value.yearSection,
      departmentId: value.departmentId as DepartmentId,
      factionId: value.factionId as FactionId,
      photoUrl: value.photoUrl.trim() || DEFAULT_STUDENT_PHOTO_URL,
    });
  }

  private parseCsv(text: string): { rows: NewStudentInput[]; errors: string[] } {
    const lines = text
      .split(/\r\n|\n|\r/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return { rows: [], errors: ['The CSV file is empty.'] };
    }

    const header = this.parseCsvLine(lines[0]).map((column) => this.normalizeColumnName(column));
    const columnIndex = (name: string): number => {
      const aliases: Record<string, readonly string[]> = {
        studentid: ['studentid', 'id'],
        name: ['name', 'studentinformation', 'fullname', 'studentname'],
        course: ['course', 'courseandsection', 'yearsection'],
        department: ['department', 'departmentid'],
        faction: ['faction', 'factionid', 'intramuralfaction'],
      };
      return aliases[name]?.reduce((index, alias) => (index !== -1 ? index : header.indexOf(alias)), -1) ?? -1;
    };
    const missingColumns = CSV_REQUIRED_COLUMNS.filter((column) => columnIndex(column) === -1);
    if (missingColumns.length > 0) {
      return { rows: [], errors: [`Missing required column(s): ${missingColumns.join(', ')}.`] };
    }

    const idIndex = columnIndex('studentid');
    const nameIndex = columnIndex('name');
    const courseIndex = columnIndex('course');
    const yearSectionIndex = header.indexOf('yearsection');
    const photoIndex = header.indexOf('photourl');

    const rows: NewStudentInput[] = [];
    const errors: string[] = [];

    for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
      const cells = this.parseCsvLine(lines[lineIndex]);
      const rowNumber = lineIndex + 1;
      const id = cells[idIndex] ?? '';
      const name = cells[nameIndex] ?? '';
      const course = cells[courseIndex] ?? '';
      const yearSection = yearSectionIndex === -1 ? course : (cells[yearSectionIndex] ?? '');
      const departmentValue = cells[columnIndex('department')] ?? '';
      const factionValue = cells[columnIndex('faction')] ?? '';
      const photoUrl = photoIndex === -1 ? '' : (cells[photoIndex] ?? '');
      const departmentId = this.departmentIdFromValue(departmentValue);
      const factionId = this.factionIdFromValue(factionValue);

      if (!id || !name || !course || !yearSection || !departmentId || !factionId) {
        errors.push(`Row ${rowNumber}: missing required value(s).`);
        continue;
      }
      if (!DEPARTMENT_IDS.includes(departmentId as DepartmentId)) {
        errors.push(`Row ${rowNumber}: invalid department "${departmentId}".`);
        continue;
      }
      if (!FACTION_IDS.includes(factionId as FactionId)) {
        errors.push(`Row ${rowNumber}: invalid faction "${factionId}".`);
        continue;
      }

      rows.push({
        id,
        name,
        course,
        yearSection,
        departmentId: departmentId as DepartmentId,
        factionId: factionId as FactionId,
        photoUrl: photoUrl || DEFAULT_STUDENT_PHOTO_URL,
      });
    }

    return { rows, errors };
  }

  private parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let cell = '';
    let quoted = false;

    for (let index = 0; index < line.length; index++) {
      const character = line[index];
      const nextCharacter = line[index + 1];
      if (character === '"' && quoted && nextCharacter === '"') {
        cell += '"';
        index++;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === ',' && !quoted) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += character;
      }
    }

    cells.push(cell.trim());
    return cells;
  }

  private normalizeColumnName(column: string): string {
    return column.replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private departmentIdFromValue(value: string): string {
    const normalizedValue = this.normalizeColumnName(value);
    return DEPARTMENTS.find(
      (department) => department.id === value || this.normalizeColumnName(department.label) === normalizedValue,
    )?.id ?? value;
  }

  private factionIdFromValue(value: string): string {
    const normalizedValue = this.normalizeColumnName(value);
    return FACTIONS.find(
      (faction) => faction.id === value || this.normalizeColumnName(faction.label) === normalizedValue,
    )?.id ?? value;
  }
}

