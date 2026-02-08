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

  // Vérifier que l'URL pointe bien vers notre CDN
  const cdnHost = config.minio.endpoint.replace(/^https?:\/\//, "");
  const parsed = new URL(url);
  if (!parsed.hostname.endsWith(cdnHost)) {
    res.status(403).json({ error: "URL not allowed" });
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      res.status(response.status).json({ error: "Upstream fetch failed" });
      return;
    }

    const svgText = await response.text();
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svgText);
  } catch (error) {
    console.error("Proxy SVG error:", error);
    res.status(500).json({ error: "Failed to fetch SVG" });
  }
});

export default router;
