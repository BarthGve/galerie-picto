import "dotenv/config";
import { sql } from "drizzle-orm";
import { config } from "../config.js";
import { db, runMigrations } from "./index.js";
import { pictograms, downloads } from "./schema.js";
import type { PictogramManifest } from "../types.js";

function buildUrl(key: string): string {
  return `${config.minio.endpoint}/${config.minio.bucket}/${key}`;
}

async function readJsonFromMinio<T>(key: string): Promise<T | null> {
  try {
    const response = await fetch(buildUrl(key));
    if (!response.ok) return null;
    const body = await response.text();
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

async function seedData() {
  const prefix = config.minio.prefix;

  // 1. Seed pictograms
  console.log("[seed] Reading pictograms-manifest.json from Minio...");
  const manifest = await readJsonFromMinio<PictogramManifest>(
    `${prefix}pictograms-manifest.json`,
  );

  if (manifest && manifest.pictograms.length > 0) {
    console.log(`[seed] Inserting ${manifest.pictograms.length} pictograms...`);
    for (const p of manifest.pictograms) {
      if (p.filename.endsWith("_dark.svg")) continue;
      db.insert(pictograms)
        .values({
          id: p.id,
          name: p.name,
          filename: p.filename,
          url: p.url,
          size: p.size,
          lastModified: p.lastModified,
          tags: p.tags ? JSON.stringify(p.tags) : null,
          contributorUsername: p.contributor?.githubUsername || null,
          contributorAvatarUrl: p.contributor?.githubAvatarUrl || null,
        })
        .onConflictDoNothing()
        .run();
    }
    console.log("[seed] Pictograms inserted.");
  } else {
    console.log("[seed] No pictograms found in Minio.");
  }

  // 2. Seed downloads
  console.log("[seed] Reading downloads.json from Minio...");
  const downloadsData = await readJsonFromMinio<Record<string, number>>(
    `${prefix}downloads.json`,
  );

  if (downloadsData && Object.keys(downloadsData).length > 0) {
    console.log(
      `[seed] Inserting ${Object.keys(downloadsData).length} download counters...`,
    );
    for (const [pictoId, count] of Object.entries(downloadsData)) {
      db.insert(downloads)
        .values({ pictogramId: pictoId, count })
        .onConflictDoNothing()
        .run();
    }
    console.log("[seed] Downloads inserted.");
  } else {
    console.log("[seed] No downloads found in Minio.");
  }

  console.log("[seed] Seed complete!");
}

/**
 * Auto-seed from Minio if the pictograms table is empty.
 * Called at server startup to ensure prod DB is populated.
 */
export async function autoSeedIfEmpty(): Promise<void> {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(pictograms)
    .get();
  const count = result?.count ?? 0;

  if (count > 0) {
    console.log(
      `[seed] Database already has ${count} pictograms, skipping auto-seed.`,
    );
    return;
  }

  console.log("[seed] Database is empty, auto-seeding from Minio...");
  await seedData();
}

// Direct execution (npx tsx src/db/seed-from-minio.ts)
const isDirectRun = process.argv[1]?.includes("seed-from-minio");
if (isDirectRun) {
  runMigrations();
  seedData().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
