/** A single logged attendance event shown on the confirmation modal. */
export interface AttendanceRecord {
  studentName: string;
  studentId: string;
  photoUrl: string;
  department: string;
  courseYear: string;
  section: string;
  eventName: string;
  scheduleLabel: string;
  gate: string;
  mode: 'TIME IN' | 'TIME OUT';
  timestamp: string;
}

export const SAMPLE_ATTENDANCE_RECORD: AttendanceRecord = {
  studentName: 'Sophia Nicole Alcantara',
  studentId: 'SMCH-2026-1049',
  photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Sophia+Alcantara&backgroundType=gradientLinear',
  department: 'College of Computer Studies',
  courseYear: 'BS Information Technology - 3rd Year',
  section: 'Section: BSIT 3-A',
  eventName: 'Intramurals 2026 (Day 1)',
  scheduleLabel: 'October 22, 2026',
  gate: 'Gate 1 South Kiosk',
  mode: 'TIME IN',
  timestamp: '07:45:18 AM',
};
