import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
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

function buildUrl(key: string): string {
  return `${config.minio.endpoint}/${config.minio.bucket}/${key}`;
}

export async function readFileAsText(key: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(buildUrl(key), { signal: controller.signal });
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
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

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.minio.bucket,
    Key: key,
  });
  await s3Client.send(command);
}

export async function writePrivateSvgFile(
  key: string,
  svgContent: string,
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: config.minio.privateBucket,
    Key: key,
    Body: svgContent,
    ContentType: "image/svg+xml",
    CacheControl: "private",
  });
  await s3Client.send(command);
}

export async function deletePrivateFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.minio.privateBucket,
    Key: key,
  });
  await s3Client.send(command);
}

export async function writeImageFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: config.minio.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000",
  });
  await s3Client.send(command);
}

export async function readPrivateFileAsText(
  key: string,
): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.minio.privateBucket,
      Key: key,
    });
    const response = await s3Client.send(command);
    if (!response.Body) return null;
    return await response.Body.transformToString();
  } catch {
    return null;
  }
}
