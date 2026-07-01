import { randomUUID } from "node:crypto";
import { handleOptions, json } from "../vercel/api-data.js";

const allowedTypes = new Set(["play", "pause", "heartbeat", "install", "error"]);

export default function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "method_not_allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  if (!allowedTypes.has(body.type)) {
    json(res, 400, { error: "invalid_listener_event" });
    return;
  }

  json(res, 202, {
    id: randomUUID(),
    savedAt: new Date().toISOString()
  });
}

