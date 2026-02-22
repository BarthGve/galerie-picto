import { eq, sql, like, or, desc, count } from "drizzle-orm";
import { db } from "../index.js";
import { users, userPictograms } from "../schema.js";
import { addBan, removeBan } from "../../middleware/ban-list.js";

export type EmailNotifKey =
  | "notifyEmailGdpr"
  | "notifyEmailPictoNew"
  | "notifyEmailPictoEnCours"
  | "notifyEmailPictoPrecision"
  | "notifyEmailPictoLivre"
  | "notifyEmailPictoRefuse"
  | "notifyEmailNewsletter"
  | "notifyEmailNewUser";

export interface EmailNotifPreferences {
  notifyEmailGdpr: boolean;
  notifyEmailPictoNew: boolean;
  notifyEmailPictoEnCours: boolean;
  notifyEmailPictoPrecision: boolean;
  notifyEmailPictoLivre: boolean;
  notifyEmailPictoRefuse: boolean;
  notifyEmailNewsletter: boolean;
  notifyEmailNewUser: boolean;
}

export const VALID_NOTIF_KEYS: EmailNotifKey[] = [
  "notifyEmailGdpr",
  "notifyEmailPictoNew",
  "notifyEmailPictoEnCours",
  "notifyEmailPictoPrecision",
  "notifyEmailPictoLivre",
  "notifyEmailPictoRefuse",
  "notifyEmailNewsletter",
  "notifyEmailNewUser",
];

export interface UserProfile {
  githubLogin: string;
  githubName: string | null;
  githubAvatarUrl: string | null;
  githubEmail: string | null;
  emailNotifications: EmailNotifPreferences;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  stats: {
    favoritesCount: number;
    collectionsCount: number;
    likesCount: number;
    requestsCount: number;
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
}): { isNew: boolean } {
  const now = new Date().toISOString();

  const existing = db
    .select({ emailOptOut: users.emailOptOut })
    .from(users)
    .where(eq(users.githubLogin, data.githubLogin))
    .get();

  const isNew = !existing;

  const emailUpdate = existing?.emailOptOut
    ? undefined
    : data.githubEmail || null;

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
        ...(emailUpdate !== undefined ? { githubEmail: emailUpdate } : {}),
        lastSeenAt: now,
      },
    })
    .run();

  return { isNew };
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
      notifyEmailGdpr: users.notifyEmailGdpr,
      notifyEmailPictoNew: users.notifyEmailPictoNew,
      notifyEmailPictoEnCours: users.notifyEmailPictoEnCours,
      notifyEmailPictoPrecision: users.notifyEmailPictoPrecision,
      notifyEmailPictoLivre: users.notifyEmailPictoLivre,
      notifyEmailPictoRefuse: users.notifyEmailPictoRefuse,
      notifyEmailNewsletter: users.notifyEmailNewsletter,
      notifyEmailNewUser: users.notifyEmailNewUser,
      firstSeenAt: users.firstSeenAt,
      lastSeenAt: users.lastSeenAt,
      favoritesCount: sql<number>`(SELECT COUNT(*) FROM favorites WHERE user_login = ${login})`,
      collectionsCount: sql<number>`(SELECT COUNT(*) FROM user_collections WHERE user_login = ${login})`,
      likesCount: sql<number>`(SELECT COUNT(*) FROM pictogram_likes WHERE user_login = ${login})`,
      requestsCount: sql<number>`(SELECT COUNT(*) FROM picto_requests WHERE requester_login = ${login})`,
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
    emailNotifications: {
      notifyEmailGdpr: row.notifyEmailGdpr !== 0,
      notifyEmailPictoNew: row.notifyEmailPictoNew !== 0,
      notifyEmailPictoEnCours: row.notifyEmailPictoEnCours !== 0,
      notifyEmailPictoPrecision: row.notifyEmailPictoPrecision !== 0,
      notifyEmailPictoLivre: row.notifyEmailPictoLivre !== 0,
      notifyEmailPictoRefuse: row.notifyEmailPictoRefuse !== 0,
      notifyEmailNewsletter: row.notifyEmailNewsletter !== 0,
      notifyEmailNewUser: row.notifyEmailNewUser !== 0,
    },
    firstSeenAt: row.firstSeenAt ?? null,
    lastSeenAt: row.lastSeenAt ?? null,
    stats: {
      favoritesCount: Number(row.favoritesCount),
      collectionsCount: Number(row.collectionsCount),
      likesCount: Number(row.likesCount),
      requestsCount: Number(row.requestsCount),
    },
  };
}

export function clearUserEmail(login: string): void {
  db.update(users)
    .set({ githubEmail: null, emailOptOut: 1 })
    .where(eq(users.githubLogin, login))
    .run();
}

export function updateUserEmail(login: string, email: string): void {
  db.update(users)
    .set({ githubEmail: email, emailOptOut: 1 })
    .where(eq(users.githubLogin, login))
    .run();
}

const NOTIF_KEY_TO_COLUMN = {
  notifyEmailGdpr: users.notifyEmailGdpr,
  notifyEmailPictoNew: users.notifyEmailPictoNew,
  notifyEmailPictoEnCours: users.notifyEmailPictoEnCours,
  notifyEmailPictoPrecision: users.notifyEmailPictoPrecision,
  notifyEmailPictoLivre: users.notifyEmailPictoLivre,
  notifyEmailPictoRefuse: users.notifyEmailPictoRefuse,
  notifyEmailNewsletter: users.notifyEmailNewsletter,
  notifyEmailNewUser: users.notifyEmailNewUser,
} as const;

export function isEmailNotifEnabled(
  login: string,
  key: EmailNotifKey,
): boolean {
  const col = NOTIF_KEY_TO_COLUMN[key];
  const row = db
    .select({ val: col })
    .from(users)
    .where(eq(users.githubLogin, login))
    .get();
  return row?.val !== 0;
}

export function setEmailNotifPreferences(
  login: string,
  prefs: Partial<Record<EmailNotifKey, boolean>>,
): void {
  const set: Record<string, number> = {};
  for (const [key, val] of Object.entries(prefs)) {
    if (
      VALID_NOTIF_KEYS.includes(key as EmailNotifKey) &&
      typeof val === "boolean" &&
      key in NOTIF_KEY_TO_COLUMN
    ) {
      set[key] = val ? 1 : 0;
    }
  }
  if (Object.keys(set).length === 0) return;
  db.update(users).set(set).where(eq(users.githubLogin, login)).run();
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

export function getNewsletterSubscribers(): {
  email: string;
  name: string;
  login: string;
}[] {
  return db
    .select({
      email: users.githubEmail,
      name: users.githubName,
      login: users.githubLogin,
    })
    .from(users)
    .where(
      sql`${users.githubEmail} IS NOT NULL AND ${users.notifyEmailNewsletter} = 1 AND ${users.bannedAt} IS NULL`,
    )
    .all()
    .map((r) => ({
      email: r.email!,
      name: r.name || r.login,
      login: r.login,
    }));
}

export function deleteUser(login: string): boolean {
  const result = db.delete(users).where(eq(users.githubLogin, login)).run();
  return result.changes > 0;
}
