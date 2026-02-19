import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { readFileSync, existsSync, createReadStream } from "fs";
import { resolve } from "path";
import { runMigrations, closeDb } from "./db/index.js";
import { autoSeedIfEmpty } from "./db/seed-from-minio.js";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
);
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js";
import galleriesRoutes from "./routes/galleries.js";
import pictogramsRoutes from "./routes/pictograms.js";
import proxyRoutes from "./routes/proxy.js";
import githubProfileRoutes from "./routes/github-profile.js";
import downloadsRoutes from "./routes/downloads.js";
import favoritesRoutes from "./routes/favorites.js";
import userCollectionsRoutes from "./routes/user-collections.js";
import likesRoutes from "./routes/likes.js";
import feedbackRoutes from "./routes/feedback.js";

const app = express();

// Trust Railway reverse proxy (required for rate limiting behind proxy)
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // CSP handled by frontend meta tag
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Compression
app.use(compression());

// CORS
const corsOriginValue =
  process.env.NODE_ENV !== "production"
    ? /^http:\/\/localhost:\d+$/
    : config.corsOrigin;
app.use(
  cors({
    origin: corsOriginValue,
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: "2mb",
    verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

const uploadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use("/api/upload", uploadLimiter);

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

// No-cache for mutation API responses only
app.use("/api", (req, _res, next) => {
  if (req.method !== "GET") {
    _res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    _res.set("Pragma", "no-cache");
  }
  next();
});

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: pkg.version,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/galleries", galleriesRoutes);
app.use("/api/pictograms", pictogramsRoutes);
app.use("/api/pictograms", downloadsRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/github/profile", githubProfileRoutes);
app.use("/api/user", favoritesRoutes);
app.use("/api/user", userCollectionsRoutes);
app.use("/api/pictograms", likesRoutes);
app.use("/api/feedback", feedbackRoutes);

// TEMP: route d'export DB - à supprimer après migration
app.get("/admin/export-db", (req, res) => {
  const secret = process.env.ADMIN_EXPORT_SECRET;
  if (!secret || req.headers["x-admin-secret"] !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const dbPath = resolve(process.env.DATABASE_PATH || "./data/galerie.db");
  if (!existsSync(dbPath)) {
    res.status(404).json({ error: "Database file not found" });
    return;
  }
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", "attachment; filename=galerie.db");
  createReadStream(dbPath).pipe(res);
});

// Run migrations then start server
runMigrations();

// Cleanup old anonymous download entries
import { cleanupOldEntries } from "./db/repositories/anonymous-downloads.js";
const cleaned = cleanupOldEntries(7);
if (cleaned > 0)
  console.log(`Cleaned ${cleaned} old anonymous download entries`);

// Auto-seed from Minio if DB is empty (e.g. fresh prod deployment)
autoSeedIfEmpty().then(() => {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
});

// Graceful shutdown
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    closeDb();
    process.exit(0);
  });
}
