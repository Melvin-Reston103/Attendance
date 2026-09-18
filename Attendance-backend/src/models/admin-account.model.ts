import { randomUUID } from 'node:crypto';
import { db } from '../db/database';
import type { AdminAccount, AccountScopeType, FactionId, SystemRoleId } from '../types';

export interface NewAdminAccount {
  name: string;
  email: string;
  employeeId: string;
  password: string;
  role: SystemRoleId;
  scope: {
    type: AccountScopeType;
    factionId?: FactionId;
    label?: string;
  };
}

interface AdminAccountRow {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  password: string;
  role: SystemRoleId;
  scope_type: AccountScopeType;
  scope_faction_id: FactionId | null;
  scope_label: string | null;
  status: AdminAccount['status'];
}

function toAdminAccount(row: AdminAccountRow): AdminAccount {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    employeeId: row.employee_id,
    password: row.password,
    role: row.role,
    scope: row.scope_type === 'faction'
      ? { type: 'faction', factionId: row.scope_faction_id! }
      : row.scope_type === 'custom'
        ? { type: 'custom', label: row.scope_label! }
        : { type: 'global' },
    status: row.status,
  };
}

export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const result = await db.query<AdminAccountRow>('SELECT * FROM admin_accounts ORDER BY created_at DESC');
  return result.rows.map(toAdminAccount);
}

export async function createAdminAccount(input: NewAdminAccount): Promise<AdminAccount> {
  const result = await db.query<AdminAccountRow>(
    `INSERT INTO admin_accounts
      (id, name, email, employee_id, password, role, scope_type, scope_faction_id, scope_label)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      randomUUID(),
      input.name,
      input.email,
      input.employeeId,
      input.password,
      input.role,
      input.scope.type,
      input.scope.type === 'faction' ? input.scope.factionId : null,
      input.scope.type === 'custom' ? input.scope.label : null,
    ],
  );
  return toAdminAccount(result.rows[0]!);
}