import { handleOptions, json } from "../vercel/api-data.js";

function readBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body ?? {};
}

export default function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "method_not_allowed" });
    return;
  }

  const body = readBody(req);
  const title = String(body.title ?? "").trim();

  if (title.length < 2) {
    json(res, 400, { error: "title_required" });
    return;
  }

  const now = new Date().toISOString();

  json(res, 201, {
    id: `vercel-${Date.now()}`,
    title,
    artist: String(body.artist ?? "Unknown").trim() || "Unknown",
    requestedBy: String(body.requestedBy ?? "Guest").trim() || "Guest",
    note: String(body.note ?? "").trim(),
    status: "suggested",
    createdAt: now,
    updatedAt: now,
    position: 9999
  });
}
