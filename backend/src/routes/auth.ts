import { Router, Request, Response } from "express";
import { config } from "../config.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/github - Exchange OAuth code for access_token
router.post("/github", async (req: Request, res: Response): Promise<void> => {
  const { code, redirect_uri } = req.body;

  if (!code) {
    res.status(400).json({ error: "Missing code parameter" });
    return;
  }

  try {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: config.github.clientId,
          client_secret: config.github.clientSecret,
          code,
          redirect_uri,
        }),
      },
    );

    if (!response.ok) {
      res.status(502).json({ error: "Failed to exchange code with GitHub" });
      return;
    }

    const data = (await response.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (data.error) {
      res.status(400).json({
        error: data.error,
        error_description: data.error_description,
      });
      return;
    }

    res.json({ access_token: data.access_token });
  } catch {
    res
      .status(500)
      .json({ error: "Internal server error during OAuth exchange" });
  }
});

// GET /api/auth/verify - Verify token and return user info
router.get(
  "/verify",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json({
      login: req.user.login,
      avatar_url: req.user.avatar_url,
      name: req.user.name,
      email: req.user.email,
    });
  },
);

export default router;
