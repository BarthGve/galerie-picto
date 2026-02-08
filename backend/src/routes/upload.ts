import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import {
  getPresignedUploadUrl,
  readJsonFile,
  writeJsonFile,
} from "../services/minio.js";
import type { PictogramManifest, Pictogram } from "../types.js";

const router = Router();

const MANIFEST_KEY = `${config.minio.prefix}pictograms-manifest.json`;

// POST /api/upload/presigned-url - Generate presigned upload URL
router.post(
  "/presigned-url",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      res.status(400).json({ error: "Missing filename or contentType" });
      return;
    }

    try {
      const uniqueFilename = `${uuidv4()}-${filename}`;
      const uploadUrl = await getPresignedUploadUrl(
        uniqueFilename,
        contentType,
      );
      const publicUrl = `${config.minio.endpoint}/${config.minio.bucket}/${config.minio.prefix}${uniqueFilename}`;

      res.json({ uploadUrl, publicUrl });
    } catch {
      res.status(500).json({ error: "Failed to generate presigned URL" });
    }
  },
);

// POST /api/upload/complete - Update manifest after upload
router.post(
  "/complete",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id, name, filename, url, size, category, tags, galleryIds } =
      req.body;

    if (!id || !name || !filename || !url) {
      res
        .status(400)
        .json({ error: "Missing required fields: id, name, filename, url" });
      return;
    }

    try {
      const manifest = (await readJsonFile<PictogramManifest>(
        MANIFEST_KEY,
      )) || {
        pictograms: [],
        lastUpdated: new Date().toISOString(),
        totalCount: 0,
      };

      const newPictogram: Pictogram = {
        id,
        name,
        filename,
        url,
        size: size || 0,
        lastModified: new Date().toISOString(),
        category,
        tags,
        galleryIds,
      };

      manifest.pictograms.push(newPictogram);
      manifest.totalCount = manifest.pictograms.length;
      manifest.lastUpdated = new Date().toISOString();

      await writeJsonFile(MANIFEST_KEY, manifest);

      res.json({ success: true, pictogram: newPictogram });
    } catch {
      res.status(500).json({ error: "Failed to update manifest" });
    }
  },
);

export default router;
