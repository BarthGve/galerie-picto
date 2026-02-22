import { Router, Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import { config } from "../config.js";
import { getNewsletterSubscribers } from "../db/repositories/users.js";
import { getRecentPictograms } from "../db/repositories/pictograms.js";

const router = Router();

/**
 * GET /api/internal/newsletter-data
 * Secured by N8N_NEWSLETTER_SECRET Bearer token.
 * Returns new pictograms from the last 7 days + subscribed users.
 */
router.get("/newsletter-data", (req: Request, res: Response): void => {
  const secret = config.n8n.newsletterSecret;
  if (!secret) {
    res.status(503).json({ error: "Newsletter not configured" });
    return;
  }

  const auth = req.headers.authorization ?? "";
  const expected = `Bearer ${secret}`;
  if (
    auth.length !== expected.length ||
    !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
  ) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const pictograms = getRecentPictograms(since);
  const subscribers = getNewsletterSubscribers();

  res.json({ pictograms, subscribers, since });
});

export default router;
