import { eq, and } from "drizzle-orm";
import { db } from "../index.js";
import { favorites } from "../schema.js";

export function getFavorites(userLogin: string): string[] {
  return db
    .select({ pictogramId: favorites.pictogramId })
    .from(favorites)
    .where(eq(favorites.userLogin, userLogin))
    .all()
    .map((row) => row.pictogramId);
}

export function addFavorite(userLogin: string, pictogramId: string): boolean {
  try {
    db.insert(favorites)
      .values({ userLogin, pictogramId })
      .onConflictDoNothing()
      .run();
    return true;
  } catch {
    return false;
  }
}

export function removeFavorite(
  userLogin: string,
  pictogramId: string,
): boolean {
  const result = db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userLogin, userLogin),
        eq(favorites.pictogramId, pictogramId),
      ),
    )
    .run();
  return result.changes > 0;
}
