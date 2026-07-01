import {
  getNowPlaying,
  getPlaylists,
  getPrograms,
  getScheduleForDate,
  getStation,
  handleOptions,
  json
} from "../vercel/api-data.js";

export default function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    json(res, 405, { error: "method_not_allowed" });
    return;
  }

  json(res, 200, {
    station: getStation(),
    nowPlaying: getNowPlaying(),
    schedule: getScheduleForDate(),
    programs: getPrograms(),
    playlists: getPlaylists()
  });
}

