export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  github: {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    allowedUsername: process.env.GITHUB_ALLOWED_USERNAME || "",
    repo: process.env.GITHUB_REPO || "",
  },

  minio: {
    endpoint: process.env.MINIO_ENDPOINT || "",
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || "",
    bucket: process.env.MINIO_BUCKET || "media",
    prefix: process.env.MINIO_PREFIX || "artwork/dev/",
  },
};

// Validate required env vars at startup
const required = [
  ["GITHUB_CLIENT_ID", config.github.clientId],
  ["GITHUB_CLIENT_SECRET", config.github.clientSecret],
  ["MINIO_ENDPOINT", config.minio.endpoint],
  ["MINIO_ACCESS_KEY", config.minio.accessKey],
  ["MINIO_SECRET_KEY", config.minio.secretKey],
] as const;

const missing = required.filter(([, value]) => !value).map(([name]) => name);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}
