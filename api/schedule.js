import { getScheduleForDate, handleOptions, json } from "../vercel/api-data.js";

export default function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    json(res, 405, { error: "method_not_allowed" });
    return;
  }

  const date = Array.isArray(req.query.date) ? req.query.date[0] : req.query.date;
  json(res, 200, getScheduleForDate(date));
}

