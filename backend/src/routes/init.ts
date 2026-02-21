import { Router, Request, Response } from "express";
import { getManifestCached } from "../db/repositories/pictograms.js";
import { getGalleriesCached } from "../db/repositories/galleries.js";
import { getDownloads } from "../db/repositories/downloads.js";
import { getLikesData } from "../db/repositories/likes.js";

const router = Router();

// GET /api/init — Aggregate initial data in a single request
// Returns: manifest, galleries, downloads counts, likes counts
// Supports ETag/304 via a composite ETag
router.get("/", (req: Request, res: Response): void => {
  try {
    const { json: manifestJson, etag: manifestEtag } = getManifestCached();
    const { json: galleriesJson, etag: galleriesEtag } = getGalleriesCached();

    const compositeEtag = `"init-${manifestEtag}-${galleriesEtag}"`;

    if (req.headers["if-none-match"] === compositeEtag) {
      res.status(304).end();
      return;
    }

    const downloads = getDownloads();
    const likes = getLikesData();

    const manifest = JSON.parse(manifestJson);
    const galleries = JSON.parse(galleriesJson);

    res.set("ETag", compositeEtag);
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.json({ manifest, galleries, downloads, likes });
  } catch {
    res.status(500).json({ error: "Failed to load init data" });
  }
});

export default router;
