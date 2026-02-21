import { eq, and, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../index.js";
import { notifications } from "../schema.js";

export type NotificationType =
  | "request_new"
  | "request_assigned"
  | "request_comment"
  | "request_precisions"
  | "request_delivered"
  | "request_refused";

export interface CreateNotificationInput {
  recipientLogin: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export function createNotification(input: CreateNotificationInput): string {
  const id = uuidv4();
  db.insert(notifications)
    .values({
      id,
      recipientLogin: input.recipientLogin,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link || null,
    })
    .run();
  return id;
}

export function createNotificationBatch(
  inputs: CreateNotificationInput[],
): void {
  for (const input of inputs) {
    createNotification(input);
  }
}

export function getNotifications(recipientLogin: string) {
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientLogin, recipientLogin),
        eq(notifications.dismissed, 0),
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(100)
    .all();
}

export function getUnreadCount(recipientLogin: string): number {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientLogin, recipientLogin),
        eq(notifications.isRead, 0),
        eq(notifications.dismissed, 0),
      ),
    )
    .get();
  return row?.count ?? 0;
}

export function markAsRead(id: string, recipientLogin: string): boolean {
  const result = db
    .update(notifications)
    .set({ isRead: 1 })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.recipientLogin, recipientLogin),
      ),
    )
    .run();
  return result.changes > 0;
}

export function markAllAsRead(recipientLogin: string): number {
  const result = db
    .update(notifications)
    .set({ isRead: 1 })
    .where(
      and(
        eq(notifications.recipientLogin, recipientLogin),
        eq(notifications.isRead, 0),
        eq(notifications.dismissed, 0),
      ),
    )
    .run();
  return result.changes;
}

export function dismissNotification(
  id: string,
  recipientLogin: string,
): boolean {
  const result = db
    .update(notifications)
    .set({ dismissed: 1 })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.recipientLogin, recipientLogin),
      ),
    )
    .run();
  return result.changes > 0;
}

export function dismissAllNotifications(recipientLogin: string): number {
  const result = db
    .update(notifications)
    .set({ dismissed: 1 })
    .where(
      and(
        eq(notifications.recipientLogin, recipientLogin),
        eq(notifications.dismissed, 0),
      ),
    )
    .run();
  return result.changes;
}
