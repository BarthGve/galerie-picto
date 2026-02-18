import { Router, Response } from "express";
import { authAnyUser } from "../middleware/auth-any-user.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../db/repositories/favorites.js";

const router = Router();

// GET /api/user/favorites - Get current user's favorites
router.get(
  "/favorites",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const login = req.user!.login;
      const favorites = getFavorites(login);
      res.json({ favorites });
    } catch {
      res.status(500).json({ error: "Failed to get favorites" });
    }
  },
);

// POST /api/user/favorites/:id - Add a favorite
router.post(
  "/favorites/:id",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const pictoId = req.params.id as string;
    const login = req.user!.login;

    try {
      addFavorite(login, pictoId);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  },
);

// DELETE /api/user/favorites/:id - Remove a favorite
router.delete(
  "/favorites/:id",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const pictoId = req.params.id as string;
    const login = req.user!.login;

    try {
      const removed = removeFavorite(login, pictoId);
      if (!removed) {
        res.status(404).json({ error: "Favorite not found" });
        return;
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  },
);

export default router;
