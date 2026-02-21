import { eq, and, sql, lt } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "../index.js";
import { anonymousDownloads } from "../schema.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Hash l'adresse IP avec un sel journalier (RGPD — pas de stockage d'IP en clair).
 * SHA-256(ip + YYYY-MM-DD) — irréversible tout en permettant le rate limiting journalier.
 */
function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + today())
    .digest("hex");
}

export function getAnonymousDownloadCount(ip: string): number {
  const hashedIp = hashIp(ip);
  const row = db
    .select()
    .from(anonymousDownloads)
    .where(
      and(
        eq(anonymousDownloads.ip, hashedIp),
        eq(anonymousDownloads.downloadDate, today()),
      ),
    )
    .get();
  return row?.count || 0;
}

export function incrementAnonymousDownload(ip: string): number {
  const hashedIp = hashIp(ip);
  const date = today();
  db.insert(anonymousDownloads)
    .values({ ip: hashedIp, downloadDate: date, count: 1 })
    .onConflictDoUpdate({
      target: [anonymousDownloads.ip, anonymousDownloads.downloadDate],
      set: { count: sql`${anonymousDownloads.count} + 1` },
    })
    .run();

  return getAnonymousDownloadCount(ip);
}

export function cleanupOldEntries(daysToKeep: number = 7): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const result = db
    .delete(anonymousDownloads)
    .where(lt(anonymousDownloads.downloadDate, cutoffStr))
    .run();
  return result.changes;
}
