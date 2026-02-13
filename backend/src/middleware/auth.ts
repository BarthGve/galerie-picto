import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: GitHubUser;
}

// Cache validated tokens for 5 minutes to avoid hitting GitHub API on every request
const tokenCache = new Map<string, { user: GitHubUser; expiresAt: number }>();
const TOKEN_CACHE_TTL = 5 * 60_000;

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  // Check cache first
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    req.user = cached.user;
    next();
    return;
  }

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      tokenCache.delete(token);
      res.status(401).json({ error: "Invalid GitHub token" });
      return;
    }

    const user = (await response.json()) as GitHubUser;

    if (
      config.github.allowedUsername &&
      user.login !== config.github.allowedUsername
    ) {
      res.status(403).json({ error: "User not authorized" });
      return;
    }

    // Cache the validated token
    tokenCache.set(token, { user, expiresAt: Date.now() + TOKEN_CACHE_TTL });

    req.user = user;
    next();
  } catch {
    res.status(500).json({ error: "Failed to verify GitHub token" });
  }
}
