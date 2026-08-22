import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from '@/db/schema';

const url = process.env.TURSO_DATABASE_URL || 'file:./local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!process.env.TURSO_DATABASE_URL) {
  console.warn('[db] TURSO_DATABASE_URL not set — falling back to local SQLite file (./local.db).');
}

const client = createClient(
  authToken ? { url, authToken } : { url }
);

export const db = drizzle(client, { schema });

// Bootstraps the schema with idempotent DDL so a fresh checkout (local file
// or a brand new Turso database) works immediately without a manual
// migration step. Real schema evolutions still go through drizzle-kit.
let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          total_mastery_points INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
      `);
      await client.execute(`
        CREATE TABLE IF NOT EXISTS game_runs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          game_key TEXT NOT NULL,
          score INTEGER NOT NULL,
          total_to_guess INTEGER NOT NULL,
          mastery_points INTEGER NOT NULL,
          difficulty TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
      `);
      await client.execute(`CREATE INDEX IF NOT EXISTS game_runs_game_key_idx ON game_runs(game_key, mastery_points DESC);`);
      await client.execute(`CREATE INDEX IF NOT EXISTS game_runs_user_id_idx ON game_runs(user_id);`);
    })();
  }
  return schemaReady;
}
