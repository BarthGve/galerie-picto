import { Router, Request, Response } from "express";
import { incrementDownload, getDownloads } from "../services/downloads.js";

const router = Router();

// POST /api/pictograms/:id/download - Track a download
router.post("/:id/download", (req: Request, res: Response): void => {
  const id = req.params.id as string;
  if (!id || id.length > 200) {
    res.status(400).json({ error: "Invalid pictogram ID" });
    return;
  }

  const count = incrementDownload(id);
  res.json({ id, downloads: count });
});

// GET /api/pictograms/downloads - Get all download counts
router.get("/downloads", (_req: Request, res: Response): void => {
  const data = getDownloads();
  res.json(data);
});

export default router;
