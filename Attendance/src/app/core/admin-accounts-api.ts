import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminAccount, NewAdminAccountInput } from '../admin/admin-accounts/admin-account';
import { API_BASE_URL } from './api-config';

export const ADMIN_ACCOUNTS_API_URL = `${API_BASE_URL}/admin-accounts`;

@Injectable({ providedIn: 'root' })
export class AdminAccountsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<AdminAccountDto[]> {
    return this.http.get<AdminAccountDto[]>(ADMIN_ACCOUNTS_API_URL);
  }

  create(account: NewAdminAccountInput): Observable<AdminAccountDto> {
    return this.http.post<AdminAccountDto>(ADMIN_ACCOUNTS_API_URL, account);
  }
}

export interface AdminAccountDto {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  password: string;
  role: AdminAccount['role'];
  scope: AdminAccount['scope'];
  status: AdminAccount['status'];
}

export function toAdminAccount(dto: AdminAccountDto): AdminAccount {
  return {
    ...dto,
    avatarInitials: initialsFromName(dto.name),
    avatarClasses: avatarClassesForId(dto.id),
    maskedPassword: dto.password,
  };
}

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]!.toUpperCase()).join('') || '?';
}

function avatarClassesForId(id: string): string {
  const palette = [
    'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  ];
  let hash = 0;
  for (let index = 0; index < id.length; index++) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length]!;
}