import { Component, computed, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdviserScope, NewAdminAccountInput, SYSTEM_ROLES, SystemRole, SystemRoleId } from '../admin-account';
import { FACTIONS, FactionId } from '../../student-directory/student';

interface AddAdminForm {
  name: FormControl<string>;
  employeeId: FormControl<string>;
  role: FormControl<SystemRoleId | ''>;
  scope: FormControl<FactionId | 'global'>;
}

const PASSWORD_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#$%';

function randomPassword(): string {
  let generated = 'SMCH-Pass!';
  for (let index = 0; index < 6; index++) {
    generated += PASSWORD_CHARSET[Math.floor(Math.random() * PASSWORD_CHARSET.length)];
  }
  return generated;
}

@Component({
  selector: 'app-add-admin-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './add-admin-modal.html',
  styleUrl: './add-admin-modal.scss',
})
export class AddAdminModal {
  protected readonly systemRoles: readonly SystemRole[] = SYSTEM_ROLES;
  protected readonly factions = FACTIONS;
  protected readonly isPasswordRevealed = signal(false);
  protected readonly password = signal(randomPassword());

  protected readonly maskedPassword = computed(() => '•'.repeat(this.password().length));

  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly create = output<NewAdminAccountInput>();
  readonly close = output<void>();

  protected readonly form = new FormGroup<AddAdminForm>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    employeeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    role: new FormControl<SystemRoleId | ''>('', { nonNullable: true, validators: [Validators.required] }),
    scope: new FormControl<FactionId | 'global'>('global', { nonNullable: true }),
  });

  protected togglePasswordReveal(): void {
    this.isPasswordRevealed.update((current) => !current);
  }

  protected generatePassword(): void {
    this.password.set(randomPassword());
    this.isPasswordRevealed.set(true);
  }

  protected fieldInvalid(fieldName: keyof AddAdminForm): boolean {
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
      : { type: 'faction', factionId: value.scope };
    const email = `${value.employeeId.trim().toLowerCase()}@smch.edu.ph`;

    this.create.emit({
      name: value.name.trim(),
      email,
      employeeId: value.employeeId.trim(),
      password: this.password(),
      role: value.role as SystemRoleId,
      scope,
    });
  }
}
