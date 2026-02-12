import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import {
  getPresignedUploadUrl,
  readJsonFile,
  readFileAsText,
  writeSvgFile,
  writeJsonFile,
} from "../services/minio.js";
import { normalizeToDsfr, generateDarkVariant } from "../services/dsfr-dark.js";
import type { PictogramManifest, Pictogram, GalleriesFile } from "../types.js";

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
    const {
      id,
      name,
      filename,
      url,
      size,
      category,
      tags,
      galleryIds,
      contributor,
    } = req.body;

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
        contributor,
      };

      manifest.pictograms.push(newPictogram);

      // Auto-génération de la variante dark DSFR
      if (filename.endsWith(".svg") && !filename.endsWith("_dark.svg")) {
        try {
          const urlPath = new URL(url).pathname;
          const lightKey = urlPath.replace(`/${config.minio.bucket}/`, "");
          const svgText = await readFileAsText(lightKey);

          if (svgText) {
            const normalizedSvg = normalizeToDsfr(svgText);

            // Re-upload le SVG normalisé si des couleurs ont été corrigées
            if (normalizedSvg !== svgText) {
              await writeSvgFile(lightKey, normalizedSvg);
              newPictogram.size = Buffer.byteLength(normalizedSvg, "utf-8");
            }

            // Générer et uploader la variante dark
            const darkSvg = generateDarkVariant(svgText);
            const darkKey = lightKey.replace(/\.svg$/i, "_dark.svg");
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
          const galleriesFile = (await readJsonFile<GalleriesFile>(
            GALLERIES_KEY,
          )) || {
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
