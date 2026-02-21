import { Router } from "express";
import { config } from "../config.js";

const SVG_CACHE_MAX = 500;
const SVG_CACHE_TTL = 5 * 60_000;
const svgCache = new Map<string, { svgText: string; expiresAt: number }>();

function getCachedSvg(url: string): string | undefined {
  const entry = svgCache.get(url);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    svgCache.delete(url);
    return undefined;
  }
  svgCache.delete(url);
  svgCache.set(url, entry);
  return entry.svgText;
}

function setCachedSvg(url: string, svgText: string): void {
  if (svgCache.has(url)) svgCache.delete(url);
  else if (svgCache.size >= SVG_CACHE_MAX) {
    const firstKey = svgCache.keys().next().value;
    if (firstKey !== undefined) svgCache.delete(firstKey);
  }
  svgCache.set(url, { svgText, expiresAt: Date.now() + SVG_CACHE_TTL });
}

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
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'",
    );
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

  // Fetch les SVGs avec une concurrence limitée pour ne pas saturer le CDN
  const CONCURRENCY = 6;
  const settled: PromiseSettledResult<{ url: string; svgText: string }>[] =
    new Array(validatedUrls.length);
  let idx = 0;

  async function worker() {
    while (idx < validatedUrls.length) {
      const i = idx++;
      const url = validatedUrls[i];
      const cached = getCachedSvg(url);
      if (cached) {
        settled[i] = { status: "fulfilled", value: { url, svgText: cached } };
        continue;
      }
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
        setCachedSvg(url, svgText);
        settled[i] = { status: "fulfilled", value: { url, svgText } };
      } catch (reason) {
        clearTimeout(timeout);
        settled[i] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, validatedUrls.length) }, worker),
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
