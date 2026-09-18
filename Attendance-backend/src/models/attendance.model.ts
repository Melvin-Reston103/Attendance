import { db, withTransaction } from '../db/database';
import type { AttendanceLog } from '../types';

interface AttendanceLogRow {
  id: number;
  scan_ref: string;
  student_id: string;
  log_type: AttendanceLog['logType'];
  kiosk_id: AttendanceLog['kioskId'];
  user_logged: string;
  scan_date: string;
  scan_time: string;
  verified: boolean;
}

function toAttendanceLog(row: AttendanceLogRow): AttendanceLog {
  return {
    id: row.id,
    scanRef: row.scan_ref,
    studentId: row.student_id,
    logType: row.log_type,
    kioskId: row.kiosk_id,
    userLogged: row.user_logged,
    scanDate: row.scan_date,
    scanTime: row.scan_time,
    verified: row.verified,
  };
}

export async function listAttendanceLogs(): Promise<AttendanceLog[]> {
  const result = await db.query<AttendanceLogRow>('SELECT * FROM attendance_logs ORDER BY id DESC');
  return result.rows.map(toAttendanceLog);
}

export async function listAttendanceLogsByStudent(studentId: string): Promise<AttendanceLog[]> {
  const result = await db.query<AttendanceLogRow>(
    'SELECT * FROM attendance_logs WHERE student_id = $1 ORDER BY id DESC',
    [studentId],
  );
  return result.rows.map(toAttendanceLog);
}

export type NewAttendanceLog = Omit<AttendanceLog, 'id' | 'verified'> & { verified?: boolean };

export function createAttendanceLog(log: NewAttendanceLog): Promise<AttendanceLog> {
  return withTransaction(async (client) => {
    const result = await client.query<AttendanceLogRow>(
      `INSERT INTO attendance_logs (scan_ref, student_id, log_type, kiosk_id, user_logged, scan_date, scan_time, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        log.scanRef,
        log.studentId,
        log.logType,
        log.kioskId,
        log.userLogged,
        log.scanDate,
        log.scanTime,
        log.verified !== false,
      ],
    );
    await client.query(
      'UPDATE students SET status = $2, status_time = $3 WHERE id = $1',
      [log.studentId, log.logType === 'TIME IN' ? 'checked-in' : 'checked-out', log.scanTime],
    );
    return toAttendanceLog(result.rows[0]);
  });
}

export async function getAttendanceLogById(id: number): Promise<AttendanceLog | undefined> {
  const result = await db.query<AttendanceLogRow>('SELECT * FROM attendance_logs WHERE id = $1', [id]);
  return result.rows[0] ? toAttendanceLog(result.rows[0]) : undefined;
}

export async function attendanceLogExists(scanRef: string): Promise<boolean> {
  const result = await db.query('SELECT 1 FROM attendance_logs WHERE scan_ref = $1', [scanRef]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteAttendanceLog(id: number): Promise<boolean> {
  const result = await db.query('DELETE FROM attendance_logs WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteAttendanceLogs(ids: readonly number[]): Promise<number> {
  const result = await db.query('DELETE FROM attendance_logs WHERE id = ANY($1::integer[])', [ids]);
  return result.rowCount ?? 0;
}
