import { Router, Request, Response } from "express";
import { config } from "../config.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { readJsonFile, writeJsonFile, deleteFile } from "../services/minio.js";
import type { PictogramManifest, GalleriesFile } from "../types.js";

const router = Router();

const MANIFEST_KEY = `${config.minio.prefix}pictograms-manifest.json`;
const GALLERIES_KEY = `${config.minio.prefix}galleries.json`;

// GET /api/pictograms/manifest - Get the pictograms manifest (with ETag/304)
router.get("/manifest", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await readJsonFile<PictogramManifest>(MANIFEST_KEY);
    if (!result) {
      res.json({
        pictograms: [],
        lastUpdated: new Date().toISOString(),
        totalCount: 0,
      });
      return;
    }

    // ETag/304 support
    if (req.headers["if-none-match"] === result.etag) {
      res.status(304).end();
      return;
    }

    res.set("ETag", result.etag);
    res.set("Content-Type", "application/json");
    res.send(result.json);
  } catch {
    res.status(500).json({ error: "Failed to read manifest" });
  }
});

// PUT /api/pictograms/:id - Update a pictogram's metadata (name, tags, category, contributor)
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { name, tags, category, contributor } = req.body;

    if (tags !== undefined) {
      if (
        !Array.isArray(tags) ||
        tags.some(
          (t: unknown) => typeof t !== "string" || (t as string).length > 50,
        )
      ) {
        res.status(400).json({
          error: "Tags must be an array of strings (max 50 chars each)",
        });
        return;
      }
      if (tags.length > 30) {
        res.status(400).json({ error: "Maximum 30 tags allowed" });
        return;
      }
    }

    if (category !== undefined && typeof category !== "string") {
      res.status(400).json({ error: "Category must be a string" });
      return;
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.length === 0 || name.length > 200) {
        res.status(400).json({
          error: "Name must be a non-empty string (max 200 chars)",
        });
        return;
      }
    }

    try {
      const result = await readJsonFile<PictogramManifest>(MANIFEST_KEY);
      if (!result) {
        res.status(404).json({ error: "Manifest not found" });
        return;
      }

      const manifest = result.data;
      const picto = manifest.pictograms.find((p) => p.id === id);
      if (!picto) {
        res.status(404).json({ error: "Pictogram not found" });
        return;
      }

      if (name !== undefined) picto.name = name;
      if (tags !== undefined) picto.tags = tags;
      if (category !== undefined) picto.category = category;
      if (contributor !== undefined) picto.contributor = contributor;
      manifest.lastUpdated = new Date().toISOString();

      await writeJsonFile(MANIFEST_KEY, manifest);

      res.json(picto);
    } catch {
      res.status(500).json({ error: "Failed to update pictogram" });
    }
  },
);

// DELETE /api/pictograms/:id - Delete a pictogram (SVG + dark variant + manifest + galleries)
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;

    try {
      const manifestResult =
        await readJsonFile<PictogramManifest>(MANIFEST_KEY);
      if (!manifestResult) {
        res.status(404).json({ error: "Manifest not found" });
        return;
      }

      const manifest = manifestResult.data;
      const picto = manifest.pictograms.find((p) => p.id === id);
      if (!picto) {
        res.status(404).json({ error: "Pictogram not found" });
        return;
      }

      // Extract S3 key from URL
      const url = new URL(picto.url);
      const key = url.pathname.replace(/^\/[^/]+\//, "");

      // Delete SVG file
      await deleteFile(key);

      // Try to delete dark variant if it exists
      const darkPicto = manifest.pictograms.find(
        (p) =>
          p.id !== id &&
          p.filename === picto.filename.replace(/\.svg$/i, "_dark.svg"),
      );
      if (darkPicto) {
        try {
          const darkUrl = new URL(darkPicto.url);
          const darkKey = darkUrl.pathname.replace(/^\/[^/]+\//, "");
          await deleteFile(darkKey);
        } catch {
          // Non-blocking: dark variant deletion failure is acceptable
        }
      }

      // Remove picto (and its dark variant) from manifest
      manifest.pictograms = manifest.pictograms.filter(
        (p) => p.id !== id && (!darkPicto || p.id !== darkPicto.id),
      );
      manifest.totalCount = manifest.pictograms.length;
      manifest.lastUpdated = new Date().toISOString();
      await writeJsonFile(MANIFEST_KEY, manifest);

      // Clean up galleries
      const galleriesResult = await readJsonFile<GalleriesFile>(GALLERIES_KEY);
      if (galleriesResult) {
        const galleriesFile = galleriesResult.data;
        let changed = false;
        for (const gallery of galleriesFile.galleries) {
          const idx = gallery.pictogramIds.indexOf(id);
          if (idx !== -1) {
            gallery.pictogramIds.splice(idx, 1);
            changed = true;
          }
        }
        if (changed) {
          await writeJsonFile(GALLERIES_KEY, galleriesFile);
        }
      }

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete pictogram" });
    }
  },
);

export default router;
