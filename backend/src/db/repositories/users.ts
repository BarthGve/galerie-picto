import { eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import {
  users,
  favorites,
  userCollections,
  pictogramLikes,
} from "../schema.js";

export interface UserProfile {
  githubLogin: string;
  githubName: string | null;
  githubAvatarUrl: string | null;
  githubEmail: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  stats: {
    favoritesCount: number;
    collectionsCount: number;
    likesCount: number;
  };
}

export function upsertUser(data: {
  githubLogin: string;
  githubName?: string | null;
  githubAvatarUrl?: string | null;
  githubEmail?: string | null;
}): void {
  const now = new Date().toISOString();
  db.insert(users)
    .values({
      githubLogin: data.githubLogin,
      githubName: data.githubName || null,
      githubAvatarUrl: data.githubAvatarUrl || null,
      githubEmail: data.githubEmail || null,
      firstSeenAt: now,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: users.githubLogin,
      set: {
        githubName: data.githubName || null,
        githubAvatarUrl: data.githubAvatarUrl || null,
        githubEmail: data.githubEmail || null,
        lastSeenAt: now,
      },
    })
    .run();
}

export function getUserByLogin(
  login: string,
): typeof users.$inferSelect | null {
  return (
    db.select().from(users).where(eq(users.githubLogin, login)).get() || null
  );
}

export function getUserProfile(login: string): UserProfile | null {
  const user = db
    .select()
    .from(users)
    .where(eq(users.githubLogin, login))
    .get();
  if (!user) return null;

  const favoritesCount =
    db
      .select({ count: sql<number>`count(*)` })
      .from(favorites)
      .where(eq(favorites.userLogin, login))
      .get()?.count ?? 0;

  const collectionsCount =
    db
      .select({ count: sql<number>`count(*)` })
      .from(userCollections)
      .where(eq(userCollections.userLogin, login))
      .get()?.count ?? 0;

  const likesCount =
    db
      .select({ count: sql<number>`count(*)` })
      .from(pictogramLikes)
      .where(eq(pictogramLikes.userLogin, login))
      .get()?.count ?? 0;

  return {
    githubLogin: user.githubLogin,
    githubName: user.githubName ?? null,
    githubAvatarUrl: user.githubAvatarUrl ?? null,
    githubEmail: user.githubEmail ?? null,
    firstSeenAt: user.firstSeenAt ?? null,
    lastSeenAt: user.lastSeenAt ?? null,
    stats: { favoritesCount, collectionsCount, likesCount },
  };
}

export function deleteUser(login: string): boolean {
  const result = db.delete(users).where(eq(users.githubLogin, login)).run();
  return result.changes > 0;
}
