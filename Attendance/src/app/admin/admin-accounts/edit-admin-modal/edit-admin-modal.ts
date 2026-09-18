import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminAccount, AdviserScope, SYSTEM_ROLES, SystemRole, SystemRoleId } from '../admin-account';
import { UpdateAdminAccountInput } from '../../../core/admin-accounts-api';
import { FACTIONS, FactionId } from '../../student-directory/student';

interface EditAdminForm {
  name: FormControl<string>;
  employeeId: FormControl<string>;
  password: FormControl<string>;
  role: FormControl<SystemRoleId | ''>;
  scope: FormControl<FactionId | 'global' | 'custom'>;
  scopeLabel: FormControl<string>;
}

@Component({
  selector: 'app-edit-admin-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-admin-modal.html',
  styleUrl: './edit-admin-modal.scss',
})
export class EditAdminModal {
  readonly account = input.required<AdminAccount>();
  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly save = output<UpdateAdminAccountInput>();
  readonly close = output<void>();

  protected readonly systemRoles: readonly SystemRole[] = SYSTEM_ROLES;
  protected readonly factions = FACTIONS;
  protected readonly form = new FormGroup<EditAdminForm>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    employeeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true }),
    role: new FormControl<SystemRoleId | ''>('', { nonNullable: true, validators: [Validators.required] }),
    scope: new FormControl<FactionId | 'global' | 'custom'>('global', { nonNullable: true }),
    scopeLabel: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const account = this.account();
      this.form.reset({
        name: account.name,
        employeeId: account.employeeId,
        password: '',
        role: account.role,
        scope: account.scope.type === 'faction' ? account.scope.factionId : account.scope.type,
        scopeLabel: account.scope.type === 'custom' ? account.scope.label : '',
      }, { emitEvent: false });
    });
  }

  protected fieldInvalid(fieldName: keyof EditAdminForm): boolean {
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
    const scope: AdviserScope = value.scope === 'global'
      ? { type: 'global' }
      : value.scope === 'custom'
        ? { type: 'custom', label: value.scopeLabel.trim() }
        : { type: 'faction', factionId: value.scope };
    this.save.emit({
      name: value.name.trim(),
      employeeId: value.employeeId.trim(),
      password: value.password.trim() || undefined,
      role: value.role as SystemRoleId,
      scope,
    });
  }
}
