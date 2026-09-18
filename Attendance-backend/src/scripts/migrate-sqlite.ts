import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { db, initDatabase, withTransaction } from '../db/database';

interface StudentRow {
  id: string;
  name: string;
  email: string | null;
  photo_url: string | null;
  course: string;
  department_id: string;
  faction_id: string;
  status: string;
  status_time: string | null;
  created_at: string;
}

interface AttendanceLogRow {
  id: number;
  scan_ref: string;
  student_id: string;
  log_type: string;
  kiosk_id: string;
  scan_date: string;
  scan_time: string;
  verified: number;
  created_at: string;
}

async function migrate(): Promise<void> {
  const sqlitePath = resolve(process.env['SQLITE_DATABASE_PATH'] ?? 'data/attendance.db');
  const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });

  try {
    const students = sqlite.prepare('SELECT * FROM students').all() as unknown as StudentRow[];
    const attendanceLogs = sqlite
      .prepare('SELECT * FROM attendance_logs ORDER BY id')
      .all() as unknown as AttendanceLogRow[];

    await initDatabase();
    await withTransaction(async (client) => {
      for (const student of students) {
        await client.query(
          `INSERT INTO students
             (id, name, email, photo_url, course, department_id, faction_id, status, status_time, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             photo_url = EXCLUDED.photo_url,
             course = EXCLUDED.course,
             department_id = EXCLUDED.department_id,
             faction_id = EXCLUDED.faction_id,
             status = EXCLUDED.status,
             status_time = EXCLUDED.status_time`,
          [
            student.id,
            student.name,
            student.email,
            student.photo_url,
            student.course,
            student.department_id,
            student.faction_id,
            student.status,
            student.status_time,
            student.created_at,
          ],
        );
      }

      for (const log of attendanceLogs) {
        await client.query(
          `INSERT INTO attendance_logs
             (id, scan_ref, student_id, log_type, kiosk_id, user_logged, scan_date, scan_time, verified, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT DO NOTHING`,
          [
            log.id,
            log.scan_ref,
            log.student_id,
            log.log_type,
            log.kiosk_id,
            log.kiosk_id,
            log.scan_date,
            log.scan_time,
            log.verified === 1,
            log.created_at,
          ],
        );
      }

      await client.query(
        `SELECT setval(
           pg_get_serial_sequence('attendance_logs', 'id'),
           COALESCE(MAX(id), 1),
           MAX(id) IS NOT NULL
         )
         FROM attendance_logs`,
      );
    });

    console.log(`Migrated ${students.length} students and ${attendanceLogs.length} attendance logs.`);
  } finally {
    sqlite.close();
    await db.end();
  }
}

void migrate().catch((error: unknown) => {
  console.error('SQLite migration failed:', error);
  process.exitCode = 1;
});