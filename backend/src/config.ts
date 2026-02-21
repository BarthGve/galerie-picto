const DEV_JWT_SECRET = "dev-jwt-secret-not-for-production";

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwtSecret: (() => {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    if (process.env.NODE_ENV === "production")
      throw new Error("[config] JWT_SECRET is required in production");
    return DEV_JWT_SECRET;
  })(),

  github: {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    allowedUsername: process.env.GITHUB_ALLOWED_USERNAME || "",
    repo: process.env.GITHUB_REPO || "",
  },

  feedback: {
    token: process.env.GITHUB_FEEDBACK_TOKEN || "",
    repo: process.env.GITHUB_FEEDBACK_REPO || "",
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "",
  },

  minio: {
    endpoint: process.env.MINIO_ENDPOINT || "",
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || "",
    bucket: process.env.MINIO_BUCKET || "media",
    prefix: process.env.MINIO_PREFIX || "artwork/dev/",
    privateBucket: process.env.MINIO_PRIVATE_BUCKET || "",
    privatePrefix: process.env.MINIO_PRIVATE_PREFIX || "",
  },
};

const isProd = process.env.NODE_ENV === "production";

// Validate required env vars at startup
const required: [string, string][] = [
  ["GITHUB_CLIENT_ID", config.github.clientId],
  ["GITHUB_CLIENT_SECRET", config.github.clientSecret],
  ["MINIO_ENDPOINT", config.minio.endpoint],
  ["MINIO_ACCESS_KEY", config.minio.accessKey],
  ["MINIO_SECRET_KEY", config.minio.secretKey],
  ["MINIO_PRIVATE_BUCKET", config.minio.privateBucket],
  ["JWT_SECRET", config.jwtSecret],
];

// Production-only requirements
if (isProd) {
  required.push(["CORS_ORIGIN", process.env.CORS_ORIGIN || ""]);
}

const missing = required.filter(([, value]) => !value).map(([name]) => name);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV;
if (nodeEnv !== "development" && nodeEnv !== "production") {
  console.warn(
    `[config] NODE_ENV is "${nodeEnv ?? "undefined"}". Set NODE_ENV=production for production deployments.`,
  );
}

if (isProd) {
  console.info(
    `[config] Starting in production mode — port=${config.port}, cors=${config.corsOrigin}`,
  );
}
