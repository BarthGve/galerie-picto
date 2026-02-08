import { Router, Request, Response } from "express";
import { config } from "../config.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { readJsonFile, writeJsonFile } from "../services/minio.js";
import type { GalleriesFile, Gallery, PictogramManifest } from "../types.js";

const router = Router();

const GALLERIES_KEY = `${config.minio.prefix}galleries.json`;
const MANIFEST_KEY = `${config.minio.prefix}pictograms-manifest.json`;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getGalleriesFile(): Promise<GalleriesFile> {
  const file = await readJsonFile<GalleriesFile>(GALLERIES_KEY);
  return file || { galleries: [], lastUpdated: new Date().toISOString() };
}

async function getManifest(): Promise<PictogramManifest> {
  const file = await readJsonFile<PictogramManifest>(MANIFEST_KEY);
  return (
    file || {
      pictograms: [],
      lastUpdated: new Date().toISOString(),
      totalCount: 0,
    }
  );
}

// GET /api/galleries - List all galleries
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await getGalleriesFile();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to read galleries" });
  }
});

// POST /api/galleries - Create a gallery
router.post(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name, description, color, icon } = req.body;

    if (!name) {
      res.status(400).json({ error: "Missing required field: name" });
      return;
    }

    try {
      const data = await getGalleriesFile();
      const id = slugify(name);

      if (data.galleries.some((g) => g.id === id)) {
        res
          .status(409)
          .json({ error: "A gallery with this name already exists" });
        return;
      }

      const now = new Date().toISOString();
      const gallery: Gallery = {
        id,
        name,
        description,
        color,
        icon,
        pictogramIds: [],
        createdAt: now,
        updatedAt: now,
      };

      data.galleries.push(gallery);
      data.lastUpdated = now;
      await writeJsonFile(GALLERIES_KEY, data);

      res.status(201).json(gallery);
    } catch {
      res.status(500).json({ error: "Failed to create gallery" });
    }
  },
);

// PUT /api/galleries/:id - Update a gallery
router.put(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { name, description, color, icon } = req.body;

    try {
      const data = await getGalleriesFile();
      const index = data.galleries.findIndex((g) => g.id === id);

      if (index === -1) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }

      const now = new Date().toISOString();
      const gallery = data.galleries[index];
      if (name !== undefined) gallery.name = name;
      if (description !== undefined) gallery.description = description;
      if (color !== undefined) gallery.color = color;
      if (icon !== undefined) gallery.icon = icon;
      gallery.updatedAt = now;

      data.lastUpdated = now;
      await writeJsonFile(GALLERIES_KEY, data);

      res.json(gallery);
    } catch {
      res.status(500).json({ error: "Failed to update gallery" });
    }
  },
);

// DELETE /api/galleries/:id - Delete a gallery
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;

    try {
      const data = await getGalleriesFile();
      const index = data.galleries.findIndex((g) => g.id === id);

      if (index === -1) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }

      data.galleries.splice(index, 1);
      data.lastUpdated = new Date().toISOString();
      await writeJsonFile(GALLERIES_KEY, data);

      // Remove galleryId from all pictograms in the manifest
      const manifest = await getManifest();
      let manifestChanged = false;
      for (const picto of manifest.pictograms) {
        if (picto.galleryIds?.includes(id)) {
          picto.galleryIds = picto.galleryIds.filter((gid) => gid !== id);
          manifestChanged = true;
        }
      }
      if (manifestChanged) {
        manifest.lastUpdated = new Date().toISOString();
        await writeJsonFile(MANIFEST_KEY, manifest);
      }

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete gallery" });
    }
  },
);

// POST /api/galleries/:id/pictograms - Add pictograms to a gallery
router.post(
  "/:id/pictograms",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { pictogramIds } = req.body as { pictogramIds: string[] };

    if (
      !pictogramIds ||
      !Array.isArray(pictogramIds) ||
      pictogramIds.length === 0
    ) {
      res.status(400).json({ error: "Missing or empty pictogramIds array" });
      return;
    }

    try {
      // Update galleries.json
      const data = await getGalleriesFile();
      const gallery = data.galleries.find((g) => g.id === id);

      if (!gallery) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }

      const newIds = pictogramIds.filter(
        (pid) => !gallery.pictogramIds.includes(pid),
      );
      gallery.pictogramIds.push(...newIds);
      gallery.updatedAt = new Date().toISOString();
      data.lastUpdated = gallery.updatedAt;
      await writeJsonFile(GALLERIES_KEY, data);

      // Update pictograms-manifest.json
      const manifest = await getManifest();
      for (const picto of manifest.pictograms) {
        if (newIds.includes(picto.id)) {
          if (!picto.galleryIds) picto.galleryIds = [];
          if (!picto.galleryIds.includes(id)) {
            picto.galleryIds.push(id);
          }
        }
      }
      manifest.lastUpdated = new Date().toISOString();
      await writeJsonFile(MANIFEST_KEY, manifest);

      res.json(gallery);
    } catch {
      res.status(500).json({ error: "Failed to add pictograms to gallery" });
    }
  },
);

// DELETE /api/galleries/:id/pictograms/:pictoId - Remove a pictogram from a gallery
router.delete(
  "/:id/pictograms/:pictoId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const pictoId = req.params.pictoId as string;

    try {
      // Update galleries.json
      const data = await getGalleriesFile();
      const gallery = data.galleries.find((g) => g.id === id);

      if (!gallery) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }

      gallery.pictogramIds = gallery.pictogramIds.filter(
        (pid) => pid !== pictoId,
      );
      gallery.updatedAt = new Date().toISOString();
      data.lastUpdated = gallery.updatedAt;
      await writeJsonFile(GALLERIES_KEY, data);

      // Update pictograms-manifest.json
      const manifest = await getManifest();
      const picto = manifest.pictograms.find((p) => p.id === pictoId);
      if (picto?.galleryIds) {
        picto.galleryIds = picto.galleryIds.filter((gid) => gid !== id);
        manifest.lastUpdated = new Date().toISOString();
        await writeJsonFile(MANIFEST_KEY, manifest);
      }

      res.json(gallery);
    } catch {
      res
        .status(500)
        .json({ error: "Failed to remove pictogram from gallery" });
    }
  },
);

export default router;
