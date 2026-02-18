import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { users } from "../schema.js";

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
