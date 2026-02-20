import { eq, and, sql } from "drizzle-orm";
import { db } from "../index.js";
import {
  userCollections,
  userCollectionPictograms,
  userCollectionUserPictograms,
} from "../schema.js";

const MAX_COLLECTIONS = 20;
const MAX_PICTOS_PER_COLLECTION = 200;

export interface UserCollection {
  id: string;
  userLogin: string;
  name: string;
  description: string | null;
  color: string | null;
  position: number;
  createdAt: string | null;
  updatedAt: string | null;
  pictogramIds: string[];
  userPictogramIds: string[];
}

function rowToCollection(
  row: typeof userCollections.$inferSelect,
  pictogramIds: string[] = [],
  userPictogramIds: string[] = [],
): UserCollection {
  return {
    id: row.id,
    userLogin: row.userLogin,
    name: row.name,
    description: row.description ?? null,
    color: row.color,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pictogramIds,
    userPictogramIds,
  };
}

export function getUserCollections(userLogin: string): UserCollection[] {
  const cols = db
    .select()
    .from(userCollections)
    .where(eq(userCollections.userLogin, userLogin))
    .orderBy(userCollections.position)
    .all();

  if (cols.length === 0) return [];

  const links = db
    .select()
    .from(userCollectionPictograms)
    .where(
      eq(
        userCollectionPictograms.collectionId,
        sql`(SELECT id FROM user_collections WHERE user_login = ${userLogin})`,
      ),
    )
    .all();

  // Build pictoIds map per collection
  const pictoMap = new Map<string, string[]>();
  const userPictoMap = new Map<string, string[]>();
  // Re-fetch links properly per collection
  for (const col of cols) {
    const pictos = db
      .select({ pictogramId: userCollectionPictograms.pictogramId })
      .from(userCollectionPictograms)
      .where(eq(userCollectionPictograms.collectionId, col.id))
      .orderBy(userCollectionPictograms.position)
      .all()
      .map((r) => r.pictogramId);
    pictoMap.set(col.id, pictos);

    const userPictos = db
      .select({ userPictogramId: userCollectionUserPictograms.userPictogramId })
      .from(userCollectionUserPictograms)
      .where(eq(userCollectionUserPictograms.collectionId, col.id))
      .orderBy(userCollectionUserPictograms.position)
      .all()
      .map((r) => r.userPictogramId);
    userPictoMap.set(col.id, userPictos);
  }

  // suppress unused lint warning
  void links;

  return cols.map((col) =>
    rowToCollection(
      col,
      pictoMap.get(col.id) ?? [],
      userPictoMap.get(col.id) ?? [],
    ),
  );
}

export function getCollectionById(
  id: string,
  userLogin: string,
): UserCollection | null {
  const col = db
    .select()
    .from(userCollections)
    .where(
      and(eq(userCollections.id, id), eq(userCollections.userLogin, userLogin)),
    )
    .get();
  if (!col) return null;

  const pictogramIds = db
    .select({ pictogramId: userCollectionPictograms.pictogramId })
    .from(userCollectionPictograms)
    .where(eq(userCollectionPictograms.collectionId, id))
    .orderBy(userCollectionPictograms.position)
    .all()
    .map((r) => r.pictogramId);

  const userPictogramIds = db
    .select({ userPictogramId: userCollectionUserPictograms.userPictogramId })
    .from(userCollectionUserPictograms)
    .where(eq(userCollectionUserPictograms.collectionId, id))
    .orderBy(userCollectionUserPictograms.position)
    .all()
    .map((r) => r.userPictogramId);

  return rowToCollection(col, pictogramIds, userPictogramIds);
}

