import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = join(__dirname, '..', '..', 'data');
const DB_PATH = join(DATA_DIR, 'attendance.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/** Applies the schema and seeds fixed lookup tables (idempotent, safe to call on every boot). */
export function initDatabase(): void {
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  migrateStudentsTable();
  seedLookupTables();
}

function migrateStudentsTable(): void {
  const columns = db.prepare('PRAGMA table_info(students)').all() as Array<{ name: string }>;
  if (columns.some((column) => column.name === 'year_section')) {
    db.exec('ALTER TABLE students DROP COLUMN year_section');
  }
}

function seedLookupTables(): void {
  const departments = [
    { id: 'college', label: 'College' },
    { id: 'high-school', label: 'High School' },
  ];
  const factions = [
    { id: 'duces-mercaturae', label: 'Duces Mercaturae' },
    { id: 'luminary-acharya', label: 'Luminary Acharya' },
    { id: 'gray-wolves', label: 'Gray Wolves' },
    { id: 'blue-bobcat', label: 'Blue Bobcat' },
    { id: 'golden-falcon', label: 'Golden Falcon' },
  ];
  const kiosks = [
    { id: 'gate1', label: 'Gate 1 South Kiosk' },
    { id: 'gym', label: 'Gym North Station' },
    { id: 'grandstand', label: 'Main Grandstand Station' },
    { id: 'auditorium', label: 'Auditorium East Kiosk' },
  ];

  const insertDepartment = db.prepare(
    'INSERT OR IGNORE INTO departments (id, label) VALUES (@id, @label)',
  );
  const insertFaction = db.prepare(
    'INSERT OR IGNORE INTO factions (id, label) VALUES (@id, @label)',
  );
  const insertKiosk = db.prepare('INSERT OR IGNORE INTO kiosks (id, label) VALUES (@id, @label)');

  db.exec('BEGIN');
  try {
    for (const department of departments) insertDepartment.run(department);
    for (const faction of factions) insertFaction.run(faction);
    for (const kiosk of kiosks) insertKiosk.run(kiosk);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
