import express from "express";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js";
import galleriesRoutes from "./routes/galleries.js";
import proxyRoutes from "./routes/proxy.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/galleries", galleriesRoutes);
app.use("/api/proxy", proxyRoutes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
