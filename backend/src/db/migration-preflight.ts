/**
 * Migration pre-flight check.
 *
 * Drizzle's migrator crashes hard when a DDL statement has already been applied
 * (e.g. "index already exists", "duplicate column"). This happens when SQL was
 * run manually on the DB without registering the migration hash.
 *
 * This module reads the journal + the DB's __drizzle_migrations table, detects
 * migrations that are about to be applied, and for each one:
 *   1. Tries each statement individually against the DB.
 *   2. If a statement fails because the object already exists, skips it.
 *   3. If ALL statements succeed (or were skipped), registers the hash so
 *      Drizzle's own migrator considers it done.
 *
 * Call `runMigrationPreflight(sqlite)` BEFORE `migrate(db, ...)`.
 */
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import type Database from "better-sqlite3";

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  entries: JournalEntry[];
}

interface DbMigration {
  hash: string;
  created_at: number;
}

const MIGRATIONS_FOLDER = "./drizzle";

/** SQLite errors that indicate the DDL was already applied. */
const ALREADY_EXISTS_PATTERNS = ["already exists", "duplicate column name"];

function isAlreadyAppliedError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return ALREADY_EXISTS_PATTERNS.some((p) => lower.includes(p));
}

export function runMigrationPreflight(sqlite: Database.Database): void {
  // Read journal
  const journalPath = join(MIGRATIONS_FOLDER, "meta", "_journal.json");
  let journal: Journal;
  try {
    journal = JSON.parse(readFileSync(journalPath, "utf-8")) as Journal;
  } catch {
    console.warn(
      "[preflight] Could not read migration journal, skipping preflight.",
    );
    return;
  }

  // Ensure __drizzle_migrations table exists
  const tableExists = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'",
    )
    .get();
  if (!tableExists) {
    // First run ever — let Drizzle handle everything
    return;
  }

  // Read applied migrations from DB, ordered by created_at
  const applied = sqlite
    .prepare(
      "SELECT hash, created_at FROM __drizzle_migrations ORDER BY created_at",
    )
    .all() as DbMigration[];

  const appliedCount = applied.length;
  const journalCount = journal.entries.length;

  if (appliedCount >= journalCount) {
    // All migrations already registered — nothing to do
    return;
  }

  // The pending migrations are journal entries from index appliedCount onward
  const pending = journal.entries.slice(appliedCount);

  console.log(
    `[preflight] ${appliedCount}/${journalCount} migrations applied. Checking ${pending.length} pending…`,
  );

  let autoFixed = 0;

  for (const entry of pending) {
    const sqlPath = join(MIGRATIONS_FOLDER, `${entry.tag}.sql`);
    let sql: string;
    try {
      sql = readFileSync(sqlPath, "utf-8");
    } catch {
      // File missing — let Drizzle handle (it will error with a clear message)
      console.warn(`[preflight] Migration file not found: ${sqlPath}`);
      break;
    }

    const hash = createHash("sha256").update(sql).digest("hex");

    // Split on the Drizzle breakpoint marker
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    let allApplied = true;
    let hadError = false;

    for (const stmt of statements) {
      try {
        sqlite.prepare(stmt).run();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (isAlreadyAppliedError(msg)) {
          // Already applied — safe to skip
          console.log(
            `[preflight] ⏭ Skipped (already exists): ${stmt.slice(0, 80)}…`,
          );
        } else {
          // Real error — stop here, let Drizzle report it
          console.error(`[preflight] ✗ Failed: ${stmt.slice(0, 80)}…`);
          console.error(`[preflight]   Error: ${msg}`);
          hadError = true;
          allApplied = false;
          break;
        }
      }
    }

    if (hadError) {
      // Don't register — let Drizzle crash with its normal error for this one
      break;
    }

    if (allApplied) {
      // Register the migration hash so Drizzle considers it done
      sqlite
        .prepare(
          "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
        )
        .run(hash, entry.when);
      autoFixed++;
      console.log(`[preflight] ✓ Registered: ${entry.tag} (auto-applied)`);
    }
  }

  if (autoFixed > 0) {
    console.log(
      `[preflight] Auto-applied ${autoFixed} migration(s) that had partially applied DDL.`,
    );
  }
}
