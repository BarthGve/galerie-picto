import { eq, desc, sql, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";
import { db } from "../index.js";
import {
  pictoRequests,
  pictoRequestComments,
  pictograms,
  users,
} from "../schema.js";

const assigneeUsers = alias(users, "assignee_users");

export type RequestStatus =
  | "nouvelle"
  | "en_cours"
  | "precisions_requises"
  | "livree"
  | "refusee";

const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  nouvelle: ["en_cours", "refusee"],
  en_cours: ["precisions_requises", "livree", "refusee"],
  precisions_requises: ["en_cours"],
  livree: [],
  refusee: [],
};

export interface CreateRequestInput {
  requesterLogin: string;
  title: string;
  description: string;
  referenceImageKey?: string;
  urgency?: "normale" | "urgente";
}

export function createRequest(input: CreateRequestInput) {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.insert(pictoRequests)
    .values({
      id,
      requesterLogin: input.requesterLogin,
      title: input.title,
      description: input.description,
      referenceImageKey: input.referenceImageKey || null,
      urgency: input.urgency || "normale",
      status: "nouvelle",
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return id;
}

export function getRequestById(id: string) {
  const row = db
    .select({
      id: pictoRequests.id,
      requesterLogin: pictoRequests.requesterLogin,
      requesterName: users.githubName,
      requesterAvatar: users.githubAvatarUrl,
      title: pictoRequests.title,
      description: pictoRequests.description,
      referenceImageKey: pictoRequests.referenceImageKey,
      urgency: pictoRequests.urgency,
      status: pictoRequests.status,
      assignedTo: pictoRequests.assignedTo,
      assignedToName: assigneeUsers.githubName,
      assignedToAvatar: assigneeUsers.githubAvatarUrl,
      deliveredPictogramId: pictoRequests.deliveredPictogramId,
      rejectionReason: pictoRequests.rejectionReason,
      createdAt: pictoRequests.createdAt,
      updatedAt: pictoRequests.updatedAt,
    })
    .from(pictoRequests)
    .leftJoin(users, eq(pictoRequests.requesterLogin, users.githubLogin))
    .leftJoin(
      assigneeUsers,
      eq(pictoRequests.assignedTo, assigneeUsers.githubLogin),
    )
    .where(eq(pictoRequests.id, id))
    .get();
  if (!row) return null;

  const commentCount = db
    .select({ count: sql<number>`count(*)` })
    .from(pictoRequestComments)
    .where(eq(pictoRequestComments.requestId, id))
    .get();

  return { ...row, commentCount: commentCount?.count ?? 0 };
}

export function getRequestsByUser(userLogin: string) {
  return db
    .select({
      id: pictoRequests.id,
      title: pictoRequests.title,
      referenceImageKey: pictoRequests.referenceImageKey,
      urgency: pictoRequests.urgency,
      status: pictoRequests.status,
      assignedTo: pictoRequests.assignedTo,
      deliveredPictogramId: pictoRequests.deliveredPictogramId,
      deliveredPictogramUrl: pictograms.url,
      createdAt: pictoRequests.createdAt,
      updatedAt: pictoRequests.updatedAt,
    })
    .from(pictoRequests)
    .leftJoin(pictograms, eq(pictoRequests.deliveredPictogramId, pictograms.id))
    .where(eq(pictoRequests.requesterLogin, userLogin))
    .orderBy(desc(pictoRequests.createdAt))
    .all();
}

export function getAllRequests(statusFilter?: RequestStatus) {
  const baseQuery = db
    .select({
      id: pictoRequests.id,
      requesterLogin: pictoRequests.requesterLogin,
      requesterName: users.githubName,
      requesterAvatar: users.githubAvatarUrl,
      title: pictoRequests.title,
      referenceImageKey: pictoRequests.referenceImageKey,
      urgency: pictoRequests.urgency,
      status: pictoRequests.status,
      assignedTo: pictoRequests.assignedTo,
      assignedToName: assigneeUsers.githubName,
      assignedToAvatar: assigneeUsers.githubAvatarUrl,
      createdAt: pictoRequests.createdAt,
      updatedAt: pictoRequests.updatedAt,
    })
    .from(pictoRequests)
    .leftJoin(users, eq(pictoRequests.requesterLogin, users.githubLogin))
    .leftJoin(
      assigneeUsers,
      eq(pictoRequests.assignedTo, assigneeUsers.githubLogin),
    );

  if (statusFilter) {
    return baseQuery
      .where(eq(pictoRequests.status, statusFilter))
      .orderBy(desc(pictoRequests.createdAt))
      .all();
  }

  return baseQuery.orderBy(desc(pictoRequests.createdAt)).all();
}

export function updateRequestStatus(
  id: string,
  newStatus: RequestStatus,
  extra?: {
    assignedTo?: string;
    rejectionReason?: string;
    deliveredPictogramId?: string;
  },
): { success: boolean; error?: string } {
  return db.transaction((tx) => {
    const request = tx
      .select({ status: pictoRequests.status })
      .from(pictoRequests)
      .where(eq(pictoRequests.id, id))
      .get();

    if (!request) return { success: false, error: "Request not found" };

    const currentStatus = request.status as RequestStatus;
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from '${currentStatus}' to '${newStatus}'`,
      };
    }

    if (newStatus === "refusee" && !extra?.rejectionReason) {
      return { success: false, error: "Rejection reason is required" };
    }

    const updates: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    if (extra?.assignedTo !== undefined) updates.assignedTo = extra.assignedTo;
    if (extra?.rejectionReason) updates.rejectionReason = extra.rejectionReason;
    if (extra?.deliveredPictogramId)
      updates.deliveredPictogramId = extra.deliveredPictogramId;

    tx.update(pictoRequests).set(updates).where(eq(pictoRequests.id, id)).run();
    return { success: true };
  });
}

export function getActiveRequestCount(): number {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(pictoRequests)
    .where(
      inArray(pictoRequests.status, [
        "nouvelle",
        "en_cours",
        "precisions_requises",
      ]),
    )
    .get();
  return result?.count ?? 0;
}

export function assignRequest(
  requestId: string,
  contributorLogin: string,
): boolean {
  return db.transaction((tx) => {
    const request = tx
      .select({ status: pictoRequests.status })
      .from(pictoRequests)
      .where(eq(pictoRequests.id, requestId))
      .get();

    if (!request) return false;

    const status = request.status as RequestStatus;
    if (status !== "nouvelle" && status !== "en_cours") return false;

    tx.update(pictoRequests)
      .set({
        assignedTo: contributorLogin,
        status: "en_cours",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(pictoRequests.id, requestId))
      .run();

    return true;
  });
}
