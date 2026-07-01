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
import {
  addSuggestion,
  approveSuggestion,
  clearPartyState,
  getPartySnapshot,
  isAdminPinValid,
  skipCurrentAzuraCastTrack,
  updateQueueItem
} from "./partyStore.js";

const listenerEventSchema = z.object({
  type: z.enum(["play", "pause", "heartbeat", "install", "error"]),
  at: z.string().datetime().optional(),
  sessionId: z.string().min(1).max(120).optional(),
  payload: z.record(z.string(), z.unknown()).optional()
});

const suggestionSchema = z.object({
  title: z.string().trim().min(2).max(120),
  artist: z.string().trim().max(120).optional(),
  requestedBy: z.string().trim().max(80).optional(),
  note: z.string().trim().max(160).optional()
});

const adminActionSchema = z.object({
  action: z.enum(["up", "down", "top", "skip", "played", "reject"])
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

app.get("/api/party", async () => {
  const nowPlaying = await getNowPlaying();
  const party = await getPartySnapshot(nowPlaying);

  return {
    nowPlaying,
    party
  };
});

app.post("/api/suggestions", async (request, reply) => {
  const parsed = suggestionSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.code(400).send({
      error: "invalid_suggestion",
      issues: parsed.error.issues
    });
  }

  const result = await addSuggestion(parsed.data);
  return reply.code(201).send(result);
});

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
  const party = await getPartySnapshot(nowPlaying);

  return {
    station,
    nowPlaying,
    party,
    schedule,
    programs,
    playlists
  };
});

function requireAdmin(request: { headers: Record<string, unknown> }) {
  const pin = request.headers["x-radium-admin"];
  return isAdminPinValid(Array.isArray(pin) ? pin[0] : String(pin ?? ""));
}

app.post<{
  Params: {
    id: string;
  };
}>("/api/admin/suggestions/:id/approve", async (request, reply) => {
  if (!requireAdmin(request)) {
    return reply.code(401).send({ error: "admin_pin_required" });
  }

  try {
    return await approveSuggestion(request.params.id);
  } catch {
    return reply.code(404).send({ error: "request_not_found" });
  }
});

app.post<{
  Params: {
    id: string;
  };
}>("/api/admin/queue/:id", async (request, reply) => {
  if (!requireAdmin(request)) {
    return reply.code(401).send({ error: "admin_pin_required" });
  }

  const parsed = adminActionSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.code(400).send({
      error: "invalid_admin_action",
      issues: parsed.error.issues
    });
  }

  try {
    return await updateQueueItem(request.params.id, parsed.data.action);
  } catch {
    return reply.code(404).send({ error: "request_not_found" });
  }
});

app.post("/api/admin/skip", async (request, reply) => {
  if (!requireAdmin(request)) {
    return reply.code(401).send({ error: "admin_pin_required" });
  }

  try {
    await skipCurrentAzuraCastTrack();
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "azuracast_skip_failed";
    return reply.code(409).send({
      error: message
    });
  }
});

app.post("/api/admin/clear-party", async (request, reply) => {
  if (!requireAdmin(request)) {
    return reply.code(401).send({ error: "admin_pin_required" });
  }

  await clearPartyState();
  return { ok: true };
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
