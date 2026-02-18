import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { readFileAsText, writeSvgFile } from "../services/minio.js";
import {
  sanitizeSvg,
  isValidSvgFilename,
  isValidSvgContent,
} from "../services/svg-sanitizer.js";
import { normalizeToDsfr } from "../services/dsfr-dark.js";
import { insertPictogram } from "../db/repositories/pictograms.js";
import { addPictogramsToGallery } from "../db/repositories/galleries.js";

const router = Router();

// POST /api/upload/file - Upload SVG directly through backend
router.post(
  "/file",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { filename, content } = req.body;

    if (!filename || !content) {
      res.status(400).json({ error: "Missing filename or content" });
      return;
    }

    if (!isValidSvgFilename(filename)) {
      res.status(400).json({ error: "Invalid filename" });
      return;
    }

    if (!isValidSvgContent(content)) {
      res.status(400).json({ error: "Invalid or oversized SVG content" });
      return;
    }

    try {
      const sanitized = sanitizeSvg(content);
      const uniqueFilename = `${uuidv4()}-${filename}`;
      const key = `${config.minio.prefix}${uniqueFilename}`;
      await writeSvgFile(key, sanitized);
      const publicUrl = `${config.minio.endpoint}/${config.minio.bucket}/${key}`;

      res.json({ publicUrl });
    } catch {
      res.status(500).json({ error: "Failed to upload file" });
    }
  },
);

// POST /api/upload/complete - Register pictogram in DB after upload
router.post(
  "/complete",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id, name, filename, url, tags, galleryIds, contributor } = req.body;

    if (!id || !name || !filename || !url) {
      res
        .status(400)
        .json({ error: "Missing required fields: id, name, filename, url" });
      return;
    }

    try {
      // Calculate real size from stored file
      const urlPath = new URL(url).pathname;
      const fileKey = urlPath.replace(`/${config.minio.bucket}/`, "");
      const storedContent = await readFileAsText(fileKey);
      const realSize = storedContent
        ? Buffer.byteLength(storedContent, "utf-8")
        : 0;

      const now = new Date().toISOString();

      // Insert main pictogram
      insertPictogram({
        id,
        name,
        filename,
        url,
        size: realSize,
        lastModified: now,
        tags,
        contributor,
      });

      // Normalize DSFR colors in the uploaded SVG
      if (filename.endsWith(".svg") && storedContent) {
        try {
          const normalizedSvg = normalizeToDsfr(storedContent);
          if (normalizedSvg !== storedContent) {
            await writeSvgFile(fileKey, normalizedSvg);
          }
        } catch (err) {
          console.error("Failed to normalize DSFR colors:", err);
        }
      }

      // Sync gallery associations
      if (galleryIds && Array.isArray(galleryIds) && galleryIds.length > 0) {
        try {
          for (const gid of galleryIds) {
            addPictogramsToGallery(gid, [id]);
          }
        } catch (err) {
          console.error("Failed to sync galleries after upload:", err);
        }
      }

      const picto = {
        id,
        name,
        filename,
        url,
        size: realSize,
        lastModified: now,
        tags,
        galleryIds,
        contributor,
      };
      res.json({ success: true, pictogram: picto });
    } catch {
      res.status(500).json({ error: "Failed to update manifest" });
    }
  },
);

export default router;
