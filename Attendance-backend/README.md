# Attendance Backend

REST API backend for the Attendance system, using Express and PostgreSQL.

## Setup

```bash
npm install
copy .env.example .env
npm run db:up
npm run dev
```

The commands above create the local environment file and start PostgreSQL with Docker Compose. On macOS or Linux, use `cp .env.example .env` instead of `copy`.

To start PostgreSQL separately:

```bash
docker compose up -d
```

The server starts on `http://localhost:3000`. On every boot it connects using `DATABASE_URL`, applies [src/db/schema.sql](src/db/schema.sql), and safely seeds the fixed lookup rows. The Compose volume `attendance-postgres-data` keeps local data across container restarts.

## Migrate the existing SQLite data

The repository's existing SQLite database contains student and attendance data. After PostgreSQL is running and `.env` is configured, import it once with:

```bash
npm run migrate:sqlite
```

The migration is idempotent: students are updated by ID and existing attendance logs are not duplicated. `SQLITE_DATABASE_PATH` can point to a different source file.

## Render deployment

1. Create a Render PostgreSQL database.
2. Set the backend service's `DATABASE_URL` to the database's internal URL.
3. Set `DATABASE_SSL=false` for Render's internal database connection. Use `true` only for providers whose external connection requires TLS.
4. Deploy the backend. Its existing `npm run build` and `npm start` commands initialize the schema automatically.

PostgreSQL storage belongs to the managed database and is not deleted when the web service redeploys. Do not use `DATABASE_PATH`; that variable was only for SQLite.

To transfer the existing local SQLite records to the hosted database, temporarily put the hosted connection URL in `.env`, set `DATABASE_SSL` as required by the provider, and run `npm run migrate:sqlite` from a trusted machine.

## Scripts

- `npm run dev` — run with hot reload (tsx watch)
- `npm run db:up` — start the local PostgreSQL container
- `npm run db:down` — stop the local PostgreSQL container without deleting its data volume
- `npm run build` — compile TypeScript to `dist/`
- `npm run migrate:sqlite` — import the legacy SQLite records into PostgreSQL
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
- `DELETE /api/attendance-logs` with `{ "ids": [1, 2] }` to delete selected logs
- `DELETE /api/attendance-logs/:id`
