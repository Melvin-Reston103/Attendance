import { Router } from 'express';
import { getStudentById } from '../models/student.model';
import {
  createAttendanceLog,
  deleteAttendanceLog,
  getAttendanceLogById,
  listAttendanceLogs,
  listAttendanceLogsByStudent,
  type NewAttendanceLog,
} from '../models/attendance.model';

export const attendanceLogsRouter = Router();

attendanceLogsRouter.get('/', (req, res) => {
  const studentId = req.query['studentId'];
  if (typeof studentId === 'string' && studentId.length > 0) {
    res.json(listAttendanceLogsByStudent(studentId));
    return;
  }
  res.json(listAttendanceLogs());
});

attendanceLogsRouter.post('/', (req, res) => {
  const body = req.body as Partial<NewAttendanceLog>;
  if (
    !body.scanRef ||
    !body.studentId ||
    !body.logType ||
    !body.kioskId ||
    !body.scanDate ||
    !body.scanTime
  ) {
    res.status(400).json({ message: 'Missing required attendance log fields' });
    return;
  }
  if (!getStudentById(body.studentId)) {
    res.status(404).json({ message: 'Student not found' });
    return;
  }
  if (listAttendanceLogs().some((existing) => existing.scanRef === body.scanRef)) {
    res.status(409).json({ message: 'Attendance log with this scan reference already exists' });
    return;
  }
  const log = createAttendanceLog({
    scanRef: body.scanRef,
    studentId: body.studentId,
    logType: body.logType,
    kioskId: body.kioskId,
    scanDate: body.scanDate,
    scanTime: body.scanTime,
    verified: body.verified,
  });
  res.status(201).json(log);
});

attendanceLogsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: 'Invalid attendance log id' });
    return;
  }
  if (!getAttendanceLogById(id)) {
    res.status(404).json({ message: 'Attendance log not found' });
    return;
  }
  deleteAttendanceLog(id);
  res.status(204).send();
});
