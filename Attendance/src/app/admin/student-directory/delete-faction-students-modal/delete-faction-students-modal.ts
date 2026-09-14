import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-delete-faction-students-modal',
  imports: [],
  templateUrl: './delete-faction-students-modal.html',
  styleUrl: './delete-faction-students-modal.scss',
})
export class DeleteFactionStudentsModal {
  readonly factionLabel = input.required<string>();
  readonly studentCount = input.required<number>();
  readonly deleting = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly confirmDelete = output<void>();
  readonly close = output<void>();

  protected onCancel(): void {
    if (!this.deleting()) {
      this.close.emit();
    }
  }

  protected onConfirm(): void {
    this.confirmDelete.emit();
  }
}
