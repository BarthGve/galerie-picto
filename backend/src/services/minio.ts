import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
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

export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
): Promise<string> {
  const key = `${config.minio.prefix}${filename}`;
  const command = new PutObjectCommand({
    Bucket: config.minio.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}

export async function readJsonFile<T>(key: string): Promise<T | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.minio.bucket,
      Key: key,
    });
    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as T;
  } catch (err: unknown) {
    const s3Err = err as { name?: string };
    if (s3Err.name === "NoSuchKey") {
      return null;
    }
    throw err;
  }
}

export async function writeJsonFile(key: string, data: unknown): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: config.minio.bucket,
    Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: "application/json",
  });
  await s3Client.send(command);
}
