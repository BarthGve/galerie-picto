import { Router, Request, Response } from "express";
import { config } from "../config.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { readJsonFile, writeJsonFile } from "../services/minio.js";
import type { PictogramManifest } from "../types.js";

const router = Router();

const MANIFEST_KEY = `${config.minio.prefix}pictograms-manifest.json`;

// GET /api/pictograms/manifest - Get the pictograms manifest
router.get("/manifest", async (_req: Request, res: Response): Promise<void> => {
  try {
    const manifest = await readJsonFile<PictogramManifest>(MANIFEST_KEY);
    if (!manifest) {
      res.json({
        pictograms: [],
        lastUpdated: new Date().toISOString(),
        totalCount: 0,
      });
      return;
    }
    res.json(manifest);
  } catch {
    res.status(500).json({ error: "Failed to read manifest" });
  }
});

// PUT /api/pictograms/:id - Update a pictogram's metadata (tags, category, contributor)
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { tags, category, contributor } = req.body;

    try {
      const manifest = await readJsonFile<PictogramManifest>(MANIFEST_KEY);
      if (!manifest) {
        res.status(404).json({ error: "Manifest not found" });
        return;
      }

      const picto = manifest.pictograms.find((p) => p.id === id);
      if (!picto) {
        res.status(404).json({ error: "Pictogram not found" });
        return;
      }

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

export default router;
