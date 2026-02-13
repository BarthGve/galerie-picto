import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js";
import galleriesRoutes from "./routes/galleries.js";
import pictogramsRoutes from "./routes/pictograms.js";
import proxyRoutes from "./routes/proxy.js";

const app = express();

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

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
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/galleries", galleriesRoutes);
app.use("/api/pictograms", pictogramsRoutes);
app.use("/api/proxy", proxyRoutes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
