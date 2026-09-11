import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { initDatabase } from './db/database';
import { attendanceLogsRouter } from './routes/attendance-logs.routes';
import { studentsRouter } from './routes/students.routes';

const PORT = Number(process.env['PORT']) || 3000;

initDatabase();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/students', studentsRouter);
app.use('/api/attendance-logs', attendanceLogsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

/** Catches errors from route handlers and returns a sanitized JSON response, never leaking stack traces to clients. */
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Attendance backend listening on http://localhost:${PORT}`);
});
