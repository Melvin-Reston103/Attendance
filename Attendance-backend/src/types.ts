export type DepartmentId = 'college' | 'high-school';
export type FactionId =
  | 'duces-mercaturae'
  | 'luminary-acharya'
  | 'gray-wolves'
  | 'blue-bobcat'
  | 'golden-falcon';
export type KioskId = 'gate1' | 'gym' | 'grandstand' | 'auditorium';
export type CheckInStatus = 'checked-in' | 'checked-out' | 'not-logged';
export type LogType = 'TIME IN' | 'TIME OUT';

export interface Student {
  id: string;
  name: string;
  email: string | null;
  photoUrl: string | null;
  course: string;
  departmentId: DepartmentId;
  factionId: FactionId;
  status: CheckInStatus;
  statusTime: string | null;
}

export interface AttendanceLog {
  id: number;
  scanRef: string;
  studentId: string;
  logType: LogType;
  kioskId: KioskId;
  scanDate: string;
  scanTime: string;
  verified: boolean;
}
