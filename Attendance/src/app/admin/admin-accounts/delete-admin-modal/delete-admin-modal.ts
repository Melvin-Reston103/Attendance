import { Component, input, output } from '@angular/core';
import { AdminAccount } from '../admin-account';

@Component({
  selector: 'app-delete-admin-modal',
  imports: [],
  templateUrl: './delete-admin-modal.html',
  styleUrl: './delete-admin-modal.scss',
})
export class DeleteAdminModal {
  readonly account = input.required<AdminAccount>();
  readonly deleting = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly confirmDelete = output<void>();
  readonly close = output<void>();

  protected onCancel(): void { this.close.emit(); }
  protected onConfirm(): void { this.confirmDelete.emit(); }
}
