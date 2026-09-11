import { db } from '../db/database';
import type { AttendanceLog } from '../types';

interface AttendanceLogRow {
  id: number;
  scan_ref: string;
  student_id: string;
  log_type: AttendanceLog['logType'];
  kiosk_id: AttendanceLog['kioskId'];
  scan_date: string;
  scan_time: string;
  verified: number;
}

function toAttendanceLog(row: AttendanceLogRow): AttendanceLog {
  return {
    id: row.id,
    scanRef: row.scan_ref,
    studentId: row.student_id,
    logType: row.log_type,
    kioskId: row.kiosk_id,
    scanDate: row.scan_date,
    scanTime: row.scan_time,
    verified: row.verified === 1,
  };
}

export function listAttendanceLogs(): AttendanceLog[] {
  const rows = db
    .prepare('SELECT * FROM attendance_logs ORDER BY id DESC')
    .all() as unknown as AttendanceLogRow[];
  return rows.map(toAttendanceLog);
}

export function listAttendanceLogsByStudent(studentId: string): AttendanceLog[] {
  const rows = db
    .prepare('SELECT * FROM attendance_logs WHERE student_id = ? ORDER BY id DESC')
    .all(studentId) as unknown as AttendanceLogRow[];
  return rows.map(toAttendanceLog);
}

export type NewAttendanceLog = Omit<AttendanceLog, 'id' | 'verified'> & { verified?: boolean };

export function createAttendanceLog(log: NewAttendanceLog): AttendanceLog {
  const result = db
    .prepare(
      `INSERT INTO attendance_logs (scan_ref, student_id, log_type, kiosk_id, scan_date, scan_time, verified)
       VALUES (@scanRef, @studentId, @logType, @kioskId, @scanDate, @scanTime, @verified)`,
    )
    .run({ ...log, verified: log.verified === false ? 0 : 1 });

  db.prepare('UPDATE students SET status = ?, status_time = ? WHERE id = ?').run(
    log.logType === 'TIME IN' ? 'checked-in' : 'checked-out',
    log.scanTime,
    log.studentId,
  );

  const row = db
    .prepare('SELECT * FROM attendance_logs WHERE id = ?')
    .get(result.lastInsertRowid) as unknown as AttendanceLogRow;
  return toAttendanceLog(row);
}

export function getAttendanceLogById(id: number): AttendanceLog | undefined {
  const row = db
    .prepare('SELECT * FROM attendance_logs WHERE id = ?')
    .get(id) as unknown as AttendanceLogRow | undefined;
  return row ? toAttendanceLog(row) : undefined;
}

export function deleteAttendanceLog(id: number): boolean {
  const result = db.prepare('DELETE FROM attendance_logs WHERE id = ?').run(id);
  return result.changes > 0;
}
