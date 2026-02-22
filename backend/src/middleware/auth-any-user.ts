import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, GitHubUser } from "./auth.js";
import { upsertUser, getUserByLogin } from "../db/repositories/users.js";
import { config } from "../config.js";
import { getCachedToken, setCachedToken } from "./token-cache.js";
import { isBanned } from "./ban-list.js";
import { notifyN8nNewUser } from "../services/n8n-notify.js";
import { createNotification } from "../db/repositories/notifications.js";

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
      isCollaborator: true,
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
    if (isBanned(cached.user.login)) {
      res.status(403).json({ error: "Compte suspendu" });
      return;
    }
    req.user = cached.user;
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;

    if (isBanned(payload.login)) {
      res.status(403).json({ error: "Compte suspendu" });
      return;
    }

    const user: GitHubUser = {
      login: payload.login,
      avatar_url: payload.avatar_url,
      name: payload.name,
      email: payload.email,
      isCollaborator: payload.isCollaborator,
    };

    const { isNew } = upsertUser({
      githubLogin: user.login,
      githubName: user.name,
      githubAvatarUrl: user.avatar_url,
      githubEmail: user.email,
    });

    if (isNew) {
      // Notify collaborators about the new user
      const allowedLogins = config.github.allowedUsername
        ? config.github.allowedUsername
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      for (const collabLogin of allowedLogins) {
        if (collabLogin !== user.login) {
          // In-app notification
          createNotification({
            recipientLogin: collabLogin,
            type: "new_user",
            title: user.name || user.login,
            message: `${user.name || user.login} vient de rejoindre La Boîte à Pictos`,
            link: "/admin",
          });

          // Email notification
          const collab = getUserByLogin(collabLogin);
          if (collab?.githubEmail) {
            notifyN8nNewUser({
              event: "new_user_registered",
              newUser: {
                login: user.login,
                name: user.name ?? undefined,
                avatarUrl: user.avatar_url,
              },
              recipient: {
                login: collabLogin,
                name: collab.githubName ?? undefined,
                email: collab.githubEmail,
              },
              siteUrl: config.corsOrigin,
            });
          }
        }
      }
    }

    setCachedToken(token, user, payload.isCollaborator);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
