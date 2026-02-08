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

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
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

    req.user = user;
    next();
  } catch {
    res.status(500).json({ error: "Failed to verify GitHub token" });
  }
}
