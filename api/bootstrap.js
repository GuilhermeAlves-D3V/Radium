import {
  getNowPlaying,
  getPartySnapshot,
  getPlaylists,
  getPrograms,
  getScheduleForDate,
  getStation,
  handleOptions,
  json
} from "../vercel/api-data.js";

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
    station: getStation(),
    nowPlaying,
    party: getPartySnapshot(nowPlaying),
    schedule: getScheduleForDate(),
    programs: getPrograms(),
    playlists: getPlaylists()
  });
}
