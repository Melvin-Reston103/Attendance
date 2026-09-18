import { Router } from 'express';
import { asyncRoute } from './async-route';
import { createAdminAccount, listAdminAccounts, type NewAdminAccount } from '../models/admin-account.model';

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