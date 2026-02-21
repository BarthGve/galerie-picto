import { Router, Response } from "express";
import { authAnyUser } from "../middleware/auth-any-user.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { config } from "../config.js";
import {
  writePrivateSvgFile,
  deletePrivateFile,
  readPrivateFileAsText,
} from "../services/minio.js";
import {
  sanitizeSvg,
  isValidSvgFilename,
  isValidSvgContent,
} from "../services/svg-sanitizer.js";
import {
  getUserPictograms,
  getUserPictogramById,
  getUserStorageUsed,
  insertUserPictogram,
  updateUserPictogram,
  deleteUserPictogram,
  addUserPictogramToCollection,
  removeUserPictogramFromCollection,
  USER_STORAGE_QUOTA,
} from "../db/repositories/user-pictograms.js";
import { getCollectionById } from "../db/repositories/user-collections.js";

const router = Router();

// POST /pictograms — Upload SVG privé
router.post(
  "/pictograms",
  authAnyUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const login = req.user!.login;
    const { filename, content, name, collectionId, tags } = req.body as {
      filename?: string;
      content?: string;
      name?: string;
      collectionId?: string;
      tags?: string[];
    };

    if (!filename || !isValidSvgFilename(filename)) {
      res.status(400).json({ error: "Invalid or missing filename" });
      return;
    }
    if (!content || !isValidSvgContent(content)) {
      res.status(400).json({ error: "Invalid or missing SVG content" });
      return;
    }
    if (!name || typeof name !== "string" || name.length > 100) {
      res
        .status(400)
        .json({ error: "Invalid or missing name (max 100 chars)" });
      return;
    }
    if (!collectionId || typeof collectionId !== "string") {
      res.status(400).json({ error: "Missing collectionId" });
      return;
    }

    // Validate tags before any I/O
    if (Array.isArray(tags)) {
      if (tags.length > 30) {
        res.status(400).json({ error: "Max 30 tags" });
        return;
      }
      if (
        tags.some(
          (t) =>
            typeof t !== "string" || t.trim().length === 0 || t.length > 50,
        )
      ) {
        res
          .status(400)
          .json({ error: "Tags must be non-empty strings of max 50 chars" });
        return;
      }
    }

    // Check collection exists and belongs to user BEFORE writing to Minio
    const collection = getCollectionById(collectionId, login);
    if (!collection) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }

    const sanitized = sanitizeSvg(content);
    const sanitizedSize = Buffer.byteLength(sanitized, "utf8");
    const storageUsed = getUserStorageUsed(login);
    if (storageUsed + sanitizedSize > USER_STORAGE_QUOTA) {
      res.status(507).json({ error: "Storage quota exceeded (5 MB)" });
      return;
    }

    const id = crypto.randomUUID();
    const minioKey = `${config.minio.privatePrefix}${login}/${crypto.randomUUID()}-${filename}`;

    await writePrivateSvgFile(minioKey, sanitized);

    const userPictogram = insertUserPictogram({
      id,
      ownerLogin: login,
      name: name.trim(),
      filename,
      minioKey,
      size: sanitizedSize,
      tags: Array.isArray(tags) ? tags : undefined,
    });

    addUserPictogramToCollection(collectionId, login, id);

    res.status(201).json({
      userPictogram: {
        id: userPictogram.id,
        ownerLogin: userPictogram.ownerLogin,
        name: userPictogram.name,
        filename: userPictogram.filename,
        size: userPictogram.size,
        tags: userPictogram.tags,
        createdAt: userPictogram.createdAt,
        updatedAt: userPictogram.updatedAt,
      },
    });
  },
);

// GET /pictograms — Liste des SVG privés
router.get(
  "/pictograms",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const login = req.user!.login;
    const userPictograms = getUserPictograms(login).map(
      ({
        id,
        ownerLogin,
        name,
        filename,
        size,
        tags,
        createdAt,
        updatedAt,
      }) => ({
        id,
        ownerLogin,
        name,
        filename,
        size,
        tags,
        createdAt,
        updatedAt,
      }),
    );
    res.json({ userPictograms });
  },
);

// GET /pictograms/:id/file — Proxy SVG privé
router.get(
  "/pictograms/:id/file",
  authAnyUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const login = req.user!.login;
    const id = String(req.params.id);

    const picto = getUserPictogramById(id, login);
    if (!picto) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const svgContent = await readPrivateFileAsText(picto.minioKey);
    if (!svgContent) {
      res.status(404).json({ error: "File not found in storage" });
      return;
    }

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(svgContent);
  },
);

// PATCH /pictograms/:id — Mettre à jour nom et/ou tags
router.patch(
  "/pictograms/:id",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const login = req.user!.login;
    const id = String(req.params.id);
    const { name, tags } = req.body as { name?: string; tags?: string[] };

    if (name === undefined && tags === undefined) {
      res.status(400).json({ error: "name or tags required" });
      return;
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length > 100) {
        res.status(400).json({ error: "Invalid name (max 100 chars)" });
        return;
      }
    }

    if (tags !== undefined) {
      if (
        !Array.isArray(tags) ||
        tags.length > 30 ||
        tags.some((t) => typeof t !== "string" || t.length > 50)
      ) {
        res.status(400).json({ error: "Invalid tags (max 30, 50 chars each)" });
        return;
      }
    }

    const userPictogram = updateUserPictogram(id, login, {
      name: name !== undefined ? name.trim() : undefined,
      tags,
    });
    if (!userPictogram) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({
      userPictogram: {
        id: userPictogram.id,
        ownerLogin: userPictogram.ownerLogin,
        name: userPictogram.name,
        filename: userPictogram.filename,
        size: userPictogram.size,
        tags: userPictogram.tags,
        createdAt: userPictogram.createdAt,
        updatedAt: userPictogram.updatedAt,
      },
    });
  },
);

// DELETE /pictograms/:id — Supprimer
router.delete(
  "/pictograms/:id",
  authAnyUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const login = req.user!.login;
    const id = String(req.params.id);

    const deleted = deleteUserPictogram(id, login);
    if (!deleted) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Ne pas bloquer sur erreur Minio
    deletePrivateFile(deleted.minioKey).catch(() => {});

    res.json({ success: true });
  },
);

// POST /collections/:id/user-pictograms — Ajouter à une collection
router.post(
  "/collections/:id/user-pictograms",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const login = req.user!.login;
    const collectionId = String(req.params.id);
    const { userPictogramId } = req.body as { userPictogramId?: string };

    if (!userPictogramId || typeof userPictogramId !== "string") {
      res.status(400).json({ error: "Missing userPictogramId" });
      return;
    }

    const picto = getUserPictogramById(userPictogramId, login);
    if (!picto) {
      res.status(404).json({ error: "User pictogram not found" });
      return;
    }

    const result = addUserPictogramToCollection(
      collectionId,
      login,
      userPictogramId,
    );
    if (result === "not_found") {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    if (result === "already_in") {
      res.status(409).json({ error: "Already in collection" });
      return;
    }
    if (result === "limit_reached") {
      res.status(400).json({ error: "Collection limit reached" });
      return;
    }

    res.status(201).json({ success: true });
  },
);

// DELETE /collections/:id/user-pictograms/:pictoId — Retirer d'une collection
router.delete(
  "/collections/:id/user-pictograms/:pictoId",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const login = req.user!.login;
    const collectionId = String(req.params.id);
    const pictoId = String(req.params.pictoId);

    const removed = removeUserPictogramFromCollection(
      collectionId,
      login,
      pictoId,
    );
    if (!removed) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({ success: true });
  },
);

export default router;
