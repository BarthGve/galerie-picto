import { Router, Request, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import {
  getGalleriesCached,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
  addPictogramsToGallery,
  removePictogramFromGallery,
} from "../db/repositories/galleries.js";

const router = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/galleries - List all galleries (with ETag/304)
router.get("/", (req: Request, res: Response): void => {
  try {
    const { json, etag } = getGalleriesCached();

    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    res.set("ETag", etag);
    res.set("Content-Type", "application/json");
    res.send(json);
  } catch {
    res.status(500).json({ error: "Failed to read galleries" });
  }
});

// POST /api/galleries - Create a gallery
router.post(
  "/",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const { name, description, color } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Missing required field: name" });
      return;
    }

    if (name.length > 100) {
      res.status(400).json({ error: "Name must be 100 characters or less" });
      return;
    }

    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      res
        .status(400)
        .json({ error: "Invalid color format (expected #rrggbb)" });
      return;
    }

    try {
      const id = slugify(name);

      if (getGalleryById(id)) {
        res
          .status(409)
          .json({ error: "A gallery with this name already exists" });
        return;
      }

      const gallery = createGallery({ id, name, description, color });
      console.log(`Gallery created: ${gallery.id} (${gallery.name})`);
      res.status(201).json(gallery);
    } catch (err) {
      console.error("Failed to create gallery:", err);
      res.status(500).json({ error: "Failed to create gallery" });
    }
  },
);

// PUT /api/galleries/:id - Update a gallery
router.put(
  "/:id",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const { name, description, color } = req.body;

    if (name !== undefined && (typeof name !== "string" || name.length > 100)) {
      res.status(400).json({ error: "Invalid name" });
      return;
    }

    if (
      color !== undefined &&
      color !== "" &&
      !/^#[0-9a-fA-F]{6}$/.test(color)
    ) {
      res
        .status(400)
        .json({ error: "Invalid color format (expected #rrggbb)" });
      return;
    }

    try {
      const gallery = updateGallery(id, { name, description, color });
      if (!gallery) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }
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
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;

    try {
      const success = deleteGallery(id);
      if (!success) {
        res.status(404).json({ error: "Gallery not found" });
        return;
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
  (req: AuthenticatedRequest, res: Response): void => {
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
      const gallery = getGalleryById(id);
      if (!gallery) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }

      addPictogramsToGallery(id, pictogramIds);
      console.log(`Added ${pictogramIds.length} pictogram(s) to gallery ${id}`);

      const updated = getGalleryById(id);
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to add pictograms to gallery" });
    }
  },
);

// DELETE /api/galleries/:id/pictograms/:pictoId - Remove a pictogram from a gallery
router.delete(
  "/:id/pictograms/:pictoId",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const pictoId = req.params.pictoId as string;

    try {
      const gallery = getGalleryById(id);
      if (!gallery) {
        res.status(404).json({ error: "Gallery not found" });
        return;
      }

      removePictogramFromGallery(id, pictoId);
      const updated = getGalleryById(id);
      res.json(updated);
    } catch {
      res
        .status(500)
        .json({ error: "Failed to remove pictogram from gallery" });
    }
  },
);

export default router;
