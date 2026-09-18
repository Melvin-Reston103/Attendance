import { Router } from 'express';
import { getStudentById } from '../models/student.model';
import {
  attendanceLogExists,
  createAttendanceLog,
  deleteAttendanceLog,
  deleteAttendanceLogs,
  getAttendanceLogById,
  listAttendanceLogs,
  listAttendanceLogsByStudent,
  type NewAttendanceLog,
} from '../models/attendance.model';
import { asyncRoute } from './async-route';

export const attendanceLogsRouter = Router();

attendanceLogsRouter.get('/', asyncRoute(async (req, res) => {
  const studentId = req.query['studentId'];
  if (typeof studentId === 'string' && studentId.length > 0) {
    res.json(await listAttendanceLogsByStudent(studentId));
    return;
  }
  res.json(await listAttendanceLogs());
}));

attendanceLogsRouter.post('/', asyncRoute(async (req, res) => {
  const body = req.body as Partial<NewAttendanceLog>;
  if (
    !body.scanRef ||
    !body.studentId ||
    !body.logType ||
    !body.kioskId ||
    !body.userLogged ||
    !body.scanDate ||
    !body.scanTime
  ) {
    res.status(400).json({ message: 'Missing required attendance log fields' });
    return;
  }
  if (!await getStudentById(body.studentId)) {
    res.status(404).json({ message: 'Student not found' });
    return;
  }
  if (await attendanceLogExists(body.scanRef)) {
    res.status(409).json({ message: 'Attendance log with this scan reference already exists' });
    return;
  }
  const log = await createAttendanceLog({
    scanRef: body.scanRef,
    studentId: body.studentId,
    logType: body.logType,
    kioskId: body.kioskId,
    userLogged: body.userLogged,
    scanDate: body.scanDate,
    scanTime: body.scanTime,
    verified: body.verified,
  });
  res.status(201).json(log);
}));

attendanceLogsRouter.delete('/', asyncRoute(async (req, res) => {
  const ids = (req.body as { ids?: unknown }).ids;
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => Number.isInteger(id) && id > 0)) {
    res.status(400).json({ message: 'Provide one or more valid attendance log ids' });
    return;
  }

  const uniqueIds = [...new Set(ids as number[])];
  const deletedCount = await deleteAttendanceLogs(uniqueIds);
  res.json({ deletedCount });
}));

attendanceLogsRouter.delete('/:id', asyncRoute(async (req, res) => {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: 'Invalid attendance log id' });
    return;
  }
  if (!await getAttendanceLogById(id)) {
    res.status(404).json({ message: 'Attendance log not found' });
    return;
  }
  await deleteAttendanceLog(id);
  res.status(204).send();
}));
