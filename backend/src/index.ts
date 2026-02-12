import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js";
import galleriesRoutes from "./routes/galleries.js";
import pictogramsRoutes from "./routes/pictograms.js";
import proxyRoutes from "./routes/proxy.js";
import { configureBucketCors } from "./services/minio.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());

// No-cache for API responses
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
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

app.listen(config.port, async () => {
  console.log(`Server running on port ${config.port}`);

  try {
    const origins = config.corsOrigin.split(",").map((o) => o.trim());
    await configureBucketCors(origins);
    console.log("Minio bucket CORS configured for:", origins);
  } catch (err) {
    console.warn("Failed to configure Minio bucket CORS:", err);
  }
});
