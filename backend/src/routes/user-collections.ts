import { Router, Response } from "express";
import { authAnyUser } from "../middleware/auth-any-user.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
  getUserCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addPictogramToCollection,
  removePictogramFromCollection,
  reorderCollections,
  reorderPictogramsInCollection,
} from "../db/repositories/user-collections.js";

const router = Router();

// GET /api/user/collections
router.get(
  "/collections",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const cols = getUserCollections(req.user!.login);
      res.json({ collections: cols });
    } catch {
      res.status(500).json({ error: "Failed to get collections" });
    }
  },
);

// POST /api/user/collections
router.post(
  "/collections",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const { name, color, description } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    if (name.length > 100) {
      res.status(400).json({ error: "name must be max 100 chars" });
      return;
    }
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      res.status(400).json({ error: "color must be #rrggbb" });
      return;
    }
    if (
      description !== undefined &&
      (typeof description !== "string" || description.length > 500)
    ) {
      res.status(400).json({ error: "description must be max 500 chars" });
      return;
    }
    try {
      const col = createCollection(
        req.user!.login,
        name.trim(),
        color,
        description?.trim() || undefined,
      );
      if (!col) {
        res.status(400).json({ error: "Maximum 20 collections reached" });
        return;
      }
      res.json({ collection: col });
    } catch {
      res.status(500).json({ error: "Failed to create collection" });
    }
  },
);

// PUT /api/user/collections/:id
router.put(
  "/collections/:id",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const { name, color, description } = req.body;
    if (name !== undefined && (typeof name !== "string" || name.length > 100)) {
      res.status(400).json({ error: "name must be max 100 chars" });
      return;
    }
    if (
      color !== undefined &&
      color !== null &&
      !/^#[0-9a-fA-F]{6}$/.test(color)
    ) {
      res.status(400).json({ error: "color must be #rrggbb" });
      return;
    }
    if (
      description !== undefined &&
      description !== null &&
      (typeof description !== "string" || description.length > 500)
    ) {
      res.status(400).json({ error: "description must be max 500 chars" });
      return;
    }
    try {
      const col = updateCollection(id, req.user!.login, {
        name,
        color,
        description: description === "" ? null : description,
      });
      if (!col) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      res.json({ collection: col });
    } catch {
      res.status(500).json({ error: "Failed to update collection" });
    }
  },
);

// DELETE /api/user/collections/:id
router.delete(
  "/collections/:id",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    try {
      const ok = deleteCollection(id, req.user!.login);
      if (!ok) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete collection" });
    }
  },
);

// POST /api/user/collections/:id/pictograms
router.post(
  "/collections/:id/pictograms",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const collectionId = req.params.id as string;
    const { pictogramId } = req.body;
    if (!pictogramId || typeof pictogramId !== "string") {
      res.status(400).json({ error: "pictogramId is required" });
      return;
    }
    try {
      const result = addPictogramToCollection(
        collectionId,
        req.user!.login,
        pictogramId,
      );
      if (result === "not_found") {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      if (result === "already_in") {
        res.status(409).json({ error: "Picto already in collection" });
        return;
      }
      if (result === "limit_reached") {
        res.status(400).json({ error: "Maximum 200 pictos reached" });
        return;
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to add pictogram" });
    }
  },
);

// DELETE /api/user/collections/:id/pictograms/:pictoId
router.delete(
  "/collections/:id/pictograms/:pictoId",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const collectionId = req.params.id as string;
    const pictogramId = req.params.pictoId as string;
    try {
      const ok = removePictogramFromCollection(
        collectionId,
        req.user!.login,
        pictogramId,
      );
      if (!ok) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to remove pictogram" });
    }
  },
);

// PUT /api/user/collections/reorder
router.put(
  "/collections/reorder",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const { collectionIds } = req.body;
    if (!Array.isArray(collectionIds)) {
      res.status(400).json({ error: "collectionIds must be an array" });
      return;
    }
    try {
      reorderCollections(req.user!.login, collectionIds);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to reorder collections" });
    }
  },
);

// PUT /api/user/collections/:id/pictograms/reorder
router.put(
  "/collections/:id/pictograms/reorder",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const { pictogramIds } = req.body;
    if (!Array.isArray(pictogramIds)) {
      res.status(400).json({ error: "pictogramIds must be an array" });
      return;
    }
    try {
      const ok = reorderPictogramsInCollection(
        id,
        req.user!.login,
        pictogramIds,
      );
      if (!ok) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to reorder pictograms" });
    }
  },
);

export default router;
