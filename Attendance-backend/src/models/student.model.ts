import { db } from '../db/database';
import type { Student } from '../types';

interface StudentRow {
  id: string;
  name: string;
  email: string | null;
  photo_url: string | null;
  course: string;
  department_id: Student['departmentId'];
  faction_id: Student['factionId'];
  status: Student['status'];
  status_time: string | null;
}

function toStudent(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    photoUrl: row.photo_url,
    course: row.course,
    departmentId: row.department_id,
    factionId: row.faction_id,
    status: row.status,
    statusTime: row.status_time,
  };
}

export async function listStudents(): Promise<Student[]> {
  const result = await db.query<StudentRow>('SELECT * FROM students ORDER BY name');
  return result.rows.map(toStudent);
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  const result = await db.query<StudentRow>('SELECT * FROM students WHERE id = $1', [id]);
  return result.rows[0] ? toStudent(result.rows[0]) : undefined;
}

export type NewStudent = Omit<Student, 'status' | 'statusTime'>;

export async function createStudent(student: NewStudent): Promise<Student> {
  const result = await db.query<StudentRow>(
    `INSERT INTO students (id, name, email, photo_url, course, department_id, faction_id, status, status_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'not-logged', NULL)
     RETURNING *`,
    [
      student.id,
      student.name,
      student.email,
      student.photoUrl,
      student.course,
      student.departmentId,
      student.factionId,
    ],
  );
  return toStudent(result.rows[0]);
}

export type StudentUpdate = Omit<NewStudent, 'id'>;

export async function updateStudent(id: string, student: StudentUpdate): Promise<Student | undefined> {
  const result = await db.query<StudentRow>(
    `UPDATE students
     SET name = $2, email = $3, photo_url = $4, course = $5,
       department_id = $6, faction_id = $7
     WHERE id = $1
     RETURNING *`,
    [id, student.name, student.email, student.photoUrl, student.course, student.departmentId, student.factionId],
  );
  return result.rows[0] ? toStudent(result.rows[0]) : undefined;
}

export async function updateStudentStatus(
  id: string,
  status: Student['status'],
  statusTime: string | null,
): Promise<Student | undefined> {
  const result = await db.query<StudentRow>(
    'UPDATE students SET status = $2, status_time = $3 WHERE id = $1 RETURNING *',
    [id, status, statusTime],
  );
  return result.rows[0] ? toStudent(result.rows[0]) : undefined;
}

export async function deleteStudent(id: string): Promise<boolean> {
  const result = await db.query('DELETE FROM students WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteStudentsByFaction(factionId: Student['factionId']): Promise<number> {
  const result = await db.query('DELETE FROM students WHERE faction_id = $1', [factionId]);
  return result.rowCount ?? 0;
}
