import { Router, Request, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { deleteFile } from "../services/minio.js";
import {
  getManifestCached,
  getPictogramById,
  updatePictogram,
  deletePictogram as dbDeletePictogram,
} from "../db/repositories/pictograms.js";
import { config } from "../config.js";

const router = Router();

// GET /api/pictograms/manifest - Get the pictograms manifest (with ETag/304)
router.get("/manifest", (req: Request, res: Response): void => {
  try {
    const { json, etag } = getManifestCached();

    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    res.set("ETag", etag);
    res.set("Content-Type", "application/json");
    res.send(json);
  } catch {
    res.status(500).json({ error: "Failed to read manifest" });
  }
});

// PUT /api/pictograms/:id - Update a pictogram's metadata
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { name, tags, contributor } = req.body;

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

    if (name !== undefined) {
      if (typeof name !== "string" || name.length === 0 || name.length > 200) {
        res.status(400).json({
          error: "Name must be a non-empty string (max 200 chars)",
        });
        return;
      }
    }

    try {
      const updated = updatePictogram(id, { name, tags, contributor });
      if (!updated) {
        res.status(404).json({ error: "Pictogram not found" });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to update pictogram" });
    }
  },
);

// DELETE /api/pictograms/:id - Delete a pictogram (SVG + DB)
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;

    try {
      const picto = getPictogramById(id);
      if (!picto) {
        res.status(404).json({ error: "Pictogram not found" });
        return;
      }

      // Extract S3 key from URL
      const url = new URL(picto.url);
      const key = url.pathname.replace(`/${config.minio.bucket}/`, "");

      // Delete SVG file from Minio
      await deleteFile(key);

      // Delete from DB (cascade handles gallery_pictograms and downloads)
      dbDeletePictogram(id);

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete pictogram" });
    }
  },
);

export default router;
