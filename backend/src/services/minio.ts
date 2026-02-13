import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "../config.js";

const s3Client = new S3Client({
  endpoint: config.minio.endpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: config.minio.accessKey,
    secretAccessKey: config.minio.secretKey,
  },
  forcePathStyle: true,
});

// In-memory cache for JSON files (manifest, galleries)
interface CacheEntry {
  data: unknown;
  json: string; // pre-serialized JSON to avoid re-stringify on each request
  etag: string;
  expiresAt: number;
}
const jsonCache = new Map<string, CacheEntry>();
const JSON_CACHE_TTL = 30_000; // 30 seconds

export interface JsonReadResult<T> {
  data: T;
  json: string;
  etag: string;
}

// Build public URL for a given S3 key
function buildUrl(key: string): string {
  return `${config.minio.endpoint}/${config.minio.bucket}/${key}`;
}

export async function readJsonFile<T>(
  key: string,
): Promise<JsonReadResult<T> | null> {
  // Check cache first
  const cached = jsonCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { data: cached.data as T, json: cached.json, etag: cached.etag };
  }

  try {
    const response = await fetch(buildUrl(key));
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`S3 read failed: ${response.status}`);

    const body = await response.text();
    if (!body) return null;

    const data = JSON.parse(body) as T;
    const etag = response.headers.get("etag") || `"${Date.now()}"`;

    // Store in cache with pre-serialized JSON (compact, no pretty-print)
    const json = JSON.stringify(data);
    jsonCache.set(key, {
      data,
      json,
      etag,
      expiresAt: Date.now() + JSON_CACHE_TTL,
    });

    return { data, json, etag };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("404")) return null;
    throw err;
  }
}

export async function readFileAsText(key: string): Promise<string | null> {
  try {
    const response = await fetch(buildUrl(key));
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export async function writeSvgFile(
  key: string,
  svgContent: string,
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: config.minio.bucket,
    Key: key,
    Body: svgContent,
    ContentType: "image/svg+xml",
    CacheControl: "public, max-age=31536000",
  });
  await s3Client.send(command);
}

export async function writeJsonFile(key: string, data: unknown): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: config.minio.bucket,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
    CacheControl: "no-cache, no-store, must-revalidate",
  });
  await s3Client.send(command);

  // Invalidate cache on write
  jsonCache.delete(key);
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.minio.bucket,
    Key: key,
  });
  await s3Client.send(command);
}
