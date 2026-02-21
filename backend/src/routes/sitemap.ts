import { Router } from "express";
import { getAllGalleries } from "../db/repositories/galleries.js";

const router = Router();

const BASE_URL = "https://laboiteapictos.fr";

const STATIC_URLS = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/discover", changefreq: "daily", priority: "0.9" },
  { loc: "/gallery", changefreq: "daily", priority: "0.8" },
  { loc: "/collections", changefreq: "weekly", priority: "0.7" },
  { loc: "/feedback", changefreq: "monthly", priority: "0.4" },
  { loc: "/confidentialite", changefreq: "yearly", priority: "0.2" },
  { loc: "/cookies", changefreq: "yearly", priority: "0.2" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

router.get("/", (_req, res) => {
  const galleries = getAllGalleries();

  const urls = [
    ...STATIC_URLS.map(
      (u) =>
        `  <url>\n    <loc>${BASE_URL}${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    ),
    ...galleries.map(
      (g) =>
        `  <url>\n    <loc>${BASE_URL}/gallery?galleryId=${escapeXml(g.id)}</loc>\n    <lastmod>${g.updatedAt?.split("T")[0] ?? new Date().toISOString().split("T")[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(xml);
});

export default router;