export function createCollection(
  userLogin: string,
  name: string,
  color?: string,
  description?: string,
): UserCollection | null {
  const count = db
    .select({ count: sql<number>`count(*)` })
    .from(userCollections)
    .where(eq(userCollections.userLogin, userLogin))
    .get();

  if ((count?.count ?? 0) >= MAX_COLLECTIONS) return null;

  const maxPos = db
    .select({ max: sql<number>`COALESCE(MAX(position), -1)` })
    .from(userCollections)
    .where(eq(userCollections.userLogin, userLogin))
    .get();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.insert(userCollections)
    .values({
      id,
      userLogin,
      name,
      description: description ?? null,
      color: color ?? null,
      position: (maxPos?.max ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return getCollectionById(id, userLogin);
}

export function updateCollection(
  id: string,
  userLogin: string,
  data: { name?: string; color?: string | null; description?: string | null },
): UserCollection | null {
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (data.name !== undefined) updates.name = data.name;
  if ("color" in data) updates.color = data.color ?? null;
  if ("description" in data) updates.description = data.description ?? null;

  db.update(userCollections)
    .set(updates)
    .where(
      and(eq(userCollections.id, id), eq(userCollections.userLogin, userLogin)),
    )
    .run();

  return getCollectionById(id, userLogin);
}

export function deleteCollection(id: string, userLogin: string): boolean {
  const result = db
    .delete(userCollections)
    .where(
      and(eq(userCollections.id, id), eq(userCollections.userLogin, userLogin)),
    )
    .run();
  return result.changes > 0;
}

export function addPictogramToCollection(
  collectionId: string,
  userLogin: string,
  pictogramId: string,
): "ok" | "not_found" | "already_in" | "limit_reached" {
  const col = db
    .select()
    .from(userCollections)
    .where(
      and(
        eq(userCollections.id, collectionId),
        eq(userCollections.userLogin, userLogin),
      ),
    )
    .get();
  if (!col) return "not_found";

  const exists = db
    .select()
    .from(userCollectionPictograms)
    .where(
      and(
        eq(userCollectionPictograms.collectionId, collectionId),
        eq(userCollectionPictograms.pictogramId, pictogramId),
      ),
    )
    .get();
  if (exists) return "already_in";

  const count = db
    .select({ count: sql<number>`count(*)` })
    .from(userCollectionPictograms)
    .where(eq(userCollectionPictograms.collectionId, collectionId))
    .get();
  if ((count?.count ?? 0) >= MAX_PICTOS_PER_COLLECTION) return "limit_reached";

  const maxPos = db
    .select({ max: sql<number>`COALESCE(MAX(position), -1)` })
    .from(userCollectionPictograms)
    .where(eq(userCollectionPictograms.collectionId, collectionId))
    .get();

  db.insert(userCollectionPictograms)
    .values({
      collectionId,
      pictogramId,
      position: (maxPos?.max ?? -1) + 1,
      addedAt: new Date().toISOString(),
    })
    .run();

  return "ok";
}

export function removePictogramFromCollection(
  collectionId: string,
  userLogin: string,
  pictogramId: string,
): boolean {
  // Verify ownership
  const col = db
    .select()
    .from(userCollections)
    .where(
      and(
        eq(userCollections.id, collectionId),
        eq(userCollections.userLogin, userLogin),
      ),
    )
    .get();
  if (!col) return false;

  const result = db
    .delete(userCollectionPictograms)
    .where(
      and(
        eq(userCollectionPictograms.collectionId, collectionId),
        eq(userCollectionPictograms.pictogramId, pictogramId),
      ),
    )
    .run();
  return result.changes > 0;
}

export function reorderCollections(
  userLogin: string,
  collectionIds: string[],
): void {
  for (let i = 0; i < collectionIds.length; i++) {
    db.update(userCollections)
      .set({ position: i, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(userCollections.id, collectionIds[i]),
          eq(userCollections.userLogin, userLogin),
        ),
      )
      .run();
  }
}

export function reorderPictogramsInCollection(
  collectionId: string,
  userLogin: string,
  pictogramIds: string[],
): boolean {
  const col = db
    .select()
    .from(userCollections)
    .where(
      and(
        eq(userCollections.id, collectionId),
        eq(userCollections.userLogin, userLogin),
      ),
    )
    .get();
  if (!col) return false;

  for (let i = 0; i < pictogramIds.length; i++) {
    db.update(userCollectionPictograms)
      .set({ position: i })
      .where(
        and(
          eq(userCollectionPictograms.collectionId, collectionId),
          eq(userCollectionPictograms.pictogramId, pictogramIds[i]),
        ),
      )
      .run();
  }
  return true;
}
