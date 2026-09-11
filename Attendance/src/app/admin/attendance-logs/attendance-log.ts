import { DepartmentId, FactionId } from '../student-directory/student';

/** Light-theme badge color classes per faction, for the printable official report. */
export const FACTION_REPORT_BADGE_CLASSES: Readonly<Record<FactionId, string>> = {
  'duces-mercaturae': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'luminary-acharya': 'bg-purple-50 text-purple-700 border-purple-200',
  'gray-wolves': 'bg-slate-50 text-slate-700 border-slate-200',
  'blue-bobcat': 'bg-blue-50 text-blue-700 border-blue-200',
  'golden-falcon': 'bg-amber-50 text-amber-800 border-amber-200',
};


/** Direction of a contactless scan event at an intramural kiosk station. */
export type LogType = 'TIME IN' | 'TIME OUT';

/** A kiosk/gate terminal that can register attendance scans. */
export type KioskId = 'gate1' | 'gym' | 'grandstand' | 'auditorium';

export interface Kiosk {
  id: KioskId;
  label: string;
}

export const KIOSKS: readonly Kiosk[] = [
  { id: 'gate1', label: 'Gate 1 South Kiosk' },
  { id: 'gym', label: 'Gym North Station' },
  { id: 'grandstand', label: 'Main Grandstand Station' },
  { id: 'auditorium', label: 'Auditorium East Kiosk' },
];

/** A single official attendance scan log entry for the printable report. */
export interface AttendanceLog {
  id: number;
  scanRef: string;
  scanDate: string;
  scanTime: string;
  studentId: string;
  studentName: string;
  photoUrl?: string;
  course: string;
  yearSection: string;
  departmentId: DepartmentId;
  factionId: FactionId;
  logType: LogType;
  kioskId: KioskId;
  verified: boolean;
}

