import { Component, computed, signal } from '@angular/core';
import {
  ADMIN_ACCOUNTS,
  AdminAccount,
  avatarClassesForId,
  initialsFromName,
  NewAdminAccountInput,
  scopeDotClasses,
  scopeLabel,
  SYSTEM_ROLES,
  SystemRoleId,
  systemRole,
} from './admin-account';
import { FACTIONS, FactionId } from '../student-directory/student';
import { AddAdminModal } from './add-admin-modal/add-admin-modal';

const PAGE_SIZE = 7;

@Component({
  selector: 'app-admin-accounts',
  imports: [AddAdminModal],
  templateUrl: './admin-accounts.html',
  styleUrl: './admin-accounts.scss',
})
export class AdminAccounts {
  protected readonly systemRoles = SYSTEM_ROLES;
  protected readonly factions = FACTIONS;

  private readonly accounts = signal<readonly AdminAccount[]>(ADMIN_ACCOUNTS);

  protected readonly searchTerm = signal('');
  protected readonly selectedRoleId = signal<SystemRoleId | ''>('');
  protected readonly selectedScopeFilter = signal<FactionId | 'global' | ''>('');
  protected readonly selectedStatus = signal<'active' | 'inactive' | ''>('');
  protected readonly currentPage = signal(1);
  protected readonly revealedPasswordIds = signal<ReadonlySet<string>>(new Set());
  protected readonly openActionMenuAccountId = signal<string | null>(null);

  protected readonly isAddAdminModalOpen = signal(false);
  protected readonly isSavingAdmin = signal(false);
  protected readonly addAdminError = signal<string | null>(null);

  protected readonly totalAccountCount = computed(() => this.accounts().length);
  protected readonly activeAccountCount = computed(
    () => this.accounts().filter((account) => account.status === 'active').length,
  );

  protected readonly filteredAccounts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const roleId = this.selectedRoleId();
    const scopeFilter = this.selectedScopeFilter();
    const status = this.selectedStatus();

    return this.accounts().filter((account) => {
      const matchesRole = !roleId || account.role === roleId;
      const matchesStatus = !status || account.status === status;
      const matchesScope =
        !scopeFilter ||
        (scopeFilter === 'global' ? account.scope.type === 'global' : account.scope.type === 'faction' && account.scope.factionId === scopeFilter);
      const matchesTerm =
        !term ||
        account.name.toLowerCase().includes(term) ||
        account.email.toLowerCase().includes(term) ||
        account.employeeId.toLowerCase().includes(term);
      return matchesRole && matchesStatus && matchesScope && matchesTerm;
    });
  });

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredAccounts().length / PAGE_SIZE)));

  protected readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, index) => index + 1));

  protected readonly pagedAccounts = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredAccounts().slice(start, start + PAGE_SIZE);
  });

  protected readonly rangeStart = computed(() =>
    this.filteredAccounts().length === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1,
  );

  protected readonly rangeEnd = computed(() => Math.min(this.currentPage() * PAGE_SIZE, this.filteredAccounts().length));

  protected roleMeta(roleId: SystemRoleId) {
    return systemRole(roleId);
  }

  protected scopeLabel(account: AdminAccount): string {
    return scopeLabel(account.scope);
  }

  protected scopeDotClasses(account: AdminAccount): string {
    return scopeDotClasses(account.scope);
  }

  protected isPasswordRevealed(accountId: string): boolean {
    return this.revealedPasswordIds().has(accountId);
  }

  protected togglePasswordReveal(accountId: string): void {
    this.revealedPasswordIds.update((current) => {
      const next = new Set(current);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  }

  protected onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  protected onRoleChange(value: string): void {
    this.selectedRoleId.set(value as SystemRoleId | '');
    this.currentPage.set(1);
  }

  protected onScopeChange(value: string): void {
    this.selectedScopeFilter.set(value as FactionId | 'global' | '');
    this.currentPage.set(1);
  }

  protected onStatusChange(value: string): void {
    this.selectedStatus.set(value as 'active' | 'inactive' | '');
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  protected toggleActionMenu(accountId: string): void {
    this.openActionMenuAccountId.update((current) => (current === accountId ? null : accountId));
  }

  protected editUser(account: AdminAccount): void {
    this.openActionMenuAccountId.set(null);
    // TODO: wire up edit-user modal once designed.
  }

  protected createQr(account: AdminAccount): void {
    this.openActionMenuAccountId.set(null);
    // TODO: wire up QR generation once designed.
  }

  protected deleteUser(account: AdminAccount): void {
    this.openActionMenuAccountId.set(null);
    // TODO: wire up delete-user confirmation modal once designed.
  }

  protected openAddAdminModal(): void {
    this.addAdminError.set(null);
    this.isAddAdminModalOpen.set(true);
  }

  protected closeAddAdminModal(): void {
    this.isAddAdminModalOpen.set(false);
  }

  protected createAdminAccount(input: NewAdminAccountInput): void {
    const isDuplicateEmail = this.accounts().some(
      (account) => account.email.toLowerCase() === input.email.toLowerCase(),
    );
    if (isDuplicateEmail) {
      this.addAdminError.set('An account with this email already exists.');
      return;
    }

    const id = `staff-${Math.random().toString(36).slice(2, 8)}`;
    const account: AdminAccount = {
      id,
      name: input.name,
      email: input.email,
      employeeId: input.employeeId,
      avatarInitials: initialsFromName(input.name),
      avatarClasses: avatarClassesForId(id),
      maskedPassword: input.password,
      role: input.role,
      scope: input.scope,
      status: 'active',
    };

    this.accounts.update((current) => [account, ...current]);
    this.isAddAdminModalOpen.set(false);
  }
}
