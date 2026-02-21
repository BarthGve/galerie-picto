import { eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { users } from "../schema.js";

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
  const row = db
    .select({
      githubLogin: users.githubLogin,
      githubName: users.githubName,
      githubAvatarUrl: users.githubAvatarUrl,
      githubEmail: users.githubEmail,
      firstSeenAt: users.firstSeenAt,
      lastSeenAt: users.lastSeenAt,
      favoritesCount: sql<number>`(SELECT COUNT(*) FROM favorites WHERE user_login = ${login})`,
      collectionsCount: sql<number>`(SELECT COUNT(*) FROM user_collections WHERE user_login = ${login})`,
      likesCount: sql<number>`(SELECT COUNT(*) FROM pictogram_likes WHERE user_login = ${login})`,
    })
    .from(users)
    .where(eq(users.githubLogin, login))
    .get();

  if (!row) return null;

  return {
    githubLogin: row.githubLogin,
    githubName: row.githubName ?? null,
    githubAvatarUrl: row.githubAvatarUrl ?? null,
    githubEmail: row.githubEmail ?? null,
    firstSeenAt: row.firstSeenAt ?? null,
    lastSeenAt: row.lastSeenAt ?? null,
    stats: {
      favoritesCount: Number(row.favoritesCount),
      collectionsCount: Number(row.collectionsCount),
      likesCount: Number(row.likesCount),
    },
  };
}

export function deleteUser(login: string): boolean {
  const result = db.delete(users).where(eq(users.githubLogin, login)).run();
  return result.changes > 0;
}
