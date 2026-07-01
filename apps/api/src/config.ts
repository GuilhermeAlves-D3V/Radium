import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4100),
  host: process.env.HOST ?? "0.0.0.0",
  logLevel: process.env.LOG_LEVEL ?? "info",
  corsOrigin: process.env.CORS_ORIGIN,
  streamUrl: process.env.RADIUM_STREAM_URL ?? "",
  publicUrl: process.env.RADIUM_PUBLIC_URL ?? ""
};

