import { Response, NextFunction } from "express";
import { AuthenticatedRequest, GitHubUser } from "./auth.js";
import { upsertUser } from "../db/repositories/users.js";

// Cache validated tokens for 5 minutes
const tokenCache = new Map<string, { user: GitHubUser; expiresAt: number }>();
const TOKEN_CACHE_TTL = 5 * 60_000;

export async function authAnyUser(
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

  // Dev mode bypass
  if (process.env.NODE_ENV !== "production" && token === "dev-token") {
    const devUser: GitHubUser = {
      login: "dev-user",
      avatar_url: "https://api.dicebear.com/9.x/pixel-art/svg?seed=dev",
      name: "Dev User",
      email: "dev@localhost",
    };
    req.user = devUser;
    upsertUser({
      githubLogin: devUser.login,
      githubName: devUser.name,
      githubAvatarUrl: devUser.avatar_url,
      githubEmail: devUser.email,
    });
    next();
    return;
  }

  // Check cache
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

    // Cache the validated token
    tokenCache.set(token, { user, expiresAt: Date.now() + TOKEN_CACHE_TTL });

    // Upsert user in DB
    upsertUser({
      githubLogin: user.login,
      githubName: user.name,
      githubAvatarUrl: user.avatar_url,
      githubEmail: user.email,
    });

    req.user = user;
    next();
  } catch {
    res.status(500).json({ error: "Failed to verify GitHub token" });
  }
}
