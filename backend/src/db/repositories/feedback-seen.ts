import { eq, and } from "drizzle-orm";
import { db } from "../index.js";
import { feedbackSeen } from "../schema.js";

/** Retourne les issueIds vus (et non supprimés) par un utilisateur */
export function getSeenIssueIds(userLogin: string): Set<number> {
  const rows = db
    .select({ issueId: feedbackSeen.issueId })
    .from(feedbackSeen)
    .where(
      and(eq(feedbackSeen.userLogin, userLogin), eq(feedbackSeen.dismissed, 0)),
    )
    .all();
  return new Set(rows.map((r) => r.issueId));
}

/** Retourne les issueIds supprimés par un utilisateur */
export function getDismissedIssueIds(userLogin: string): Set<number> {
  const rows = db
    .select({ issueId: feedbackSeen.issueId })
    .from(feedbackSeen)
    .where(
      and(eq(feedbackSeen.userLogin, userLogin), eq(feedbackSeen.dismissed, 1)),
    )
    .all();
  return new Set(rows.map((r) => r.issueId));
}

/** Marque une notification comme vue (idempotent) */
export function markIssueSeen(userLogin: string, issueId: number): void {
  db.insert(feedbackSeen)
    .values({ userLogin, issueId })
    .onConflictDoNothing()
    .run();
}

/** Marque plusieurs notifications comme vues en une seule opération */
export function markIssuesSeen(userLogin: string, issueIds: number[]): void {
  if (issueIds.length === 0) return;
  db.insert(feedbackSeen)
    .values(issueIds.map((issueId) => ({ userLogin, issueId })))
    .onConflictDoNothing()
    .run();
}

/** Supprime définitivement une notification feedback (upsert dismissed=1) */
export function dismissIssueSeen(userLogin: string, issueId: number): void {
  db.insert(feedbackSeen)
    .values({ userLogin, issueId, dismissed: 1 })
    .onConflictDoUpdate({
      target: [feedbackSeen.userLogin, feedbackSeen.issueId],
      set: { dismissed: 1 },
    })
    .run();
}

/** Supprime toutes les notifications feedback de l'utilisateur */
export function dismissAllIssuesSeen(userLogin: string): void {
  db.update(feedbackSeen)
    .set({ dismissed: 1 })
    .where(eq(feedbackSeen.userLogin, userLogin))
    .run();
}
