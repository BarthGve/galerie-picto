import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config.js";

const endpoint = config.minio.endpoint;

const s3Client = new S3Client({
  endpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: config.minio.accessKey,
    secretAccessKey: config.minio.secretKey,
  },
  forcePathStyle: true,
});

// In-memory cache for JSON files (manifest, galleries)
const jsonCache = new Map<string, { data: unknown; expiresAt: number }>();
const JSON_CACHE_TTL = 30_000; // 30 seconds

export async function configureBucketCors(
  allowedOrigins: string[],
): Promise<void> {
  const command = new PutBucketCorsCommand({
    Bucket: config.minio.bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: allowedOrigins,
          AllowedMethods: ["GET", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  });
  await s3Client.send(command);
}

export async function readJsonFile<T>(key: string): Promise<T | null> {
  // Check cache first
  const cached = jsonCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: config.minio.bucket,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to read ${key}: ${response.status}`);
    }
    const data = (await response.json()) as T;

    // Store in cache
    jsonCache.set(key, { data, expiresAt: Date.now() + JSON_CACHE_TTL });

    return data;
  } catch (err: unknown) {
    const s3Err = err as { name?: string; code?: string };
    if (s3Err.name === "NoSuchKey" || s3Err.code === "NoSuchKey") {
      return null;
    }
    throw err;
  }
}

export async function readFileAsText(key: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.minio.bucket,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to read ${key}: ${response.status}`);
    }
    return response.text();
  } catch (err: unknown) {
    const s3Err = err as { name?: string; code?: string };
    if (s3Err.name === "NoSuchKey" || s3Err.code === "NoSuchKey") {
      return null;
    }
    throw err;
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
    Body: JSON.stringify(data, null, 2),
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
