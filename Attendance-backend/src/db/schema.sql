-- Reference lookup tables mirroring the frontend's fixed enum values.
CREATE TABLE
    IF NOT EXISTS departments (id TEXT PRIMARY KEY, label TEXT NOT NULL);

CREATE TABLE
    IF NOT EXISTS factions (id TEXT PRIMARY KEY, label TEXT NOT NULL);

CREATE TABLE
    IF NOT EXISTS kiosks (id TEXT PRIMARY KEY, label TEXT NOT NULL);

-- Student directory: one row per enrolled student/delegate.
CREATE TABLE
    IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        photo_url TEXT,
        course TEXT NOT NULL,
        department_id TEXT NOT NULL REFERENCES departments (id),
        faction_id TEXT NOT NULL REFERENCES factions (id),
        status TEXT NOT NULL DEFAULT 'not-logged' CHECK (
            status IN ('checked-in', 'checked-out', 'not-logged')
        ),
        status_time TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime ('now'))
    );

-- Attendance logs: one row per kiosk scan (time in / time out) for a student.
CREATE TABLE
    IF NOT EXISTS attendance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_ref TEXT NOT NULL UNIQUE,
        student_id TEXT NOT NULL REFERENCES students (id),
        log_type TEXT NOT NULL CHECK (log_type IN ('TIME IN', 'TIME OUT')),
        kiosk_id TEXT NOT NULL REFERENCES kiosks (id),
        scan_date TEXT NOT NULL,
        scan_time TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime ('now'))
    );

CREATE INDEX IF NOT EXISTS idx_attendance_logs_student_id ON attendance_logs (student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_scan_date ON attendance_logs (scan_date);