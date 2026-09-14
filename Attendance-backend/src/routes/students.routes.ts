import { Router } from 'express';
import {
  createStudent,
  deleteStudent,
  deleteStudentsByFaction,
  getStudentById,
  listStudents,
  updateStudent,
  updateStudentStatus,
  type NewStudent,
  type StudentUpdate,
} from '../models/student.model';
import { asyncRoute } from './async-route';

export const studentsRouter = Router();

studentsRouter.get('/', asyncRoute(async (_req, res) => {
  res.json(await listStudents());
}));

studentsRouter.get('/:id', asyncRoute(async (req, res) => {
  const student = await getStudentById(req.params.id);
  if (!student) {
    res.status(404).json({ message: 'Student not found' });
    return;
  }
  res.json(student);
}));

studentsRouter.post('/', asyncRoute(async (req, res) => {
  const body = req.body as Partial<NewStudent>;
  if (
    !body.id ||
    !body.name ||
    !body.course ||
    !body.departmentId ||
    !body.factionId
  ) {
    res.status(400).json({ message: 'Missing required student fields' });
    return;
  }
  if (await getStudentById(body.id)) {
    res.status(409).json({ message: 'Student with this id already exists' });
    return;
  }
  const student = await createStudent({
    id: body.id,
    name: body.name,
    email: body.email ?? null,
    photoUrl: body.photoUrl ?? null,
    course: body.course,
    departmentId: body.departmentId,
    factionId: body.factionId,
  });
  res.status(201).json(student);
}));

studentsRouter.post('/bulk', asyncRoute(async (req, res) => {
  const body = req.body as { students?: Partial<NewStudent>[] };
  const students = Array.isArray(body.students) ? body.students : [];

  const created: Awaited<ReturnType<typeof createStudent>>[] = [];
  const failed: { id: string | null; message: string }[] = [];

  for (const student of students) {
    if (
      !student.id ||
      !student.name ||
      !student.course ||
      !student.departmentId ||
      !student.factionId
    ) {
      failed.push({ id: student.id ?? null, message: 'Missing required student fields' });
      continue;
    }
    if (await getStudentById(student.id)) {
      failed.push({ id: student.id, message: 'Student with this id already exists' });
      continue;
    }
    created.push(
      await createStudent({
        id: student.id,
        name: student.name,
        email: student.email ?? null,
        photoUrl: student.photoUrl ?? null,
        course: student.course,
        departmentId: student.departmentId,
        factionId: student.factionId,
      }),
    );
  }

  res.status(created.length > 0 ? 201 : 400).json({ created, failed });
}));

studentsRouter.delete('/faction/:factionId', asyncRoute(async (req, res) => {
  try {
    const deletedCount = await deleteStudentsByFaction(
      req.params.factionId as Parameters<typeof deleteStudentsByFaction>[0],
    );
    res.json({ deletedCount });
  } catch {
    res.status(409).json({ message: 'Cannot delete students with existing attendance logs' });
  }
}));

studentsRouter.put('/:id', asyncRoute(async (req, res) => {
  if (!await getStudentById(req.params.id)) {
    res.status(404).json({ message: 'Student not found' });
    return;
  }
  const body = req.body as Partial<StudentUpdate>;
  if (!body.name || !body.course || !body.departmentId || !body.factionId) {
    res.status(400).json({ message: 'Missing required student fields' });
    return;
  }
  const student = await updateStudent(req.params.id, {
    name: body.name,
    email: body.email ?? null,
    photoUrl: body.photoUrl ?? null,
    course: body.course,
    departmentId: body.departmentId,
    factionId: body.factionId,
  });
  res.json(student);
}));

studentsRouter.patch('/:id/status', asyncRoute(async (req, res) => {
  const { status, statusTime } = req.body as { status?: string; statusTime?: string | null };
  if (status !== 'checked-in' && status !== 'checked-out' && status !== 'not-logged') {
    res.status(400).json({ message: 'Invalid status value' });
    return;
  }
  const student = await updateStudentStatus(req.params.id, status, statusTime ?? null);
  if (!student) {
    res.status(404).json({ message: 'Student not found' });
    return;
  }
  res.json(student);
}));

studentsRouter.delete('/:id', asyncRoute(async (req, res) => {
  if (!await getStudentById(req.params.id)) {
    res.status(404).json({ message: 'Student not found' });
    return;
  }
  try {
    await deleteStudent(req.params.id);
  } catch {
    res.status(409).json({ message: 'Cannot delete a student with existing attendance logs' });
    return;
  }
  res.status(204).send();
}));
