import { Router, Request, Response } from "express";
import { Resvg } from "@resvg/resvg-js";
import rateLimit from "express-rate-limit";
import {
  incrementDownload,
  getDownloads,
} from "../db/repositories/downloads.js";
import {
  getAnonymousDownloadCount,
  incrementAnonymousDownload,
} from "../db/repositories/anonymous-downloads.js";
import { getPictogramById } from "../db/repositories/pictograms.js";
import { readFileAsText } from "../services/minio.js";
import { config } from "../config.js";

const downloadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

const router = Router();

const DAILY_ANONYMOUS_LIMIT = 1;
// Taille PNG pour les utilisateurs anonymes — jamais overridable côté backend
const DEFAULT_PNG_SIZE = 128;
const ALLOWED_SIZES = [64, 128, 256, 512, 1024];

// POST /api/pictograms/:id/download - Track a download (legacy, still used by frontend SVG/PNG downloads for authenticated users)
router.post(
  "/:id/download",
  downloadLimiter,
  (req: Request, res: Response): void => {
    const id = req.params.id as string;
    if (!id || id.length > 200) {
      res.status(400).json({ error: "Invalid pictogram ID" });
      return;
    }

    // S28 — Verify pictogram exists before incrementing counter
    const picto = getPictogramById(id);
    if (!picto) {
      res.status(404).json({ error: "Pictogram not found" });
      return;
    }

    const count = incrementDownload(id);
    res.json({ id, downloads: count });
  },
);

// GET /api/pictograms/downloads - Get all download counts
router.get("/downloads", (_req: Request, res: Response): void => {
  const data = getDownloads();
  res.json(data);
});

// GET /api/pictograms/downloads/remaining - Check remaining anonymous downloads
router.get("/downloads/remaining", (req: Request, res: Response): void => {
  const ip = req.ip || "unknown";
  const count = getAnonymousDownloadCount(ip);
  const remaining = Math.max(0, DAILY_ANONYMOUS_LIMIT - count);
  res.json({ remaining, limit: DAILY_ANONYMOUS_LIMIT });
});

// POST /api/pictograms/:id/download-png - Download PNG with IP limit for anonymous
router.post(
  "/:id/download-png",
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    if (!id || id.length > 200) {
      res.status(400).json({ error: "Invalid pictogram ID" });
      return;
    }

    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    const isAuthenticated = !!authHeader && authHeader.startsWith("Bearer ");

    // Parse size (only for authenticated users)
    let size = DEFAULT_PNG_SIZE;
    if (isAuthenticated && req.query.size) {
      const requested = parseInt(req.query.size as string, 10);
      if (ALLOWED_SIZES.includes(requested)) {
        size = requested;
      }
    }

    // Anonymous: check daily limit
    if (!isAuthenticated) {
      const ip = req.ip || "unknown";
      const count = getAnonymousDownloadCount(ip);
      if (count >= DAILY_ANONYMOUS_LIMIT) {
        res.status(403).json({
          error: "limit_reached",
          message:
            "Limite quotidienne atteinte. Connectez-vous pour telecharger sans limite.",
        });
        return;
      }
      // Increment anonymous counter
      incrementAnonymousDownload(ip);
    }

    // Fetch the pictogram
    const picto = getPictogramById(id);
    if (!picto) {
      res.status(404).json({ error: "Pictogram not found" });
      return;
    }

    try {
      // Get SVG content from Minio
      const url = new URL(picto.url);
      const key = url.pathname.replace(`/${config.minio.bucket}/`, "");
      const svgText = await readFileAsText(key);

      if (!svgText) {
        res.status(404).json({ error: "SVG file not found" });
        return;
      }

      // Convert SVG to PNG
      const resvg = new Resvg(svgText, {
        fitTo: { mode: "height", value: size },
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      // Track global download count
      incrementDownload(id);

      // Send PNG
      const filename = picto.filename.replace(/\.svg$/i, `.${size}px.png`);
      const encodedFilename = encodeURIComponent(filename);
      res.set("Content-Type", "image/png");
      res.set(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodedFilename}`,
      );
      res.set("Content-Length", String(pngBuffer.length));
      if (!isAuthenticated) {
        res.set("X-Downloads-Remaining", "0");
      }
      res.send(Buffer.from(pngBuffer));
    } catch (err) {
      console.error("Failed to generate PNG:", err);
      res.status(500).json({ error: "Failed to generate PNG" });
    }
  },
);

export default router;
