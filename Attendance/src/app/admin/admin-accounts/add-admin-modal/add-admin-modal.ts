import { Component, computed, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FACTIONS, Faction, FactionId } from '../../student-directory/student';
import { AdviserScope, NewAdminAccountInput, SYSTEM_ROLES, SystemRole, SystemRoleId } from '../admin-account';

type ScopeMode = 'faction' | 'global' | 'custom';

interface AddAdminForm {
  name: FormControl<string>;
  email: FormControl<string>;
  employeeId: FormControl<string>;
  password: FormControl<string>;
  role: FormControl<SystemRoleId | ''>;
  customScopeLabel: FormControl<string>;
}

const PASSWORD_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#$%';

@Component({
  selector: 'app-add-admin-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './add-admin-modal.html',
  styleUrl: './add-admin-modal.scss',
})
export class AddAdminModal {
  protected readonly systemRoles: readonly SystemRole[] = SYSTEM_ROLES;
  protected readonly factions: readonly Faction[] = FACTIONS;

  protected readonly scopeMode = signal<ScopeMode>('faction');
  protected readonly selectedFactionId = signal<FactionId | ''>('');
  protected readonly isPasswordRevealed = signal(false);
  protected readonly scopeTouched = signal(false);

  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly create = output<NewAdminAccountInput>();
  readonly close = output<void>();

  protected readonly form = new FormGroup<AddAdminForm>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    employeeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    role: new FormControl<SystemRoleId | ''>('', { nonNullable: true, validators: [Validators.required] }),
    customScopeLabel: new FormControl('', { nonNullable: true }),
  });

  protected readonly scopeInvalid = computed(
    () => this.scopeTouched() && this.scopeMode() === 'faction' && !this.selectedFactionId(),
  );

  protected isScopeMode(mode: ScopeMode): boolean {
    return this.scopeMode() === mode;
  }

  protected setScopeMode(mode: ScopeMode): void {
    this.scopeMode.set(mode);
  }

  protected isFactionSelected(factionId: FactionId): boolean {
    return this.selectedFactionId() === factionId;
  }

  protected selectFaction(factionId: FactionId): void {
    this.selectedFactionId.set(factionId);
  }

  protected togglePasswordReveal(): void {
    this.isPasswordRevealed.update((current) => !current);
  }

  protected generatePassword(): void {
    let generated = '';
    for (let index = 0; index < 12; index++) {
      generated += PASSWORD_CHARSET[Math.floor(Math.random() * PASSWORD_CHARSET.length)];
    }
    this.form.controls.password.setValue(generated);
    this.form.controls.password.markAsTouched();
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
    this.scopeTouched.set(true);
    const scopeValid = this.scopeMode() !== 'faction' || Boolean(this.selectedFactionId());

    if (this.form.invalid || !scopeValid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const scope: AdviserScope =
      this.scopeMode() === 'global'
        ? { type: 'global' }
        : this.scopeMode() === 'custom'
          ? { type: 'custom', label: value.customScopeLabel.trim() || 'Custom Scope' }
          : { type: 'faction', factionId: this.selectedFactionId() as FactionId };

    this.create.emit({
      name: value.name.trim(),
      email: value.email.trim(),
      employeeId: value.employeeId.trim(),
      password: value.password,
      role: value.role as SystemRoleId,
      scope,
    });
  }
}
