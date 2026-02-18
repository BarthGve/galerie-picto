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
import { normalizeToDsfr, generateDarkVariant } from "../services/dsfr-dark.js";
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

      // Auto-generate dark DSFR variant
      if (filename.endsWith(".svg") && !filename.endsWith("_dark.svg")) {
        try {
          const svgText = storedContent || (await readFileAsText(fileKey));

          if (svgText) {
            const normalizedSvg = normalizeToDsfr(svgText);

            // Re-upload normalized SVG if colors were corrected
            if (normalizedSvg !== svgText) {
              await writeSvgFile(fileKey, normalizedSvg);
            }

            // Generate and upload dark variant
            const darkSvg = generateDarkVariant(svgText);
            const darkKey = fileKey.replace(/\.svg$/i, "_dark.svg");
            await writeSvgFile(darkKey, darkSvg);

            const darkFilename = filename.replace(/\.svg$/i, "_dark.svg");
            insertPictogram({
              id: crypto.randomUUID(),
              name: `${name} (dark)`,
              filename: darkFilename,
              url: `${config.minio.endpoint}/${config.minio.bucket}/${darkKey}`,
              size: Buffer.byteLength(darkSvg, "utf-8"),
              lastModified: now,
              tags,
            });
          }
        } catch (err) {
          console.error("Failed to generate dark variant:", err);
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
