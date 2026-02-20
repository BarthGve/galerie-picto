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

/**
 * POST /api/proxy/svg-batch
 * Body: { urls: string[] }
 * Fetch plusieurs SVGs en parallèle côté serveur et les retourne en une seule réponse.
 * Évite les 50 requêtes HTTP individuelles depuis le navigateur (limite 6 connexions HTTP/1.1).
 */
router.post("/svg-batch", async (req, res) => {
  const { urls } = req.body as { urls: unknown };

  if (!Array.isArray(urls) || urls.length === 0) {
    res.status(400).json({ error: "urls must be a non-empty array" });
    return;
  }

  if (urls.length > 100) {
    res.status(400).json({ error: "Too many URLs (max 100)" });
    return;
  }

  const cdnHost = config.minio.endpoint.replace(/^https?:\/\//, "");

  // Valider et filtrer les URLs
  const validatedUrls: string[] = [];
  for (const url of urls) {
    if (typeof url !== "string") continue;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" && parsed.hostname === cdnHost) {
        validatedUrls.push(url);
      }
    } catch {
      // skip invalid
    }
  }

  // Fetch tous les SVGs en parallèle côté serveur (pas de limite de connexions)
  const settled = await Promise.allSettled(
    validatedUrls.map(async (url) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch(url, {
          redirect: "error",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const svgText = await response.text();
        if (svgText.length > 2_097_152) throw new Error("Too large");
        return { url, svgText };
      } finally {
        clearTimeout(timeout);
      }
    }),
  );

  const results = settled.map((result, i) => {
    if (result.status === "fulfilled") {
      return { url: validatedUrls[i], svgText: result.value.svgText };
    }
    return { url: validatedUrls[i], error: "fetch_failed" };
  });

  res.setHeader("Cache-Control", "no-store");
  res.json({ results });
});

export default router;
