import type { VercelRequest, VercelResponse } from "@vercel/node";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * API Route: Génère une presigned URL pour uploader vers Minio
 * POST /api/upload/presigned-url
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  const allowedUsername = process.env.GITHUB_ALLOWED_USERNAME || "BarthGve";

  // Vérifier que l'utilisateur est autorisé
  try {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await userResponse.json();

    if (user.login !== allowedUsername) {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch (error) {
    console.error("Auth verification error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }

  // Récupérer les paramètres de la requête
  const { filename, contentType } = req.body;

  if (!filename || !contentType) {
    return res.status(400).json({ error: "Missing filename or contentType" });
  }

  // Configuration Minio
  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  const bucket = process.env.MINIO_BUCKET || "media";
  const prefix = process.env.MINIO_PREFIX || "artwork/pictograms";

  if (!endpoint || !accessKey || !secretKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // Créer le client S3 pour Minio
    const s3Client = new S3Client({
      endpoint: `https://${endpoint}`,
      region: "us-east-1", // Région par défaut pour Minio
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Important pour Minio
    });

    // Générer le chemin du fichier
    const key = `${prefix}/${filename}`;

    // Créer la commande PutObject
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    // Générer la presigned URL (valide 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    // Construire l'URL publique
    const publicUrl = `https://${endpoint}/${bucket}/${key}`;

    return res.status(200).json({
      uploadUrl,
      publicUrl,
    });
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate URL",
    });
  }
}
