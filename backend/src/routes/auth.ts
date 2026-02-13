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

// Cache for team collaborators (TTL 10 minutes)
let teamCache: {
  data: { login: string; avatar_url: string }[];
  expiresAt: number;
} | null = null;
const TEAM_CACHE_TTL = 10 * 60_000;

// GET /api/auth/team - List repo collaborators (always includes current user)
router.get(
  "/team",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUser = req.user!;

    // Return cached data if still valid (ensure current user is included)
    if (teamCache && teamCache.expiresAt > Date.now()) {
      const data = teamCache.data;
      if (!data.some((m) => m.login === currentUser.login)) {
        data.unshift({
          login: currentUser.login,
          avatar_url: currentUser.avatar_url,
        });
      }
      res.json(data);
      return;
    }

    if (!config.github.repo) {
      // No repo configured — return just the current user
      res.json([
        { login: currentUser.login, avatar_url: currentUser.avatar_url },
      ]);
      return;
    }

    const token = req.headers.authorization?.slice(7);
    if (!token) {
      res.status(401).json({ error: "Missing token" });
      return;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${config.github.repo}/collaborators`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );

      if (!response.ok) {
        // API failed — fallback to current user only
        res.json([
          { login: currentUser.login, avatar_url: currentUser.avatar_url },
        ]);
        return;
      }

      const collaborators = (await response.json()) as {
        login: string;
        avatar_url: string;
      }[];
      const data = collaborators.map(({ login, avatar_url }) => ({
        login,
        avatar_url,
      }));

      // Ensure current user is always in the list
      if (!data.some((m) => m.login === currentUser.login)) {
        data.unshift({
          login: currentUser.login,
          avatar_url: currentUser.avatar_url,
        });
      }

      // Cache the result
      teamCache = { data, expiresAt: Date.now() + TEAM_CACHE_TTL };

      res.json(data);
    } catch {
      // Network error — fallback to current user only
      res.json([
        { login: currentUser.login, avatar_url: currentUser.avatar_url },
      ]);
    }
  },
);

export default router;
