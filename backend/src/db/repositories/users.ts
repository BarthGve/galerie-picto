import { eq, sql, like, or, desc, count } from "drizzle-orm";
import { db } from "../index.js";
import { users, userPictograms } from "../schema.js";
import { addBan, removeBan } from "../../middleware/ban-list.js";

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

export interface AdminUser {
  githubLogin: string;
  githubName: string | null;
  githubAvatarUrl: string | null;
  githubEmail: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  bannedAt: string | null;
  favoritesCount: number;
  likesCount: number;
  userPictogramsCount: number;
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

export function getBannedLogins(): string[] {
  return db
    .select({ githubLogin: users.githubLogin })
    .from(users)
    .where(sql`${users.bannedAt} IS NOT NULL`)
    .all()
    .map((r) => r.githubLogin);
}

export function listUsers(opts: {
  page: number;
  limit: number;
  search?: string;
}): { users: AdminUser[]; total: number } {
  const { page, limit, search } = opts;
  const offset = (page - 1) * limit;
  const searchPattern = search ? `%${search}%` : undefined;

  const whereClause = searchPattern
    ? or(
        like(users.githubLogin, searchPattern),
        like(users.githubName, searchPattern),
      )
    : undefined;

  const totalResult = db
    .select({ count: count() })
    .from(users)
    .where(whereClause)
    .get();

  const rows = db
    .select({
      githubLogin: users.githubLogin,
      githubName: users.githubName,
      githubAvatarUrl: users.githubAvatarUrl,
      githubEmail: users.githubEmail,
      firstSeenAt: users.firstSeenAt,
      lastSeenAt: users.lastSeenAt,
      bannedAt: users.bannedAt,
      favoritesCount: sql<number>`(SELECT COUNT(*) FROM favorites WHERE user_login = users.github_login)`,
      likesCount: sql<number>`(SELECT COUNT(*) FROM pictogram_likes WHERE user_login = users.github_login)`,
      userPictogramsCount: sql<number>`(SELECT COUNT(*) FROM user_pictograms WHERE owner_login = users.github_login)`,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.firstSeenAt))
    .limit(limit)
    .offset(offset)
    .all();

  return {
    users: rows.map((r) => ({
      githubLogin: r.githubLogin,
      githubName: r.githubName ?? null,
      githubAvatarUrl: r.githubAvatarUrl ?? null,
      githubEmail: r.githubEmail ?? null,
      firstSeenAt: r.firstSeenAt ?? null,
      lastSeenAt: r.lastSeenAt ?? null,
      bannedAt: r.bannedAt ?? null,
      favoritesCount: Number(r.favoritesCount),
      likesCount: Number(r.likesCount),
      userPictogramsCount: Number(r.userPictogramsCount),
    })),
    total: totalResult?.count ?? 0,
  };
}

export function banUser(login: string): boolean {
  const now = new Date().toISOString();
  const result = db
    .update(users)
    .set({ bannedAt: now })
    .where(eq(users.githubLogin, login))
    .run();
  if (result.changes > 0) {
    addBan(login);
    return true;
  }
  return false;
}

export function unbanUser(login: string): boolean {
  const result = db
    .update(users)
    .set({ bannedAt: null })
    .where(eq(users.githubLogin, login))
    .run();
  if (result.changes > 0) {
    removeBan(login);
    return true;
  }
  return false;
}

export function getUserMinioKeys(login: string): string[] {
  return db
    .select({ minioKey: userPictograms.minioKey })
    .from(userPictograms)
    .where(eq(userPictograms.ownerLogin, login))
    .all()
    .map((r) => r.minioKey);
}

export function deleteUser(login: string): boolean {
  const result = db.delete(users).where(eq(users.githubLogin, login)).run();
  return result.changes > 0;
}
