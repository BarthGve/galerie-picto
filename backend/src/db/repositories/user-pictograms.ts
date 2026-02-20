import { eq, and, sql } from "drizzle-orm";
import { db } from "../index.js";
import {
  userPictograms,
  userCollections,
  userCollectionUserPictograms,
} from "../schema.js";

export const USER_STORAGE_QUOTA = 5 * 1024 * 1024; // 5 Mo
const MAX_PICTOS_PER_COLLECTION = 200;

export interface UserPictogram {
  id: string;
  ownerLogin: string;
  name: string;
  filename: string;
  minioKey: string;
  size: number;
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

function rowToPictogram(
  row: typeof userPictograms.$inferSelect,
): UserPictogram {
  return {
    id: row.id,
    ownerLogin: row.ownerLogin,
    name: row.name,
    filename: row.filename,
    minioKey: row.minioKey,
    size: row.size,
    tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
  };
}

export function getUserPictograms(ownerLogin: string): UserPictogram[] {
  return db
    .select()
    .from(userPictograms)
    .where(eq(userPictograms.ownerLogin, ownerLogin))
    .all()
    .map(rowToPictogram);
}

export function getUserPictogramById(
  id: string,
  ownerLogin: string,
): UserPictogram | null {
  const row = db
    .select()
    .from(userPictograms)
    .where(
      and(eq(userPictograms.id, id), eq(userPictograms.ownerLogin, ownerLogin)),
    )
    .get();
  return row ? rowToPictogram(row) : null;
}

export function getUserStorageUsed(ownerLogin: string): number {
  const result = db
    .select({ total: sql<number>`COALESCE(SUM(size), 0)` })
    .from(userPictograms)
    .where(eq(userPictograms.ownerLogin, ownerLogin))
    .get();
  return result?.total ?? 0;
}

export function insertUserPictogram(data: {
  id: string;
  ownerLogin: string;
  name: string;
  filename: string;
  minioKey: string;
  size: number;
  tags?: string[];
}): UserPictogram {
  const now = new Date().toISOString();
  db.insert(userPictograms)
    .values({
      id: data.id,
      ownerLogin: data.ownerLogin,
      name: data.name,
      filename: data.filename,
      minioKey: data.minioKey,
      size: data.size,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return getUserPictogramById(data.id, data.ownerLogin)!;
}

export function updateUserPictogramName(
  id: string,
  ownerLogin: string,
  name: string,
): UserPictogram | null {
  db.update(userPictograms)
    .set({ name, updatedAt: new Date().toISOString() })
    .where(
      and(eq(userPictograms.id, id), eq(userPictograms.ownerLogin, ownerLogin)),
    )
    .run();
  return getUserPictogramById(id, ownerLogin);
}

export function deleteUserPictogram(
  id: string,
  ownerLogin: string,
): { minioKey: string } | null {
  const row = db
    .select({ minioKey: userPictograms.minioKey })
    .from(userPictograms)
    .where(
      and(eq(userPictograms.id, id), eq(userPictograms.ownerLogin, ownerLogin)),
    )
    .get();
  if (!row) return null;

  db.delete(userPictograms)
    .where(
      and(eq(userPictograms.id, id), eq(userPictograms.ownerLogin, ownerLogin)),
    )
    .run();

  return { minioKey: row.minioKey };
}

export function addUserPictogramToCollection(
  collectionId: string,
  ownerLogin: string,
  userPictogramId: string,
): "ok" | "not_found" | "already_in" | "limit_reached" {
  const col = db
    .select()
    .from(userCollections)
    .where(
      and(
        eq(userCollections.id, collectionId),
        eq(userCollections.userLogin, ownerLogin),
      ),
    )
    .get();
  if (!col) return "not_found";

  const exists = db
    .select()
    .from(userCollectionUserPictograms)
    .where(
      and(
        eq(userCollectionUserPictograms.collectionId, collectionId),
        eq(userCollectionUserPictograms.userPictogramId, userPictogramId),
      ),
    )
    .get();
  if (exists) return "already_in";

  const count = db
    .select({ count: sql<number>`count(*)` })
    .from(userCollectionUserPictograms)
    .where(eq(userCollectionUserPictograms.collectionId, collectionId))
    .get();
  if ((count?.count ?? 0) >= MAX_PICTOS_PER_COLLECTION) return "limit_reached";

  const maxPos = db
    .select({ max: sql<number>`COALESCE(MAX(position), -1)` })
    .from(userCollectionUserPictograms)
    .where(eq(userCollectionUserPictograms.collectionId, collectionId))
    .get();

  db.insert(userCollectionUserPictograms)
    .values({
      collectionId,
      userPictogramId,
      position: (maxPos?.max ?? -1) + 1,
      addedAt: new Date().toISOString(),
    })
    .run();

  return "ok";
}

export function removeUserPictogramFromCollection(
  collectionId: string,
  ownerLogin: string,
  userPictogramId: string,
): boolean {
  const col = db
    .select()
    .from(userCollections)
    .where(
      and(
        eq(userCollections.id, collectionId),
        eq(userCollections.userLogin, ownerLogin),
      ),
    )
    .get();
  if (!col) return false;

  const result = db
    .delete(userCollectionUserPictograms)
    .where(
      and(
        eq(userCollectionUserPictograms.collectionId, collectionId),
        eq(userCollectionUserPictograms.userPictogramId, userPictogramId),
      ),
    )
    .run();
  return result.changes > 0;
}
