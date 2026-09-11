import { Component, input, output } from '@angular/core';
import { Student } from '../student';

@Component({
  selector: 'app-delete-student-modal',
  imports: [],
  templateUrl: './delete-student-modal.html',
  styleUrl: './delete-student-modal.scss',
})
export class DeleteStudentModal {
  readonly student = input.required<Student>();
  readonly deleting = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly confirmDelete = output<void>();
  readonly close = output<void>();

  protected onCancel(): void {
    this.close.emit();
  }

  protected onConfirm(): void {
    this.confirmDelete.emit();
  }
}
