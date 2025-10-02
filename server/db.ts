import dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For SQLite, extract the file path from the DATABASE_URL
const dbPath = process.env.DATABASE_URL.replace('file:', '');

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Export pool for compatibility (even though SQLite doesn't use pools)
export const pool = {
  query: (sql: string, params?: any[]) => {
    return sqlite.prepare(sql).all(params || []);
  }
};