import { Router } from "express";
import { config } from "../config.js";

const router = Router();

/**
 * GET /api/proxy/svg?url=...
 * Proxy pour fetcher le contenu SVG depuis le CDN
 * Contourne le problème de double header Access-Control-Allow-Origin
 */
router.get("/svg", async (req, res) => {
  const url = req.query.url as string;

  if (!url) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  // Validation stricte de l'URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  if (parsed.protocol !== "https:") {
    res.status(403).json({ error: "Only HTTPS URLs allowed" });
    return;
  }

  const cdnHost = config.minio.endpoint.replace(/^https?:\/\//, "");
  if (parsed.hostname !== cdnHost) {
    res.status(403).json({ error: "URL not allowed" });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      redirect: "error",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(response.status).json({ error: "Upstream fetch failed" });
      return;
    }

    // Reject responses larger than 2 MB
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 2_097_152) {
      res.status(413).json({ error: "Response too large" });
      return;
    }

    const svgText = await response.text();
    if (svgText.length > 2_097_152) {
      res.status(413).json({ error: "Response too large" });
      return;
    }

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(svgText);
  } catch {
    res.status(500).json({ error: "Failed to fetch SVG" });
  }
});

export default router;
