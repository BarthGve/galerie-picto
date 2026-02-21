import { createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "../index.js";
import { galleries, galleryPictograms } from "../schema.js";
import type { Gallery, GalleriesFile } from "../../types.js";

let cachedGalleries: { json: string; etag: string; updatedAt: number } | null =
  null;

function invalidateCache() {
  cachedGalleries = null;
}

function buildGallery(
  row: typeof galleries.$inferSelect,
  pictogramIds: string[],
): Gallery {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    color: row.color || undefined,
    pictogramIds,
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

export function getAllGalleries(): Gallery[] {
  const rows = db.select().from(galleries).all();
  const gpRows = db.select().from(galleryPictograms).all();

  const pictoMap = new Map<string, string[]>();
  for (const gp of gpRows) {
    const arr = pictoMap.get(gp.galleryId) || [];
    arr.push(gp.pictogramId);
    pictoMap.set(gp.galleryId, arr);
  }

  return rows.map((row) => buildGallery(row, pictoMap.get(row.id) || []));
}

export function getGalleriesCached(): { json: string; etag: string } {
  if (cachedGalleries && Date.now() - cachedGalleries.updatedAt < 30_000) {
    return { json: cachedGalleries.json, etag: cachedGalleries.etag };
  }

  const galleriesList = getAllGalleries();
  const data: GalleriesFile = {
    galleries: galleriesList,
    lastUpdated: new Date().toISOString(),
  };
  const json = JSON.stringify(data);
  const etag = `"${createHash("sha256").update(json).digest("hex").slice(0, 32)}"`;

  cachedGalleries = { json, etag, updatedAt: Date.now() };
  return { json, etag };
}

export function getGalleryById(id: string): Gallery | null {
  const row = db.select().from(galleries).where(eq(galleries.id, id)).get();
  if (!row) return null;

  const pictoIds = db
    .select()
    .from(galleryPictograms)
    .where(eq(galleryPictograms.galleryId, id))
    .all()
    .map((gp) => gp.pictogramId);

  return buildGallery(row, pictoIds);
}

export function createGallery(data: {
  id: string;
  name: string;
  description?: string;
  color?: string;
}): Gallery {
  const now = new Date().toISOString();
  db.insert(galleries)
    .values({
      id: data.id,
      name: data.name,
      description: data.description || null,
      color: data.color || null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  invalidateCache();
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    color: data.color,
    pictogramIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function updateGallery(
  id: string,
  data: { name?: string; description?: string; color?: string },
): Gallery | null {
  const existing = db
    .select()
    .from(galleries)
    .where(eq(galleries.id, id))
    .get();
  if (!existing) return null;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.color !== undefined) updates.color = data.color;

  db.update(galleries).set(updates).where(eq(galleries.id, id)).run();

  invalidateCache();
  return getGalleryById(id);
}

export function deleteGallery(id: string): boolean {
  const result = db.delete(galleries).where(eq(galleries.id, id)).run();
  invalidateCache();
  return result.changes > 0;
}

export function addPictogramsToGallery(
  galleryId: string,
  pictogramIds: string[],
): void {
  const now = new Date().toISOString();
  db.transaction((tx) => {
    for (const pictoId of pictogramIds) {
      tx.insert(galleryPictograms)
        .values({ galleryId, pictogramId: pictoId })
        .onConflictDoNothing()
        .run();
    }
    tx.update(galleries)
      .set({ updatedAt: now })
      .where(eq(galleries.id, galleryId))
      .run();
  });
  invalidateCache();
}

export function removePictogramFromGallery(
  galleryId: string,
  pictogramId: string,
): void {
  db.delete(galleryPictograms)
    .where(
      and(
        eq(galleryPictograms.galleryId, galleryId),
        eq(galleryPictograms.pictogramId, pictogramId),
      ),
    )
    .run();
  db.update(galleries)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(galleries.id, galleryId))
    .run();
  invalidateCache();
}
