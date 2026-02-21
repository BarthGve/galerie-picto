import { Router, Response } from "express";
import { count, sum, desc, gte, isNull, eq, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { pictograms, users, downloads, likesCounts } from "../db/schema.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { invalidateCache as invalidatePictogramsCache } from "../db/repositories/pictograms.js";
import { invalidateCache as invalidateGalleriesCache } from "../db/repositories/galleries.js";
import {
  listUsers,
  banUser,
  unbanUser,
  deleteUser,
  getUserMinioKeys,
} from "../db/repositories/users.js";
import { removeBan } from "../middleware/ban-list.js";
import { deletePrivateFile } from "../services/minio.js";
import { config } from "../config.js";

const router = Router();

// GET /api/admin/stats — Dashboard stats (authMiddleware strict)
router.get(
  "/stats",
  authMiddleware,
  (_req: AuthenticatedRequest, res: Response): void => {
    try {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 3600 * 1000,
      ).toISOString();

      const totalPictogramsResult = db
        .select({ count: count() })
        .from(pictograms)
        .get();

      const totalUsersResult = db.select({ count: count() }).from(users).get();

      const activeUsersResult = db
        .select({ count: count() })
        .from(users)
        .where(gte(users.lastSeenAt, thirtyDaysAgo))
        .get();

      // sum() retourne string | null en SQLite/Drizzle — coercion via Number() ci-dessous
      const totalDownloadsResult = db
        .select({ total: sum(downloads.count) })
        .from(downloads)
        .get();

      const neverDownloadedList = db
        .select({ id: pictograms.id, name: pictograms.name })
        .from(pictograms)
        .leftJoin(downloads, eq(pictograms.id, downloads.pictogramId))
        .where(or(isNull(downloads.pictogramId), eq(downloads.count, 0)))
        .all();

      const topByDownloads = db
        .select({
          id: pictograms.id,
          name: pictograms.name,
          count: downloads.count,
        })
        .from(downloads)
        .innerJoin(pictograms, eq(downloads.pictogramId, pictograms.id))
        .orderBy(desc(downloads.count))
        .limit(10)
        .all();

      const topByLikes = db
        .select({
          id: pictograms.id,
          name: pictograms.name,
          count: likesCounts.count,
        })
        .from(likesCounts)
        .innerJoin(pictograms, eq(likesCounts.pictogramId, pictograms.id))
        .orderBy(desc(likesCounts.count))
        .limit(10)
        .all();

      const recentSignups = db
        .select({
          githubLogin: users.githubLogin,
          githubAvatarUrl: users.githubAvatarUrl,
          firstSeenAt: users.firstSeenAt,
        })
        .from(users)
        .orderBy(desc(users.firstSeenAt))
        .limit(5)
        .all();

      const recentPictograms = db
        .select({
          id: pictograms.id,
          name: pictograms.name,
          createdAt: pictograms.createdAt,
        })
        .from(pictograms)
        .orderBy(desc(pictograms.createdAt))
        .limit(5)
        .all();

      res.json({
        pictograms: {
          total: totalPictogramsResult?.count ?? 0,
          neverDownloaded: neverDownloadedList,
        },
        users: {
          total: totalUsersResult?.count ?? 0,
          activeLast30Days: activeUsersResult?.count ?? 0,
          recentSignups,
        },
        downloads: {
          total: Number(totalDownloadsResult?.total ?? 0),
          topPictograms: topByDownloads,
        },
        likes: {
          topPictograms: topByLikes,
        },
        recentPictograms,
      });
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },
);

// POST /api/admin/cache/invalidate — Invalidate in-memory caches
router.post(
  "/cache/invalidate",
  authMiddleware,
  (_req: AuthenticatedRequest, res: Response): void => {
    const errors: string[] = [];
    try {
      invalidatePictogramsCache();
    } catch (err) {
      console.error("Failed to invalidate pictograms cache:", err);
      errors.push("pictograms");
    }
    try {
      invalidateGalleriesCache();
    } catch (err) {
      console.error("Failed to invalidate galleries cache:", err);
      errors.push("galleries");
    }
    if (errors.length > 0) {
      res
        .status(500)
        .json({ error: `Cache invalidation failed for: ${errors.join(", ")}` });
      return;
    }
    console.log("Cache invalidated by admin");
    res.json({ ok: true });
  },
);

// GET /api/admin/users?page=1&limit=20&search=
router.get(
  "/users",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)),
    );
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;
    try {
      const result = listUsers({ page, limit, search: search || undefined });
      res.json({ ...result, page, limit });
    } catch (err) {
      console.error("Failed to list users:", err);
      res.status(500).json({ error: "Failed to list users" });
    }
  },
);

// POST /api/admin/users/:login/ban
router.post(
  "/users/:login/ban",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const { login } = req.params;
    if (login === config.github.allowedUsername) {
      res
        .status(403)
        .json({ error: "Impossible de bannir l'administrateur principal" });
      return;
    }
    const ok = banUser(login);
    if (!ok) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }
    res.json({ ok: true });
  },
);

// POST /api/admin/users/:login/unban
router.post(
  "/users/:login/unban",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const { login } = req.params;
    const ok = unbanUser(login);
    if (!ok) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }
    res.json({ ok: true });
  },
);

// DELETE /api/admin/users/:login
router.delete(
  "/users/:login",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { login } = req.params;
    if (login === config.github.allowedUsername) {
      res
        .status(403)
        .json({ error: "Impossible de supprimer l'administrateur principal" });
      return;
    }
    try {
      const minioKeys = getUserMinioKeys(login);
      const deleted = deleteUser(login);
      if (!deleted) {
        res.status(404).json({ error: "Utilisateur introuvable" });
        return;
      }
      removeBan(login);

      if (minioKeys.length > 0) {
        const results = await Promise.allSettled(
          minioKeys.map((key) => deletePrivateFile(key)),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          console.error(
            `[admin] Failed to delete ${failed}/${minioKeys.length} Minio files for user ${login}`,
          );
        }
      }

      res.json({ ok: true, deletedFiles: minioKeys.length });
    } catch (err) {
      console.error("Failed to delete user:", err);
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

export default router;
