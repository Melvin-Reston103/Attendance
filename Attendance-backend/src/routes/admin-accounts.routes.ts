import { Router } from 'express';
import { asyncRoute } from './async-route';
import {
  createAdminAccount,
  deleteAdminAccount,
  listAdminAccounts,
  updateAdminAccount,
  type NewAdminAccount,
  type UpdateAdminAccount,
} from '../models/admin-account.model';

const SYSTEM_ROLES = new Set(['head-adviser', 'it-operations', 'super-admin', 'gate-proctor-lead']);
const FACTION_IDS = new Set(['duces-mercaturae', 'luminary-acharya', 'gray-wolves', 'blue-bobcat', 'golden-falcon']);

export const adminAccountsRouter = Router();

adminAccountsRouter.get('/', asyncRoute(async (_req, res) => {
  res.json(await listAdminAccounts());
}));

adminAccountsRouter.post('/', asyncRoute(async (req, res) => {
  const input = req.body as Partial<NewAdminAccount>;
  if (
    typeof input.name !== 'string' ||
    typeof input.email !== 'string' ||
    typeof input.employeeId !== 'string' ||
    typeof input.password !== 'string' ||
    !input.name.trim() ||
    !input.email.trim() ||
    !input.employeeId.trim() ||
    !input.password ||
    typeof input.role !== 'string' ||
    !SYSTEM_ROLES.has(input.role) ||
    !input.scope ||
    !['global', 'faction', 'custom'].includes(input.scope.type) ||
    (input.scope.type === 'faction' && (!input.scope.factionId || !FACTION_IDS.has(input.scope.factionId))) ||
    (input.scope.type === 'custom' && (!input.scope.label || !input.scope.label.trim()))
  ) {
    res.status(400).json({ message: 'Invalid admin account payload.' });
    return;
  }

  try {
    res.status(201).json(await createAdminAccount(input as NewAdminAccount));
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      res.status(409).json({ message: 'An account with this email or employee ID already exists.' });
      return;
    }
    throw error;
  }
}));

function isValidAccountPayload(input: Partial<UpdateAdminAccount>): boolean {
  return typeof input.name === 'string' && !!input.name.trim() &&
    typeof input.employeeId === 'string' && !!input.employeeId.trim() &&
    typeof input.role === 'string' && SYSTEM_ROLES.has(input.role) &&
    !!input.scope && ['global', 'faction', 'custom'].includes(input.scope.type) &&
    (input.scope.type !== 'faction' || (!!input.scope.factionId && FACTION_IDS.has(input.scope.factionId))) &&
    (input.scope.type !== 'custom' || (!!input.scope.label && !!input.scope.label.trim())) &&
    (input.password === undefined || (typeof input.password === 'string' && !!input.password));
}

adminAccountsRouter.patch('/:id', asyncRoute(async (req, res) => {
  const input = req.body as Partial<UpdateAdminAccount>;
  if (!isValidAccountPayload(input)) {
    res.status(400).json({ message: 'Invalid admin account payload.' });
    return;
  }
  try {
    const account = await updateAdminAccount(req.params.id, input as UpdateAdminAccount);
    if (!account) {
      res.status(404).json({ message: 'Admin account not found.' });
      return;
    }
    res.json(account);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      res.status(409).json({ message: 'An account with this employee ID already exists.' });
      return;
    }
    throw error;
  }
}));

adminAccountsRouter.delete('/:id', asyncRoute(async (req, res) => {
  if (!(await deleteAdminAccount(req.params.id))) {
    res.status(404).json({ message: 'Admin account not found.' });
    return;
  }
  res.status(204).send();
}));