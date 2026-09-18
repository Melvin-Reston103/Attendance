import { FACTIONS, FactionId } from '../student-directory/student';

/** System-level permission role assigned to a staff account. */
export type SystemRoleId = 'head-adviser' | 'it-operations' | 'super-admin' | 'gate-proctor-lead';

/** Visual + label metadata for a system role badge. */
export interface SystemRole {
  id: SystemRoleId;
  label: string;
  icon: string;
  badgeClasses: string;
  iconClasses: string;
}

export const SYSTEM_ROLES: readonly SystemRole[] = [
  {
    id: 'head-adviser',
    label: 'Head Adviser',
    icon: 'shield_person',
    badgeClasses: 'bg-[#141e33] border-[#213252] text-slate-200',
    iconClasses: 'text-slate-300',
  },
  {
    id: 'it-operations',
    label: 'IT Operations',
    icon: 'dns',
    badgeClasses: 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300',
    iconClasses: 'text-cyan-400',
  },
  {
    id: 'super-admin',
    label: 'Dean / Super Admin',
    icon: 'verified_user',
    badgeClasses: 'bg-slate-950 border-slate-600/60 text-white shadow-[0_0_10px_rgba(2,6,23,0.6)]',
    iconClasses: 'text-emerald-400',
  },
  {
    id: 'gate-proctor-lead',
    label: 'Gate Proctor Lead',
    icon: 'sensor_door',
    badgeClasses: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
    iconClasses: 'text-emerald-400',
  },
];

export function systemRole(id: SystemRoleId): SystemRole {
  return SYSTEM_ROLES.find((role) => role.id === id) ?? SYSTEM_ROLES[0];
}

/** Kiosk/campus scope pods a staff account is permitted to sync/validate against. */
export type AdviserScope =
  | { readonly type: 'faction'; readonly factionId: FactionId }
  | { readonly type: 'global' }
  | { readonly type: 'custom'; readonly label: string };

export function scopeLabel(scope: AdviserScope): string {
  switch (scope.type) {
    case 'faction':
      return FACTIONS.find((faction) => faction.id === scope.factionId)?.label ?? 'Unassigned Faction';
    case 'global':
      return 'All Factions / Global';
    case 'custom':
      return scope.label;
  }
}

export function scopeDotClasses(scope: AdviserScope): string {
  if (scope.type === 'faction') {
    const faction = FACTIONS.find((item) => item.id === scope.factionId);
    return faction?.iconClasses.replace('text-', 'bg-') ?? 'bg-slate-400';
  }
  if (scope.type === 'global') {
    return 'bg-sky-400';
  }
  return 'bg-emerald-400';
}

/** Account activation state. */
export type AccountStatus = 'active' | 'inactive';

/** A single admin/faction adviser staff record. */
export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  avatarInitials: string;
  avatarClasses: string;
  maskedPassword: string;
  role: SystemRoleId;
  scope: AdviserScope;
  status: AccountStatus;
}

export const ADMIN_ACCOUNTS: readonly AdminAccount[] = [
  {
    id: 'staff-012',
    name: 'Dr. Clara Santiago',
    email: 'c.santiago@smch.edu.ph',
    employeeId: 'SMCH-EMP-2026-012',
    avatarInitials: 'CS',
    avatarClasses: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    maskedPassword: 'Adv#Cs2026!',
    role: 'head-adviser',
    scope: { type: 'faction', factionId: 'duces-mercaturae' },
    status: 'active',
  },
  {
    id: 'staff-034',
    name: 'Prof. Marcus Vance',
    email: 'm.vance@smch.edu.ph',
    employeeId: 'SMCH-EMP-2026-034',
    avatarInitials: 'MV',
    avatarClasses: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    maskedPassword: 'Adv#Mv2026!',
    role: 'head-adviser',
    scope: { type: 'faction', factionId: 'luminary-acharya' },
    status: 'active',
  },
  {
    id: 'staff-089',
    name: 'Capt. Roberto Diaz',
    email: 'r.diaz@smch.edu.ph',
    employeeId: 'SMCH-EMP-2026-089',
    avatarInitials: 'RD',
    avatarClasses: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    maskedPassword: 'Adv#Rd2026!',
    role: 'head-adviser',
    scope: { type: 'faction', factionId: 'gray-wolves' },
    status: 'active',
  },
  {
    id: 'staff-051',
    name: 'Chef Antonio Lim',
    email: 'a.lim@smch.edu.ph',
    employeeId: 'SMCH-EMP-2026-051',
    avatarInitials: 'AL',
    avatarClasses: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    maskedPassword: 'Adv#Al2026!',
    role: 'head-adviser',
    scope: { type: 'faction', factionId: 'blue-bobcat' },
    status: 'active',
  },
  {
    id: 'staff-004',
    name: 'Engr. Mark Joseph Ramos',
    email: 'm.ramos@smch.edu.ph',
    employeeId: 'SMCH-EMP-2026-004',
    avatarInitials: 'MR',
    avatarClasses: 'bg-slate-700/60 text-slate-200 border border-slate-500/40',
    maskedPassword: 'Ops#Mr2026!',
    role: 'it-operations',
    scope: { type: 'global' },
    status: 'active',
  },
  {
    id: 'staff-007',
    name: 'Atty. Rosalina Fernandez',
    email: 'r.fernandez@smch.edu.ph',
    employeeId: 'SMCH-EMP-2026-007',
    avatarInitials: 'RF',
    avatarClasses: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    maskedPassword: 'Dean#Rf2026!',
    role: 'super-admin',
    scope: { type: 'global' },
    status: 'active',
  },
  {
    id: 'staff-112',
    name: 'John Carl Perez',
    email: 'jc.perez@smch.edu.ph',
    employeeId: 'SMCH-EMP-2026-112',
    avatarInitials: 'JP',
    avatarClasses: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    maskedPassword: 'Gate#Jp2026!',
    role: 'gate-proctor-lead',
    scope: { type: 'custom', label: 'East Quad & Gym Kiosks' },
    status: 'active',
  },
  {
    id: 'staff-067',
    name: 'Ms. Teresa Bautista',
    email: 't.bautista@smch.edu.ph',
    employeeId: 'SMCH-EMP-2026-067',
    avatarInitials: 'TB',
    avatarClasses: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    maskedPassword: 'Adv#Tb2026!',
    role: 'head-adviser',
    scope: { type: 'faction', factionId: 'golden-falcon' },
    status: 'active',
  },
];
