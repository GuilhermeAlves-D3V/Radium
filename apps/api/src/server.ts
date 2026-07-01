import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { config } from "./config.js";
import {
  appendListenerEvent,
  getNowPlaying,
  getPlaylists,
  getPrograms,
  getScheduleForDate,
  getStation
} from "./dataStore.js";

const listenerEventSchema = z.object({
  type: z.enum(["play", "pause", "heartbeat", "install", "error"]),
  at: z.string().datetime().optional(),
  sessionId: z.string().min(1).max(120).optional(),
  payload: z.record(z.string(), z.unknown()).optional()
});

const app = Fastify({
  logger: {
    level: config.logLevel
  }
});

await app.register(fastifyCors, {
  origin: config.corsOrigin ? config.corsOrigin.split(",") : true
});

app.get("/health", async () => ({
  ok: true,
  service: "radium-api",
  time: new Date().toISOString()
}));

app.get("/api/station", async () => getStation());

app.get("/api/now-playing", async () => getNowPlaying());

app.get("/api/programs", async () => getPrograms());

app.get("/api/playlists", async () => getPlaylists());

app.get<{
  Querystring: {
    date?: string;
  };
}>("/api/schedule", async (request) => getScheduleForDate(request.query.date));

app.get("/api/bootstrap", async () => {
  const [station, nowPlaying, schedule, programs, playlists] = await Promise.all([
    getStation(),
    getNowPlaying(),
    getScheduleForDate(),
    getPrograms(),
    getPlaylists()
  ]);

  return {
    station,
    nowPlaying,
    schedule,
    programs,
    playlists
  };
});

app.post("/api/listener-events", async (request, reply) => {
  const parsed = listenerEventSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.code(400).send({
      error: "invalid_listener_event",
      issues: parsed.error.issues
    });
  }

  const result = await appendListenerEvent(parsed.data);
  return reply.code(202).send(result);
});

const here = dirname(fileURLToPath(import.meta.url));
const webDist = resolve(here, "..", "..", "web", "dist");

if (existsSync(join(webDist, "index.html"))) {
  await app.register(fastifyStatic, {
    root: webDist,
    prefix: "/",
    wildcard: false
  });

  app.setNotFoundHandler((request, reply) => {
    const url = request.raw.url ?? "";

    if (url.startsWith("/api/") || url === "/health") {
      return reply.code(404).send({ error: "not_found" });
    }

    return reply.sendFile("index.html");
  });
}

try {
  await app.listen({
    port: config.port,
    host: config.host
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

