import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { getCachedToken, setCachedToken } from "./token-cache.js";

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

interface JwtPayload {
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  isCollaborator: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: GitHubUser;
}

export function authMiddleware(
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
    req.user = {
      login: "dev-user",
      avatar_url: "https://api.dicebear.com/9.x/pixel-art/svg?seed=dev",
      name: "Dev User",
      email: "dev@localhost",
    };
    next();
    return;
  }

  // Fast path: token already verified recently
  const cached = getCachedToken(token);
  if (cached) {
    if (
      !cached.isCollaborator &&
      cached.user.login !== config.github.allowedUsername
    ) {
      res.status(403).json({ error: "User not authorized" });
      return;
    }
    req.user = cached.user;
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;

    if (
      !payload.isCollaborator &&
      payload.login !== config.github.allowedUsername
    ) {
      res.status(403).json({ error: "User not authorized" });
      return;
    }

    const user: GitHubUser = {
      login: payload.login,
      avatar_url: payload.avatar_url,
      name: payload.name,
      email: payload.email,
    };
    setCachedToken(token, user, payload.isCollaborator);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
