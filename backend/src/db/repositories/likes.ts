import { eq, and, sql } from "drizzle-orm";
import { db } from "../index.js";
import { pictogramLikes, likesCounts } from "../schema.js";

export function getLikesData(userLogin?: string): {
  counts: Record<string, number>;
  liked: string[];
} {
  const countRows = db.select().from(likesCounts).all();
  const counts: Record<string, number> = {};
  for (const row of countRows) {
    if (row.count > 0) counts[row.pictogramId] = row.count;
  }

  let liked: string[] = [];
  if (userLogin) {
    liked = db
      .select({ pictogramId: pictogramLikes.pictogramId })
      .from(pictogramLikes)
      .where(eq(pictogramLikes.userLogin, userLogin))
      .all()
      .map((r) => r.pictogramId);
  }

  return { counts, liked };
}

export function toggleLike(
  userLogin: string,
  pictogramId: string,
): { liked: boolean; count: number } {
  const existing = db
    .select()
    .from(pictogramLikes)
    .where(
      and(
        eq(pictogramLikes.userLogin, userLogin),
        eq(pictogramLikes.pictogramId, pictogramId),
      ),
    )
    .get();

  if (existing) {
    // Unlike
    const newCount = db.transaction((tx) => {
      tx.delete(pictogramLikes)
        .where(
          and(
            eq(pictogramLikes.userLogin, userLogin),
            eq(pictogramLikes.pictogramId, pictogramId),
          ),
        )
        .run();

      return tx
        .insert(likesCounts)
        .values({ pictogramId, count: 0 })
        .onConflictDoUpdate({
          target: likesCounts.pictogramId,
          set: { count: sql`MAX(0, ${likesCounts.count} - 1)` },
        })
        .returning()
        .get();
    });

    return { liked: false, count: newCount?.count ?? 0 };
  } else {
    // Like
    const newCount = db.transaction((tx) => {
      tx.insert(pictogramLikes).values({ userLogin, pictogramId }).run();

      return tx
        .insert(likesCounts)
        .values({ pictogramId, count: 1 })
        .onConflictDoUpdate({
          target: likesCounts.pictogramId,
          set: { count: sql`${likesCounts.count} + 1` },
        })
        .returning()
        .get();
    });

    return { liked: true, count: newCount?.count ?? 1 };
  }
}
