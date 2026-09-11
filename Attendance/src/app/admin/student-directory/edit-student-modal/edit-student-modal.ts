import { Component, effect, input, output, signal } from '@angular/core';
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
  Student,
} from '../student';
import { UpdateStudentInput } from '../../../core/students-api';

interface EditStudentForm {
  name: FormControl<string>;
  yearSection: FormControl<string>;
  departmentId: FormControl<DepartmentId | ''>;
  factionId: FormControl<FactionId | ''>;
  photoUrl: FormControl<string>;
}

@Component({
  selector: 'app-edit-student-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-student-modal.html',
  styleUrl: './edit-student-modal.scss',
})
export class EditStudentModal {
  protected readonly departments: readonly Department[] = DEPARTMENTS;

  readonly student = input.required<Student>();
  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly save = output<UpdateStudentInput>();
  readonly close = output<void>();

  protected readonly courseOptions = signal<readonly string[]>([]);
  protected readonly factionOptions = signal<readonly Faction[]>([]);

  protected readonly form = new FormGroup<EditStudentForm>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    yearSection: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    departmentId: new FormControl<DepartmentId | ''>('', { nonNullable: true, validators: [Validators.required] }),
    factionId: new FormControl<FactionId | ''>('', { nonNullable: true, validators: [Validators.required] }),
    photoUrl: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    // Prime the form and dependent option lists whenever the target student input changes.
    effect(() => {
      const student = this.student();
      this.courseOptions.set(COURSES_BY_DEPARTMENT[student.departmentId]);
      this.factionOptions.set(
        FACTIONS.filter((faction) => FACTIONS_BY_DEPARTMENT[student.departmentId].includes(faction.id)),
      );
      this.form.setValue({
        name: student.name,
        yearSection: student.yearSection,
        departmentId: student.departmentId,
        factionId: student.factionId,
        photoUrl: student.photoUrl,
      });
    });
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

  protected isFactionSelected(factionId: FactionId): boolean {
    return this.form.controls.factionId.value === factionId;
  }

  protected selectFaction(factionId: FactionId): void {
    this.form.controls.factionId.setValue(factionId);
    this.form.controls.factionId.markAsTouched();
  }

  protected fieldInvalid(fieldName: keyof EditStudentForm): boolean {
    const control = this.form.controls[fieldName];
    return control.invalid && control.touched;
  }

  protected onCancel(): void {
    this.close.emit();
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.save.emit({
      name: value.name,
      course: value.yearSection,
      yearSection: value.yearSection,
      departmentId: value.departmentId as DepartmentId,
      factionId: value.factionId as FactionId,
      photoUrl: value.photoUrl.trim() || DEFAULT_STUDENT_PHOTO_URL,
    });
  }
}
