import { Router, Request, Response } from "express";
import { authAnyUser } from "../middleware/auth-any-user.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getLikesData, toggleLike } from "../db/repositories/likes.js";

const router = Router();

// GET /api/pictograms/likes — public, token optionnel pour retourner liked[]
router.get("/likes", (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization;
    let userLogin: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      // Try to decode token for user login — best-effort, no error if invalid
      try {
        const token = authHeader.slice(7);
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64url").toString(),
        );
        userLogin = payload.login as string | undefined;
      } catch {
        // Token invalide ou non-JWT → on ignore
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
