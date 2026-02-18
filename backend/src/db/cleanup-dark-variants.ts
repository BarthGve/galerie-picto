/**
 * Script one-shot : supprime toutes les variantes _dark.svg de la DB et de Minio S3.
 *
 * Usage : cd backend && npx tsx src/db/cleanup-dark-variants.ts
 */
import "dotenv/config";
import { db, runMigrations } from "./index.js";
import { pictograms } from "./schema.js";
import { like } from "drizzle-orm";
import { deleteFile } from "../services/minio.js";
import { config } from "../config.js";

async function cleanup() {
  runMigrations();

  // Find all _dark.svg entries in DB
  const darkEntries = db
    .select({
      id: pictograms.id,
      filename: pictograms.filename,
      url: pictograms.url,
    })
    .from(pictograms)
    .where(like(pictograms.filename, "%_dark.svg"))
    .all();

  console.log(`[cleanup] Found ${darkEntries.length} dark variant(s) in DB.`);

  for (const entry of darkEntries) {
    // Delete from Minio
    try {
      const url = new URL(entry.url);
      const key = url.pathname.replace(`/${config.minio.bucket}/`, "");
      await deleteFile(key);
      console.log(`[cleanup] Deleted S3: ${key}`);
    } catch (err) {
      console.warn(`[cleanup] Failed to delete S3 for ${entry.filename}:`, err);
    }

    // Delete from DB
    const { eq } = await import("drizzle-orm");
    db.delete(pictograms).where(eq(pictograms.id, entry.id)).run();
    console.log(`[cleanup] Deleted DB: ${entry.filename} (${entry.id})`);
  }

  console.log(`[cleanup] Done. Removed ${darkEntries.length} dark variant(s).`);
}

cleanup().catch((err) => {
  console.error("[cleanup] Failed:", err);
  process.exit(1);
});
