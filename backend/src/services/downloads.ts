import { readJsonFile, writeJsonFile } from "./minio.js";
import { config } from "../config.js";

const DOWNLOADS_KEY = `${config.minio.prefix}downloads.json`;
const FLUSH_INTERVAL = 60_000; // 60 seconds

// In-memory counters: pictogramId -> download count
let counters = new Map<string, number>();
let dirty = false;

// Load counters from Minio on startup
export async function initDownloads(): Promise<void> {
  try {
    const result = await readJsonFile<Record<string, number>>(DOWNLOADS_KEY);
    if (result) {
      counters = new Map(Object.entries(result.data));
    }
  } catch {
    // First run or missing file — start fresh
    counters = new Map();
  }
}

// Increment counter for a pictogram
export function incrementDownload(pictogramId: string): number {
  const current = counters.get(pictogramId) || 0;
  const next = current + 1;
  counters.set(pictogramId, next);
  dirty = true;
  return next;
}

// Get all download counts
export function getDownloads(): Record<string, number> {
  return Object.fromEntries(counters);
}

// Get download count for a single pictogram
export function getDownloadCount(pictogramId: string): number {
  return counters.get(pictogramId) || 0;
}

// Flush dirty counters to Minio
async function flush(): Promise<void> {
  if (!dirty) return;
  try {
    await writeJsonFile(DOWNLOADS_KEY, Object.fromEntries(counters));
    dirty = false;
  } catch (err) {
    console.error("Failed to flush download counters:", err);
  }
}

// Start periodic flush
let flushTimer: ReturnType<typeof setInterval> | null = null;

export function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(flush, FLUSH_INTERVAL);
}

// Graceful shutdown: flush before exit
export async function shutdownDownloads(): Promise<void> {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  await flush();
}
