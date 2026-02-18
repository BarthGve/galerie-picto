import { eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { downloads } from "../schema.js";

export function incrementDownload(pictogramId: string): number {
  db.insert(downloads)
    .values({ pictogramId, count: 1 })
    .onConflictDoUpdate({
      target: downloads.pictogramId,
      set: { count: sql`${downloads.count} + 1` },
    })
    .run();

  const row = db
    .select()
    .from(downloads)
    .where(eq(downloads.pictogramId, pictogramId))
    .get();
  return row?.count || 1;
}

export function getDownloads(): Record<string, number> {
  const rows = db.select().from(downloads).all();
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.pictogramId] = row.count;
  }
  return result;
}

export function getDownloadCount(pictogramId: string): number {
  const row = db
    .select()
    .from(downloads)
    .where(eq(downloads.pictogramId, pictogramId))
    .get();
  return row?.count || 0;
}
