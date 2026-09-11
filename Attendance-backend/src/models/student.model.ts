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

export function listStudents(): Student[] {
  const rows = db
    .prepare('SELECT * FROM students ORDER BY name')
    .all() as unknown as StudentRow[];
  return rows.map(toStudent);
}

export function getStudentById(id: string): Student | undefined {
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as unknown as
    | StudentRow
    | undefined;
  return row ? toStudent(row) : undefined;
}

export type NewStudent = Omit<Student, 'status' | 'statusTime'>;

export function createStudent(student: NewStudent): Student {
  db.prepare(
    `INSERT INTO students (id, name, email, photo_url, course, department_id, faction_id, status, status_time)
     VALUES (@id, @name, @email, @photoUrl, @course, @departmentId, @factionId, 'not-logged', NULL)`,
  ).run(student);
  return getStudentById(student.id) as Student;
}

export type StudentUpdate = Omit<NewStudent, 'id'>;

export function updateStudent(id: string, student: StudentUpdate): Student | undefined {
  db.prepare(
    `UPDATE students
     SET name = @name, email = @email, photo_url = @photoUrl, course = @course,
       department_id = @departmentId, faction_id = @factionId
     WHERE id = @id`,
  ).run({ ...student, id });
  return getStudentById(id);
}

export function updateStudentStatus(
  id: string,
  status: Student['status'],
  statusTime: string | null,
): Student | undefined {
  db.prepare('UPDATE students SET status = ?, status_time = ? WHERE id = ?').run(
    status,
    statusTime,
    id,
  );
  return getStudentById(id);
}

export function deleteStudent(id: string): boolean {
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);
  return result.changes > 0;
}
