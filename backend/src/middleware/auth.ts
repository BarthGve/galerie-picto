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

// Cache repo collaborators for 10 minutes
const collaboratorsCache = { logins: new Set<string>(), expiresAt: 0 };
const COLLABORATORS_CACHE_TTL = 10 * 60_000;

async function isRepoCollaborator(login: string): Promise<boolean> {
  // Check cache first
  if (collaboratorsCache.expiresAt > Date.now()) {
    return collaboratorsCache.logins.has(login);
  }

  if (!config.github.repo || !config.feedback.token) return false;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.github.repo}/collaborators`,
      {
        headers: {
          Authorization: `Bearer ${config.feedback.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (response.ok) {
      const collaborators = (await response.json()) as { login: string }[];
      const logins = new Set(collaborators.map((c) => c.login));
      collaboratorsCache.logins = logins;
      collaboratorsCache.expiresAt = Date.now() + COLLABORATORS_CACHE_TTL;
      return logins.has(login);
    }
  } catch {
    // ignore — fall through to false
  }

  return false;
}

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

  // Dev mode bypass
  if (process.env.NODE_ENV !== "production" && token === "dev-token") {
    req.user = {
      login: "dev-user",
      avatar_url: "https://api.dicebear.com/9.x/pixel-art/svg?seed=dev",
      name: "Dev User",
      email: "dev@localhost",
    };
    next();
    return;
  }

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

    // Check authorization: allowed username OR repo collaborator
    const isAllowedUser =
      config.github.allowedUsername &&
      user.login === config.github.allowedUsername;

    if (!isAllowedUser && !(await isRepoCollaborator(user.login))) {
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
