import { eq, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";
import { db } from "../index.js";
import { gdprRequestHistory, users } from "../schema.js";

const detailUsers = alias(users, "detail_users");

export interface AddGdprHistoryInput {
  requestId: string;
  actorLogin: string;
  action: "created" | "status_changed";
  fromStatus?: string;
  toStatus?: string;
  detail?: string;
}

export function addGdprHistoryEntry(input: AddGdprHistoryInput) {
  db.insert(gdprRequestHistory)
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

export function getGdprHistory(requestId: string) {
  return db
    .select({
      id: gdprRequestHistory.id,
      requestId: gdprRequestHistory.requestId,
      actorLogin: gdprRequestHistory.actorLogin,
      action: gdprRequestHistory.action,
      fromStatus: gdprRequestHistory.fromStatus,
      toStatus: gdprRequestHistory.toStatus,
      detail: gdprRequestHistory.detail,
      detailAvatar: detailUsers.githubAvatarUrl,
      detailName: detailUsers.githubName,
      createdAt: gdprRequestHistory.createdAt,
      actorAvatar: users.githubAvatarUrl,
      actorName: users.githubName,
    })
    .from(gdprRequestHistory)
    .leftJoin(users, eq(gdprRequestHistory.actorLogin, users.githubLogin))
    .leftJoin(
      detailUsers,
      eq(gdprRequestHistory.detail, detailUsers.githubLogin),
    )
    .where(eq(gdprRequestHistory.requestId, requestId))
    .orderBy(asc(gdprRequestHistory.createdAt))
    .all();
}
