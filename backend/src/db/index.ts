import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "fs";
import { dirname } from "path";
import * as schema from "./schema.js";
import { runMigrationPreflight } from "./migration-preflight.js";

const DB_PATH = process.env.DATABASE_PATH || "./data/galerie.db";

// Ensure directory exists
mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("cache_size = -20000");
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("wal_autocheckpoint = 1000");

export const db = drizzle(sqlite, { schema });

export function runMigrations() {
  // Detect partially-applied migrations and register them before Drizzle runs
  runMigrationPreflight(sqlite);
  migrate(db, { migrationsFolder: "./drizzle" });

  console.log(`Database ready at ${DB_PATH}`);
}

export function closeDb() {
  sqlite.close();
}
