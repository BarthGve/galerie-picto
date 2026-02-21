import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authAnyUser } from "../middleware/auth-any-user.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getLikesData, toggleLike } from "../db/repositories/likes.js";
import { config } from "../config.js";

const router = Router();

// GET /api/pictograms/likes — public, token optionnel pour retourner liked[]
// Utilise le JWT applicatif pour extraire le login si présent
router.get("/likes", (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization;
    let userLogin: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      if (token !== "dev-token") {
        try {
          const payload = jwt.verify(token, config.jwtSecret) as {
            login?: string;
          };
          userLogin = payload.login;
        } catch {
          // Token invalide ou expiré → retourner les données publiques
        }
      } else if (process.env.NODE_ENV === "development") {
        userLogin = "dev-user";
      }
    }

    const data = getLikesData(userLogin);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to get likes" });
  }
});

// POST /api/pictograms/:id/like — toggle like, auth requise
router.post(
  "/:id/like",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const pictogramId = req.params.id as string;
    try {
      const result = toggleLike(req.user!.login, pictogramId);
      res.json(result);
    } catch {
      res.status(500).json({ error: "Failed to toggle like" });
    }
  },
);

export default router;
