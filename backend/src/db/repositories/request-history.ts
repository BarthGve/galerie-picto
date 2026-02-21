import { eq, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../index.js";
import { pictoRequestHistory, users } from "../schema.js";

export interface AddHistoryInput {
  requestId: string;
  actorLogin: string;
  action: "created" | "assigned" | "status_changed";
  fromStatus?: string;
  toStatus?: string;
  detail?: string;
}

export function addHistoryEntry(input: AddHistoryInput) {
  db.insert(pictoRequestHistory)
    .values({
      id: uuidv4(),
      requestId: input.requestId,
      actorLogin: input.actorLogin,
      action: input.action,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      detail: input.detail ?? null,
      createdAt: new Date().toISOString(),
    })
    .run();
}

export function getHistory(requestId: string) {
  return db
    .select({
      id: pictoRequestHistory.id,
      requestId: pictoRequestHistory.requestId,
      actorLogin: pictoRequestHistory.actorLogin,
      action: pictoRequestHistory.action,
      fromStatus: pictoRequestHistory.fromStatus,
      toStatus: pictoRequestHistory.toStatus,
      detail: pictoRequestHistory.detail,
      createdAt: pictoRequestHistory.createdAt,
      actorAvatar: users.githubAvatarUrl,
    })
    .from(pictoRequestHistory)
    .leftJoin(users, eq(pictoRequestHistory.actorLogin, users.githubLogin))
    .where(eq(pictoRequestHistory.requestId, requestId))
    .orderBy(asc(pictoRequestHistory.createdAt))
    .all();
}
