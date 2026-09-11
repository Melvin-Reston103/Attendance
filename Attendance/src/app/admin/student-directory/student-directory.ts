import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { StudentDto, StudentsApi, STUDENTS_API_URL, toStudent, UpdateStudentInput } from '../../core/students-api';
import { AddStudentModal } from './add-student-modal/add-student-modal';
import { EditStudentModal } from './edit-student-modal/edit-student-modal';
import { QrPassModal } from './qr-pass-modal/qr-pass-modal';
import { DeleteStudentModal } from './delete-student-modal/delete-student-modal';
import { BatchExportQrModal } from './batch-export-qr-modal/batch-export-qr-modal';
import {
  DEPARTMENTS,
  Department,
  DepartmentId,
  FACTIONS,
  Faction,
  FactionId,
  NewStudentInput,
  Student,
} from './student';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

@Component({
  selector: 'app-student-directory',
  imports: [
    AddStudentModal,
    EditStudentModal,
    QrPassModal,
    DeleteStudentModal,
    BatchExportQrModal,
    DecimalPipe,
  ],
  templateUrl: './student-directory.html',
  styleUrl: './student-directory.scss',
})
export class StudentDirectory {
  protected readonly departments: readonly Department[] = DEPARTMENTS;
  protected readonly factions: readonly Faction[] = FACTIONS;
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  private readonly studentsApi = inject(StudentsApi);
  private readonly studentsResource = httpResource<StudentDto[]>(() => STUDENTS_API_URL, {
    defaultValue: [],
  });

  protected readonly students = computed<readonly Student[]>(() =>
    (this.studentsResource.hasValue() ? this.studentsResource.value() : []).map(toStudent),
  );
  protected readonly isLoadingStudents = this.studentsResource.isLoading;
  protected readonly loadError = computed(() => Boolean(this.studentsResource.error()));

  protected readonly searchTerm = signal('');
  protected readonly selectedDepartmentId = signal<DepartmentId | ''>('');
  protected readonly selectedFactionId = signal<FactionId | ''>('');
  protected readonly pageSize = signal<number>(PAGE_SIZE_OPTIONS[0]);
  protected readonly currentPage = signal(1);
  protected readonly openActionMenuStudentId = signal<string | null>(null);
  protected readonly isAddStudentModalOpen = signal(false);
  protected readonly isSavingStudent = signal(false);
  protected readonly addStudentError = signal<string | null>(null);

  protected readonly editingStudent = signal<Student | null>(null);
  protected readonly isSavingEdit = signal(false);
  protected readonly editStudentError = signal<string | null>(null);

  protected readonly qrPassStudent = signal<Student | null>(null);

  protected readonly isBatchExportQrModalOpen = signal(false);

  protected readonly deletingStudent = signal<Student | null>(null);
  protected readonly isDeletingStudent = signal(false);
  protected readonly deleteStudentError = signal<string | null>(null);

  protected readonly filteredStudents = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const departmentId = this.selectedDepartmentId();
    const factionId = this.selectedFactionId();

