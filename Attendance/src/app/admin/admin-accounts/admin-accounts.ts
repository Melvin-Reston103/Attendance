import { Component, computed, inject, signal } from '@angular/core';
import {
  AdminAccount,
  NewAdminAccountInput,
  scopeDotClasses,
  scopeLabel,
  SYSTEM_ROLES,
  SystemRoleId,
  systemRole,
} from './admin-account';
import { AdminAccountsApi, toAdminAccount, UpdateAdminAccountInput } from '../../core/admin-accounts-api';
import { HttpErrorResponse } from '@angular/common/http';
import { FACTIONS, FactionId } from '../student-directory/student';
import { AddAdminModal } from './add-admin-modal/add-admin-modal';
import { EditAdminModal } from './edit-admin-modal/edit-admin-modal';
import { DeleteAdminModal } from './delete-admin-modal/delete-admin-modal';
import { QrAdminModal } from './qr-admin-modal/qr-admin-modal';

const PAGE_SIZE = 7;

@Component({
  selector: 'app-admin-accounts',
  imports: [AddAdminModal, EditAdminModal, DeleteAdminModal, QrAdminModal],
  templateUrl: './admin-accounts.html',
  styleUrl: './admin-accounts.scss',
})
export class AdminAccounts {
  private readonly adminAccountsApi = inject(AdminAccountsApi);
  protected readonly systemRoles = SYSTEM_ROLES;
  protected readonly factions = FACTIONS;

  private readonly accounts = signal<readonly AdminAccount[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);

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
  protected readonly editingAccount = signal<AdminAccount | null>(null);
  protected readonly deletingAccount = signal<AdminAccount | null>(null);
  protected readonly qrAccount = signal<AdminAccount | null>(null);
  protected readonly isSavingAccount = signal(false);
  protected readonly accountActionError = signal<string | null>(null);

  constructor() {
    this.loadAccounts();
  }

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
    this.accountActionError.set(null);
    this.editingAccount.set(account);
  }

  protected createQr(account: AdminAccount): void {
    this.openActionMenuAccountId.set(null);
    this.qrAccount.set(account);
  }

  protected deleteUser(account: AdminAccount): void {
    this.openActionMenuAccountId.set(null);
    this.accountActionError.set(null);
    this.deletingAccount.set(account);
  }

  protected closeEditModal(): void { this.editingAccount.set(null); }
  protected closeDeleteModal(): void { this.deletingAccount.set(null); }
  protected closeQrModal(): void { this.qrAccount.set(null); }

  protected updateAdminAccount(input: UpdateAdminAccountInput): void {
    const account = this.editingAccount();
    if (!account) return;
    this.isSavingAccount.set(true);
    this.accountActionError.set(null);
    this.adminAccountsApi.update(account.id, input).subscribe({
      next: (updated) => {
        this.accounts.update((current) => current.map((item) => item.id === updated.id ? toAdminAccount(updated) : item));
        this.isSavingAccount.set(false);
        this.editingAccount.set(null);
      },
      error: (error: unknown) => {
        this.isSavingAccount.set(false);
        this.accountActionError.set(this.apiErrorMessage(error, 'The account could not be updated. Please try again.'));
      },
    });
  }

  protected confirmDeleteAdminAccount(): void {
    const account = this.deletingAccount();
    if (!account) return;
    this.isSavingAccount.set(true);
    this.accountActionError.set(null);
    this.adminAccountsApi.remove(account.id).subscribe({
      next: () => {
        this.accounts.update((current) => current.filter((item) => item.id !== account.id));
        this.isSavingAccount.set(false);
        this.deletingAccount.set(null);
      },
      error: (error: unknown) => {
        this.isSavingAccount.set(false);
        this.accountActionError.set(this.apiErrorMessage(error, 'The account could not be deleted. Please try again.'));
      },
    });
  }

  protected openAddAdminModal(): void {
    this.addAdminError.set(null);
    this.isAddAdminModalOpen.set(true);
  }

  private loadAccounts(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.adminAccountsApi.list().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts.map(toAdminAccount));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('The staff accounts could not be loaded. Please try again.');
      },
    });
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

    this.isSavingAdmin.set(true);
    this.addAdminError.set(null);
    this.adminAccountsApi.create(input).subscribe({
      next: (createdAccount) => {
        this.accounts.update((current) => [toAdminAccount(createdAccount), ...current]);
        this.isSavingAdmin.set(false);
        this.isAddAdminModalOpen.set(false);
      },
      error: (error: unknown) => {
        this.isSavingAdmin.set(false);
        this.addAdminError.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'The account could not be saved. Please try again.',
        );
      },
    });
  }

  private apiErrorMessage(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse && typeof error.error?.message === 'string' ? error.error.message : fallback;
  }
}
