import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, GitHubUser } from "./auth.js";
import { upsertUser } from "../db/repositories/users.js";
import { config } from "../config.js";
import { getCachedToken, setCachedToken } from "./token-cache.js";

interface JwtPayload {
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  isCollaborator: boolean;
}

export function authAnyUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  // Dev mode bypass
  if (process.env.NODE_ENV === "development" && token === "dev-token") {
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

  // Fast path: token already verified recently
  const cached = getCachedToken(token);
  if (cached) {
    req.user = cached.user;
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;

    const user: GitHubUser = {
      login: payload.login,
      avatar_url: payload.avatar_url,
      name: payload.name,
      email: payload.email,
    };

    upsertUser({
      githubLogin: user.login,
      githubName: user.name,
      githubAvatarUrl: user.avatar_url,
      githubEmail: user.email,
    });

    setCachedToken(token, user, payload.isCollaborator);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
