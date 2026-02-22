import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { readFileSync } from "fs";
import { runMigrations, closeDb } from "./db/index.js";
import { autoSeedIfEmpty } from "./db/seed-from-minio.js";
import { initBanList } from "./middleware/ban-list.js";
import { getBannedLogins } from "./db/repositories/users.js";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
);
import authRoutes from "./routes/auth.js";
import initRoutes from "./routes/init.js";
import uploadRoutes from "./routes/upload.js";
import galleriesRoutes from "./routes/galleries.js";
import pictogramsRoutes from "./routes/pictograms.js";
import proxyRoutes from "./routes/proxy.js";
import githubProfileRoutes from "./routes/github-profile.js";
import downloadsRoutes from "./routes/downloads.js";
import favoritesRoutes from "./routes/favorites.js";
import userCollectionsRoutes from "./routes/user-collections.js";
import userPictogramsRoutes from "./routes/user-pictograms.js";
import likesRoutes from "./routes/likes.js";
import feedbackRoutes from "./routes/feedback.js";
import accountRoutes from "./routes/account.js";
import adminRoutes from "./routes/admin.js";
import sitemapRoutes from "./routes/sitemap.js";
import requestsRoutes from "./routes/requests.js";
import notificationsRoutes from "./routes/notifications.js";
import gdprRequestsRoutes from "./routes/gdpr-requests.js";

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
      if (req.url?.endsWith("/feedback/webhook")) {
        req.rawBody = buf;
      }
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
app.use("/api/init", initRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/galleries", galleriesRoutes);
app.use("/api/pictograms", pictogramsRoutes);
app.use("/api/pictograms", downloadsRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/github/profile", githubProfileRoutes);
app.use("/api/user", favoritesRoutes);
app.use("/api/user", userCollectionsRoutes);

const userUploadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.method === "GET", // Ne rate-limiter que les mutations (POST/PUT/DELETE)
});
app.use("/api/user/pictograms", userUploadLimiter);
app.use("/api/user", userPictogramsRoutes);
app.use("/api/pictograms", likesRoutes);

const svgBatchLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use("/api/proxy/svg-batch", svgBatchLimiter);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/user", accountRoutes);

const adminLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use("/api/admin", adminLimiter);
app.use("/api/admin", adminRoutes);
app.use("/api/sitemap.xml", sitemapRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/gdpr-requests", gdprRequestsRoutes);

// Run migrations then start server
runMigrations();

// Init in-memory ban list from DB
initBanList(getBannedLogins());

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
