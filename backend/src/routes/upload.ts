import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import {
  readJsonFile,
  readFileAsText,
  writeSvgFile,
  writeJsonFile,
} from "../services/minio.js";
import {
  sanitizeSvg,
  isValidSvgFilename,
  isValidSvgContent,
} from "../services/svg-sanitizer.js";
import { normalizeToDsfr, generateDarkVariant } from "../services/dsfr-dark.js";
import type { PictogramManifest, Pictogram, GalleriesFile } from "../types.js";

const router = Router();

const MANIFEST_KEY = `${config.minio.prefix}pictograms-manifest.json`;

// POST /api/upload/file - Upload SVG directly through backend (avoids CDN CORS issues)
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

// POST /api/upload/complete - Update manifest after upload
router.post(
  "/complete",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id, name, filename, url, category, tags, galleryIds, contributor } =
      req.body;

    if (!id || !name || !filename || !url) {
      res
        .status(400)
        .json({ error: "Missing required fields: id, name, filename, url" });
      return;
    }

    try {
      const manifestResult =
        await readJsonFile<PictogramManifest>(MANIFEST_KEY);
      const manifest: PictogramManifest = manifestResult?.data || {
        pictograms: [],
        lastUpdated: new Date().toISOString(),
        totalCount: 0,
      };

      // Calculate real size from stored file
      const urlPath = new URL(url).pathname;
      const fileKey = urlPath.replace(`/${config.minio.bucket}/`, "");
      const storedContent = await readFileAsText(fileKey);
      const realSize = storedContent
        ? Buffer.byteLength(storedContent, "utf-8")
        : 0;

      const newPictogram: Pictogram = {
        id,
        name,
        filename,
        url,
        size: realSize,
        lastModified: new Date().toISOString(),
        category,
        tags,
        galleryIds,
        contributor,
      };

      manifest.pictograms.push(newPictogram);

      // Auto-génération de la variante dark DSFR
      if (filename.endsWith(".svg") && !filename.endsWith("_dark.svg")) {
        try {
          const svgText = storedContent || (await readFileAsText(fileKey));

          if (svgText) {
            const normalizedSvg = normalizeToDsfr(svgText);

            // Re-upload le SVG normalisé si des couleurs ont été corrigées
            if (normalizedSvg !== svgText) {
              await writeSvgFile(fileKey, normalizedSvg);
              newPictogram.size = Buffer.byteLength(normalizedSvg, "utf-8");
            }

            // Générer et uploader la variante dark
            const darkSvg = generateDarkVariant(svgText);
            const darkKey = fileKey.replace(/\.svg$/i, "_dark.svg");
            await writeSvgFile(darkKey, darkSvg);

            const darkFilename = filename.replace(/\.svg$/i, "_dark.svg");
            manifest.pictograms.push({
              id: crypto.randomUUID(),
              name: `${name} (dark)`,
              filename: darkFilename,
              url: `${config.minio.endpoint}/${config.minio.bucket}/${darkKey}`,
              size: Buffer.byteLength(darkSvg, "utf-8"),
              lastModified: new Date().toISOString(),
              category,
              tags,
            });
          }
        } catch (err) {
          console.error("Failed to generate dark variant:", err);
          // Non-bloquant : le picto light est quand même ajouté
        }
      }

      manifest.totalCount = manifest.pictograms.length;
      manifest.lastUpdated = new Date().toISOString();

      await writeJsonFile(MANIFEST_KEY, manifest);

      // Sync galleries.json with selected galleryIds
      if (galleryIds && Array.isArray(galleryIds) && galleryIds.length > 0) {
        try {
          const GALLERIES_KEY = `${config.minio.prefix}galleries.json`;
          const galleriesResult =
            await readJsonFile<GalleriesFile>(GALLERIES_KEY);
          const galleriesFile: GalleriesFile = galleriesResult?.data || {
            galleries: [],
            lastUpdated: new Date().toISOString(),
          };
          let changed = false;
          for (const gid of galleryIds) {
            const gallery = galleriesFile.galleries.find((g) => g.id === gid);
            if (gallery && !gallery.pictogramIds.includes(id)) {
              gallery.pictogramIds.push(id);
              gallery.updatedAt = new Date().toISOString();
              changed = true;
            }
          }
          if (changed) {
            galleriesFile.lastUpdated = new Date().toISOString();
            await writeJsonFile(GALLERIES_KEY, galleriesFile);
          }
        } catch (err) {
          console.error("Failed to sync galleries.json after upload:", err);
          // Non-bloquant : le picto est quand même créé
        }
      }

      res.json({ success: true, pictogram: newPictogram });
    } catch {
      res.status(500).json({ error: "Failed to update manifest" });
    }
  },
);

export default router;
