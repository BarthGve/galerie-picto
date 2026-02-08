export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  github: {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    allowedUsername: process.env.GITHUB_ALLOWED_USERNAME || "",
  },

  minio: {
    endpoint: process.env.MINIO_ENDPOINT || "",
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || "",
    bucket: process.env.MINIO_BUCKET || "media",
    prefix: process.env.MINIO_PREFIX || "artwork/pictograms/",
  },
};
