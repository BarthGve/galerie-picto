import "dotenv/config";
import { config } from "../config.js";
import { db, runMigrations } from "./index.js";
import {
  pictograms,
  galleries,
  galleryPictograms,
  downloads,
} from "./schema.js";
import type { PictogramManifest, GalleriesFile } from "../types.js";

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

async function seed() {
  console.log("Running migrations...");
  runMigrations();

  const prefix = config.minio.prefix;

  // 1. Seed pictograms
  console.log("Reading pictograms-manifest.json from Minio...");
  const manifest = await readJsonFromMinio<PictogramManifest>(
    `${prefix}pictograms-manifest.json`,
  );

  if (manifest && manifest.pictograms.length > 0) {
    console.log(`Inserting ${manifest.pictograms.length} pictograms...`);
    for (const p of manifest.pictograms) {
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
    console.log("Pictograms inserted.");
  } else {
    console.log("No pictograms found in Minio.");
  }

  // 2. Seed galleries
  console.log("Reading galleries.json from Minio...");
  const galleriesFile = await readJsonFromMinio<GalleriesFile>(
    `${prefix}galleries.json`,
  );

  if (galleriesFile && galleriesFile.galleries.length > 0) {
    console.log(`Inserting ${galleriesFile.galleries.length} galleries...`);
    for (const g of galleriesFile.galleries) {
      db.insert(galleries)
        .values({
          id: g.id,
          name: g.name,
          description: g.description || null,
          color: g.color || null,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
        })
        .onConflictDoNothing()
        .run();

      // Insert gallery-pictogram associations
      for (const pictoId of g.pictogramIds) {
        db.insert(galleryPictograms)
          .values({ galleryId: g.id, pictogramId: pictoId })
          .onConflictDoNothing()
          .run();
      }
    }
    console.log("Galleries inserted.");
  } else {
    console.log("No galleries found in Minio.");
  }

  // 3. Seed downloads
  console.log("Reading downloads.json from Minio...");
  const downloadsData = await readJsonFromMinio<Record<string, number>>(
    `${prefix}downloads.json`,
  );

  if (downloadsData && Object.keys(downloadsData).length > 0) {
    console.log(
      `Inserting ${Object.keys(downloadsData).length} download counters...`,
    );
    for (const [pictoId, count] of Object.entries(downloadsData)) {
      db.insert(downloads)
        .values({ pictogramId: pictoId, count })
        .onConflictDoNothing()
        .run();
    }
    console.log("Downloads inserted.");
  } else {
    console.log("No downloads found in Minio.");
  }

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
