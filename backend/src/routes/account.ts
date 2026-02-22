import { Router, Response } from "express";
import { authAnyUser } from "../middleware/auth-any-user.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
  deleteUser,
  getUserProfile,
  clearUserEmail,
  updateUserEmail,
  setEmailNotifPreferences,
  VALID_NOTIF_KEYS,
  type EmailNotifKey,
} from "../db/repositories/users.js";
import { getUserPictograms } from "../db/repositories/user-pictograms.js";
import { deletePrivateFile } from "../services/minio.js";

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

// PATCH /api/user/me/email - Modifier son email
router.patch(
  "/me/email",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const { email } = req.body as { email?: string };
    if (
      !email ||
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      res.status(400).json({ error: "Adresse email invalide" });
      return;
    }
    try {
      updateUserEmail(req.user!.login, email);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update email" });
    }
  },
);

// PATCH /api/user/me/notifications - Modifier les préférences de notifications granulaires
router.patch(
  "/me/notifications",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const body = req.body as Record<string, unknown>;
    const prefs: Partial<Record<EmailNotifKey, boolean>> = {};

    for (const [key, val] of Object.entries(body)) {
      if (!VALID_NOTIF_KEYS.includes(key as EmailNotifKey)) {
        res.status(400).json({ error: "Clé de notification inconnue" });
        return;
      }
      if (typeof val !== "boolean") {
        res.status(400).json({ error: "La valeur doit être un booléen" });
        return;
      }
      prefs[key as EmailNotifKey] = val;
    }

    if (Object.keys(prefs).length === 0) {
      res.status(400).json({ error: "Aucune préférence fournie" });
      return;
    }

    try {
      setEmailNotifPreferences(req.user!.login, prefs);
      res.json({ success: true });
    } catch {
      res
        .status(500)
        .json({ error: "Failed to update notification preferences" });
    }
  },
);

// DELETE /api/user/me/email - Retirer son email (opt-out)
router.delete(
  "/me/email",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      clearUserEmail(req.user!.login);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to clear email" });
    }
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
      const minioKeys = getUserPictograms(login).map((p) => p.minioKey);
      const deleted = deleteUser(login);
      if (!deleted) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      // Nettoyage Minio en background, sans bloquer la réponse
      Promise.allSettled(minioKeys.map((key) => deletePrivateFile(key))).catch(
        () => {},
      );
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
