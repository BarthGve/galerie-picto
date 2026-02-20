import { Router, Response } from "express";
import { authAnyUser } from "../middleware/auth-any-user.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { deleteUser, getUserProfile } from "../db/repositories/users.js";

const router = Router();

// GET /api/user/me - Retourne le profil et les stats de l'utilisateur connecté
router.get(
  "/me",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const login = req.user!.login;
    const profile = getUserProfile(login);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(profile);
  },
);

// DELETE /api/user/me - Supprime le compte et toutes les données associées
// Les tables favorites, user_collections, pictogram_likes, user_pictograms
// sont supprimées en cascade via les FK SQLite (foreign_keys = ON).
router.delete(
  "/me",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const login = req.user!.login;

    try {
      const deleted = deleteUser(login);
      if (!deleted) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        success: true,
        message: "Account and all associated data deleted",
      });
    } catch {
      res.status(500).json({ error: "Failed to delete account" });
    }
  },
);

export default router;
