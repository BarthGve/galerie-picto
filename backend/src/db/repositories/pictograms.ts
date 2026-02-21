import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { pictograms, galleryPictograms } from "../schema.js";
import type { Pictogram, Contributor } from "../../types.js";

// In-memory cache for manifest endpoint
let cachedManifest: { json: string; etag: string; updatedAt: number } | null =
  null;
let manifestVersion = 0;

function invalidateCache() {
  cachedManifest = null;
  manifestVersion++;
}

function rowToPictogram(row: typeof pictograms.$inferSelect): Pictogram {
  return {
    id: row.id,
    name: row.name,
    filename: row.filename,
    url: row.url,
    size: row.size,
    lastModified: row.lastModified,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    galleryIds: undefined, // filled by getAllPictograms
    contributor: row.contributorUsername
      ? {
          githubUsername: row.contributorUsername,
          githubAvatarUrl: row.contributorAvatarUrl || "",
        }
      : undefined,
  };
}

export function getAllPictograms(): Pictogram[] {
  const rows = db.select().from(pictograms).all();

  // Fetch all gallery associations in one query
  const gpRows = db.select().from(galleryPictograms).all();
  const galleryMap = new Map<string, string[]>();
  for (const gp of gpRows) {
    const arr = galleryMap.get(gp.pictogramId) || [];
    arr.push(gp.galleryId);
    galleryMap.set(gp.pictogramId, arr);
  }

  return rows.map((row) => {
    const picto = rowToPictogram(row);
    const gids = galleryMap.get(row.id);
    if (gids && gids.length > 0) picto.galleryIds = gids;
    return picto;
  });
}

export function getManifestCached(): { json: string; etag: string } {
  if (cachedManifest && Date.now() - cachedManifest.updatedAt < 30_000) {
    return { json: cachedManifest.json, etag: cachedManifest.etag };
  }

  const pictos = getAllPictograms();
  const manifest = {
    pictograms: pictos,
    lastUpdated: new Date().toISOString(),
    totalCount: pictos.length,
  };
  const json = JSON.stringify(manifest);
  const etag = `"v${manifestVersion}"`;

  cachedManifest = { json, etag, updatedAt: Date.now() };
  return { json, etag };
}

export function getPictogramById(id: string): Pictogram | null {
  const row = db.select().from(pictograms).where(eq(pictograms.id, id)).get();
  if (!row) return null;

  const picto = rowToPictogram(row);
  const gids = db
    .select()
    .from(galleryPictograms)
    .where(eq(galleryPictograms.pictogramId, id))
    .all()
    .map((gp) => gp.galleryId);
  if (gids.length > 0) picto.galleryIds = gids;
  return picto;
}

export function insertPictogram(data: {
  id: string;
  name: string;
  filename: string;
  url: string;
  size: number;
  lastModified: string;
  tags?: string[];
  galleryIds?: string[];
  contributor?: Contributor;
}): void {
  db.transaction((tx) => {
    tx.insert(pictograms)
      .values({
        id: data.id,
        name: data.name,
        filename: data.filename,
        url: data.url,
        size: data.size,
        lastModified: data.lastModified,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        contributorUsername: data.contributor?.githubUsername || null,
        contributorAvatarUrl: data.contributor?.githubAvatarUrl || null,
      })
      .run();

    if (data.galleryIds && data.galleryIds.length > 0) {
      for (const galleryId of data.galleryIds) {
        tx.insert(galleryPictograms)
          .values({ galleryId, pictogramId: data.id })
          .onConflictDoNothing()
          .run();
      }
    }
  });

  invalidateCache();
}

export function updatePictogram(
  id: string,
  data: { name?: string; tags?: string[]; contributor?: Contributor | null },
): Pictogram | null {
  const existing = db
    .select()
    .from(pictograms)
    .where(eq(pictograms.id, id))
    .get();
  if (!existing) return null;

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.tags !== undefined) updates.tags = JSON.stringify(data.tags);
  if (data.contributor !== undefined) {
    updates.contributorUsername = data.contributor?.githubUsername ?? null;
    updates.contributorAvatarUrl = data.contributor?.githubAvatarUrl ?? null;
  }

  if (Object.keys(updates).length > 0) {
    db.update(pictograms).set(updates).where(eq(pictograms.id, id)).run();
  }

  invalidateCache();
  return getPictogramById(id);
}

export function deletePictogram(id: string): boolean {
  const result = db.delete(pictograms).where(eq(pictograms.id, id)).run();
  invalidateCache();
  return result.changes > 0;
}

export function findPictogramByFilename(
  filename: string,
): typeof pictograms.$inferSelect | null {
  return (
    db
      .select()
      .from(pictograms)
      .where(eq(pictograms.filename, filename))
      .get() || null
  );
}
