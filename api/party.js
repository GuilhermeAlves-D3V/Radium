import { getNowPlaying, getPartySnapshot, handleOptions, json } from "../vercel/api-data.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    json(res, 405, { error: "method_not_allowed" });
    return;
  }

  const nowPlaying = await getNowPlaying();

  json(res, 200, {
    nowPlaying,
    party: getPartySnapshot(nowPlaying)
  });
}