    return this.students().filter((student) => {
      const matchesDepartment = !departmentId || student.departmentId === departmentId;
      const matchesFaction = !factionId || student.factionId === factionId;
      const matchesTerm =
        !term ||
        student.name.toLowerCase().includes(term) ||
        student.id.toLowerCase().includes(term) ||
        student.course.toLowerCase().includes(term) ||
        this.factionLabel(student.factionId).toLowerCase().includes(term);
      return matchesDepartment && matchesFaction && matchesTerm;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredStudents().length / this.pageSize())),
  );

  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  protected readonly pagedStudents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredStudents().slice(start, start + this.pageSize());
  });

  protected readonly rangeStart = computed(() =>
    this.filteredStudents().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );

  protected readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredStudents().length),
  );

  protected readonly totalFilteredCount = computed(() => this.filteredStudents().length);
  protected readonly totalStudentCount = computed(() => this.students().length);

  protected onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  protected onDepartmentChange(value: string): void {
    this.selectedDepartmentId.set(value as DepartmentId | '');
    this.currentPage.set(1);
  }

  protected onFactionChange(value: string): void {
    this.selectedFactionId.set(value as FactionId | '');
    this.currentPage.set(1);
  }

  protected onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  protected toggleActionMenu(studentId: string): void {
    this.openActionMenuStudentId.update((current) => (current === studentId ? null : studentId));
  }

  protected openEditStudentModal(student: Student): void {
    this.openActionMenuStudentId.set(null);
    this.editStudentError.set(null);
    this.editingStudent.set(student);
  }

  protected closeEditStudentModal(): void {
    this.editingStudent.set(null);
    this.editStudentError.set(null);
  }

  protected saveEditedStudent(update: UpdateStudentInput): void {
    const student = this.editingStudent();
    if (!student) {
      return;
    }
    this.isSavingEdit.set(true);
    this.editStudentError.set(null);
    this.studentsApi.update(student.id, update).subscribe({
      next: () => {
        this.isSavingEdit.set(false);
        this.editingStudent.set(null);
        this.studentsResource.reload();
      },
      error: () => {
        this.isSavingEdit.set(false);
        this.editStudentError.set('Unable to save changes. Please try again.');
      },
    });
  }

  protected openQrPassModal(student: Student): void {
    this.openActionMenuStudentId.set(null);
    this.qrPassStudent.set(student);
  }

  protected closeQrPassModal(): void {
    this.qrPassStudent.set(null);
  }

  protected openBatchExportQrModal(): void {
    this.isBatchExportQrModalOpen.set(true);
  }

  protected closeBatchExportQrModal(): void {
    this.isBatchExportQrModalOpen.set(false);
  }

  protected openDeleteStudentModal(student: Student): void {
    this.openActionMenuStudentId.set(null);
    this.deleteStudentError.set(null);
    this.deletingStudent.set(student);
  }

  protected closeDeleteStudentModal(): void {
    this.deletingStudent.set(null);
    this.deleteStudentError.set(null);
  }

  protected confirmDeleteStudent(): void {
    const student = this.deletingStudent();
    if (!student) {
      return;
    }
    this.isDeletingStudent.set(true);
    this.deleteStudentError.set(null);
    this.studentsApi.delete(student.id).subscribe({
      next: () => {
        this.isDeletingStudent.set(false);
        this.deletingStudent.set(null);
        this.studentsResource.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.isDeletingStudent.set(false);
        this.deleteStudentError.set(
          error.status === 409
            ? 'Cannot delete a student with existing attendance logs.'
            : 'Unable to delete the student. Please try again.',
        );
      },
    });
  }

  protected openAddStudentModal(): void {
    this.addStudentError.set(null);
    this.isAddStudentModalOpen.set(true);
  }

  protected closeAddStudentModal(): void {
    this.isAddStudentModalOpen.set(false);
    this.addStudentError.set(null);
  }

  protected addStudent(newStudent: NewStudentInput): void {
    this.isSavingStudent.set(true);
    this.addStudentError.set(null);
    this.studentsApi.create(newStudent).subscribe({
      next: () => {
        this.isSavingStudent.set(false);
        this.isAddStudentModalOpen.set(false);
        this.studentsResource.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingStudent.set(false);
        this.addStudentError.set(
          error.status === 409
            ? 'A student with this ID already exists.'
            : 'Unable to save the student. Please try again.',
        );
      },
    });
  }

  protected addStudentsBulk(students: readonly NewStudentInput[]): void {
    this.isSavingStudent.set(true);
    this.addStudentError.set(null);
    this.studentsApi.createBulk(students).subscribe({
      next: (result) => {
        this.isSavingStudent.set(false);
        this.studentsResource.reload();
        if (result.failed.length > 0) {
          this.addStudentError.set(
            `${result.created.length} student(s) added, ${result.failed.length} row(s) failed (duplicate IDs or invalid data).`,
          );
          return;
        }
        this.isAddStudentModalOpen.set(false);
      },
      error: () => {
        this.isSavingStudent.set(false);
        this.addStudentError.set('Unable to upload students. Please try again.');
      },
    });
  }

  protected departmentLabel(departmentId: DepartmentId): string {
    return this.departments.find((department) => department.id === departmentId)?.label ?? departmentId;
  }

  protected faction(factionId: FactionId): Faction {
    return this.factions.find((faction) => faction.id === factionId)!;
  }

  protected factionLabel(factionId: FactionId): string {
    return this.faction(factionId).label;
  }
}

