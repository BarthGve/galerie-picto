import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { feedbackSeen } from "../schema.js";

/** Retourne les issueIds vus par un utilisateur */
export function getSeenIssueIds(userLogin: string): Set<number> {
  const rows = db
    .select({ issueId: feedbackSeen.issueId })
    .from(feedbackSeen)
    .where(eq(feedbackSeen.userLogin, userLogin))
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
