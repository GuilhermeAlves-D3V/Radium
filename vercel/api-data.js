import { readFileSync } from "node:fs";
import { join } from "node:path";

const dataDir = join(process.cwd(), "apps", "api", "data");

function readJson(fileName) {
  return JSON.parse(readFileSync(join(dataDir, fileName), "utf8"));
}

function getPublicUrl(station) {
  if (process.env.RADIUM_PUBLIC_URL) {
    return process.env.RADIUM_PUBLIC_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return station.publicUrl;
}

export function getStation() {
  const station = readJson("station.json");
  const streamUrl = process.env.RADIUM_STREAM_URL || station.streamUrl;

  return {
    ...station,
    streamUrl,
    publicUrl: getPublicUrl(station),
    demoMode: !streamUrl
  };
}

export function getCatalog() {
  return {
    tracks: readJson("tracks.json"),
    playlists: readJson("playlists.json"),
    programs: readJson("programs.json"),
    schedule: readJson("schedule.json")
  };
}

export function getPrograms() {
  return getCatalog().programs;
}

export function getPlaylists() {
  const { playlists, tracks } = getCatalog();
  const trackMap = new Map(tracks.map((track) => [track.id, track]));

  return playlists.map((playlist) => ({
    ...playlist,
    tracks: playlist.trackIds.map((trackId) => trackMap.get(trackId)).filter(Boolean)
  }));
}

export function getScheduleForDate(dateInput) {
  const station = getStation();
  const date = dateInput ? new Date(`${dateInput}T12:00:00`) : new Date();
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: station.timezone
  })
    .format(date)
    .toLowerCase();

  const { playlists, programs, schedule } = getCatalog();
  const programMap = new Map(programs.map((program) => [program.id, program]));
  const playlistMap = new Map(playlists.map((playlist) => [playlist.id, playlist]));

  return {
    date: date.toISOString().slice(0, 10),
    day,
    blocks: schedule
      .filter((block) => block.days.includes(day))
      .map((block) => ({
        ...block,
        program: programMap.get(block.programId),
        playlist: playlistMap.get(block.playlistId)
      }))
      .filter((block) => block.program && block.playlist)
      .sort((a, b) => a.start.localeCompare(b.start))
  };
}

export function getNowPlaying(now = new Date()) {
  const station = getStation();
  const { tracks } = getCatalog();

  if (tracks.length === 0) {
    throw new Error("No tracks configured");
  }

  const cycleSeconds = tracks.reduce((total, track) => total + track.durationSeconds, 0);
  const currentSecond = Math.floor(now.getTime() / 1000);
  const offset = currentSecond % cycleSeconds;
  let cursor = 0;
  let index = 0;

  for (const [i, track] of tracks.entries()) {
    if (offset < cursor + track.durationSeconds) {
      index = i;
      break;
    }

    cursor += track.durationSeconds;
  }

  const track = tracks[index] ?? tracks[0];
  const nextTrack = tracks[(index + 1) % tracks.length] ?? track;
  const progressSeconds = offset - cursor;
  const startedAt = new Date((currentSecond - progressSeconds) * 1000);
  const endsAt = new Date(startedAt.getTime() + track.durationSeconds * 1000);

  return {
    stationId: station.id,
    generatedAt: now.toISOString(),
    streamUrl: station.streamUrl,
    demoMode: station.demoMode,
    track,
    nextTrack,
    progressSeconds,
    durationSeconds: track.durationSeconds,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString()
  };
}

export function json(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(status).json(payload);
}

export function handleOptions(req, res) {
  if (req.method !== "OPTIONS") {
    return false;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(204).end();
  return true;
}

