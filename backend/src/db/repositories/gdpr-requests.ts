import { eq, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../index.js";
import { gdprRequests, users } from "../schema.js";
import { addGdprHistoryEntry } from "./gdpr-request-history.js";

export type GdprRightType =
  | "acces"
  | "rectification"
  | "effacement"
  | "portabilite"
  | "opposition";

export type GdprStatus = "nouveau" | "en_cours" | "traite";

const VALID_TRANSITIONS: Record<GdprStatus, GdprStatus[]> = {
  nouveau: ["en_cours", "traite"],
  en_cours: ["nouveau", "traite"],
  traite: [], // terminal state
};

export interface CreateGdprRequestInput {
  requesterLogin: string;
  rightType: GdprRightType;
  message: string;
  consentContact: boolean;
}

export function createGdprRequest(input: CreateGdprRequestInput): string {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.insert(gdprRequests)
    .values({
      id,
      requesterLogin: input.requesterLogin,
      rightType: input.rightType,
      message: input.message,
      status: "nouveau",
      consentContact: input.consentContact ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  addGdprHistoryEntry({
    requestId: id,
    actorLogin: input.requesterLogin,
    action: "created",
    toStatus: "nouveau",
  });

  return id;
}

export function getAllGdprRequests(opts: {
  page: number;
  limit: number;
  status?: GdprStatus;
}) {
  const offset = (opts.page - 1) * opts.limit;

  const baseCondition = opts.status
    ? eq(gdprRequests.status, opts.status)
    : undefined;

  const requests = db
    .select({
      id: gdprRequests.id,
      requesterLogin: gdprRequests.requesterLogin,
      requesterName: users.githubName,
      requesterEmail: users.githubEmail,
      requesterAvatar: users.githubAvatarUrl,
      rightType: gdprRequests.rightType,
      message: gdprRequests.message,
      status: gdprRequests.status,
      consentContact: gdprRequests.consentContact,
      createdAt: gdprRequests.createdAt,
      updatedAt: gdprRequests.updatedAt,
    })
    .from(gdprRequests)
    .leftJoin(users, eq(gdprRequests.requesterLogin, users.githubLogin))
    .where(baseCondition)
    .orderBy(desc(gdprRequests.createdAt))
    .limit(opts.limit)
    .offset(offset)
    .all();

  const countResult = db
    .select({ count: sql<number>`count(*)` })
    .from(gdprRequests)
    .where(baseCondition)
    .get();

  return { requests, total: countResult?.count ?? 0 };
}

export function updateGdprRequestStatus(
  id: string,
  newStatus: GdprStatus,
  actorLogin: string,
  responseMessage?: string,
): { success: boolean; error?: string } {
  return db.transaction((tx) => {
    const request = tx
      .select({ status: gdprRequests.status })
      .from(gdprRequests)
      .where(eq(gdprRequests.id, id))
      .get();

    if (!request) return { success: false, error: "Request not found" };

    const currentStatus = request.status as GdprStatus;
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from '${currentStatus}' to '${newStatus}'`,
      };
    }

    tx.update(gdprRequests)
      .set({ status: newStatus, updatedAt: new Date().toISOString() })
      .where(eq(gdprRequests.id, id))
      .run();

    addGdprHistoryEntry({
      requestId: id,
      actorLogin,
      action: "status_changed",
      fromStatus: currentStatus,
      toStatus: newStatus,
      detail:
        newStatus === "traite" && responseMessage ? responseMessage : undefined,
    });

    return { success: true };
  });
}

export function getGdprRequestCount(status?: GdprStatus): number {
  const condition = status ? eq(gdprRequests.status, status) : undefined;

  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(gdprRequests)
    .where(condition)
    .get();

  return result?.count ?? 0;
}
