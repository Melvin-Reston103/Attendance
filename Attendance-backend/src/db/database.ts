import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool, type PoolClient } from 'pg';

const DATABASE_URL = process.env['DATABASE_URL'];
const SCHEMA_PATH = join(__dirname, 'schema.sql');

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

export const db = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env['DATABASE_SSL'] === 'true' ? { rejectUnauthorized: false } : undefined,
});

/** Applies the schema and seeds fixed lookup tables (idempotent, safe to call on every boot). */
export async function initDatabase(): Promise<void> {
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  await db.query(schema);
  await db.query('ALTER TABLE students DROP COLUMN IF EXISTS year_section');
  await seedLookupTables();
}

async function seedLookupTables(): Promise<void> {
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

  await withTransaction(async (client) => {
    for (const department of departments) {
      await client.query(
        'INSERT INTO departments (id, label) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [department.id, department.label],
      );
    }
    for (const faction of factions) {
      await client.query(
        'INSERT INTO factions (id, label) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [faction.id, faction.label],
      );
    }
    for (const kiosk of kiosks) {
      await client.query(
        'INSERT INTO kiosks (id, label) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [kiosk.id, kiosk.label],
      );
    }
  });
}

export async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}