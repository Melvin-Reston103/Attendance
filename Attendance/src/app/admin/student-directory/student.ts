/** Intramural faction assignment for a student athlete/delegate. */
export type FactionId = 'duces-mercaturae' | 'luminary-acharya' | 'gray-wolves' | 'blue-bobcat' | 'golden-falcon';

/** Visual + label metadata for an intramural faction. */
export interface Faction {
  id: FactionId;
  label: string;
  icon: string;
  badgeClasses: string;
  iconClasses: string;
}

export const FACTIONS: readonly Faction[] = [
  {
    id: 'duces-mercaturae',
    label: 'Duces Mercaturae',
    icon: 'business_center',
    badgeClasses: 'bg-indigo-950/50 border-indigo-500/30 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]',
    iconClasses: 'text-indigo-400',
  },
  {
    id: 'luminary-acharya',
    label: 'Luminary Acharya',
    icon: 'auto_awesome',
    badgeClasses: 'bg-purple-950/50 border-purple-500/30 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
    iconClasses: 'text-purple-400',
  },
  {
    id: 'gray-wolves',
    label: 'Gray Wolves',
    icon: 'pets',
    badgeClasses: 'bg-slate-800/50 border-slate-500/30 text-slate-300 shadow-[0_0_10px_rgba(148,163,184,0.15)]',
    iconClasses: 'text-slate-300',
  },
  {
    id: 'blue-bobcat',
    label: 'Blue Bobcat',
    icon: 'pets',
    badgeClasses: 'bg-sky-950/50 border-sky-500/30 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]',
    iconClasses: 'text-sky-400',
  },
  {
    id: 'golden-falcon',
    label: 'Golden Falcon',
    icon: 'bolt',
    badgeClasses: 'bg-amber-950/50 border-amber-500/30 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    iconClasses: 'text-amber-400',
  },
];

/** Academic department a student is enrolled in. */
export type DepartmentId = 'college' | 'high-school';

export interface Department {
  id: DepartmentId;
  label: string;
}

export const DEPARTMENTS: readonly Department[] = [
  { id: 'college', label: 'College' },
  { id: 'high-school', label: 'High School' },
];

/** Course & section options available per department, shown on the Add Student form. */
export const COURSES_BY_DEPARTMENT: Readonly<Record<DepartmentId, readonly string[]>> = {
  college: ['BSED', 'BEED', 'BSBA', 'BSE'],
  'high-school': ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
};

/** Intramural factions available per department, shown on the Add Student form. */
export const FACTIONS_BY_DEPARTMENT: Readonly<Record<DepartmentId, readonly FactionId[]>> = {
  college: ['duces-mercaturae', 'luminary-acharya'],
  'high-school': ['gray-wolves', 'blue-bobcat', 'golden-falcon'],
};

/** Contactless check-in state for a student on the current intramural day. */
export type CheckInStatus = 'checked-in' | 'checked-out' | 'not-logged';

/** A single student athlete/delegate row in the admin directory. */
export interface Student {
  id: string;
  name: string;
  photoUrl: string;
  course: string;
  yearSection: string;
  departmentId: DepartmentId;
  factionId: FactionId;
  status: CheckInStatus;
  statusTime?: string;
}

/** Fallback avatar shown until a student uploads/links their own ID photo. */
export const DEFAULT_STUDENT_PHOTO_URL =
  'https://api.dicebear.com/9.x/initials/svg?seed=New+Student&backgroundType=gradientLinear';

/** Payload emitted by the "Add Student" modal to create a new roster entry. */
export interface NewStudentInput {
  id: string;
  name: string;
  photoUrl: string;
  course: string;
  yearSection: string;
  departmentId: DepartmentId;
  factionId: FactionId;
}


