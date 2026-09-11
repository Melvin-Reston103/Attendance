# Attendance Backend

REST API backend for the Attendance system, using Express and SQLite (via `better-sqlite3`).

## Setup

```bash
npm install
npm run dev
```

The server starts on `http://localhost:3000` and creates the SQLite database file at `data/attendance.db` on first boot, applying the schema in [src/db/schema.sql](src/db/schema.sql).

## Scripts

- `npm run dev` — run with hot reload (tsx watch)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled server

## Database schema

- `departments`, `factions`, `kiosks` — fixed lookup tables, seeded on boot
- `students` — student directory (id, name, email, course, year/section, department, faction, check-in status)
- `attendance_logs` — one row per kiosk scan (TIME IN / TIME OUT), linked to `students`

## API

- `GET /api/health`
- `GET /api/students`
- `GET /api/students/:id`
- `POST /api/students`
- `PATCH /api/students/:id/status`
- `DELETE /api/students/:id`
- `GET /api/attendance-logs` (optional `?studentId=` filter)
- `POST /api/attendance-logs`
