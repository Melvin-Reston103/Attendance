import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { initDatabase } from './db/database';
import { attendanceLogsRouter } from './routes/attendance-logs.routes';
import { studentsRouter } from './routes/students.routes';

const PORT = Number(process.env['PORT']) || 3000;

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

async function start(): Promise<void> {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Attendance backend listening on http://localhost:${PORT}`);
  });
}

void start().catch((error: unknown) => {
  console.error('Failed to start Attendance backend:', error);
  process.exit(1);
});
