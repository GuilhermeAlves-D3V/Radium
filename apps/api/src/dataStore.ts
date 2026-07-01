import { appendFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type {
  DayOfWeek,
  EnrichedScheduleBlock,
  ListenerEvent,
  NowPlaying,
  Playlist,
  Program,
  ScheduleBlock,
  StationConfig,
  Track
} from "./types.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");

type AzuraCastSong = {
  id?: string;
  text?: string;
  artist?: string;
  title?: string;
  album?: string;
  genre?: string;
  art?: string;
};

type AzuraCastNowPlaying = {
  station?: {
    id?: number;
    name?: string;
    listen_url?: string;
    description?: string;
    timezone?: string;
  };
  listeners?: {
    current?: number;
    total?: number;
    unique?: number;
  };
  now_playing?: {
    played_at?: number;
    duration?: number;
    playlist?: string;
    elapsed?: number;
    remaining?: number;
    song?: AzuraCastSong;
  };
  playing_next?: {
    duration?: number;
    playlist?: string;
    song?: AzuraCastSong;
  };
  is_online?: boolean;
};

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
] as const;

async function readJson<T>(fileName: string): Promise<T> {
  const content = await readFile(join(dataDir, fileName), "utf8");
  return JSON.parse(content) as T;
}

async function getAzuraCastNowPlaying(): Promise<AzuraCastNowPlaying | null> {
  const url = process.env.AZURACAST_NOW_PLAYING_URL;

  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2500)
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AzuraCastNowPlaying;
  } catch {
    return null;
  }
}

function azuraSongToTrack(song: AzuraCastSong | undefined, durationSeconds: number, fallback: Track): Track {
  if (!song) {
    return fallback;
  }

  return {
    id: song.id || fallback.id,
    title: song.title || song.text || fallback.title,
    artist: song.artist || "Radium",
    album: song.album || fallback.album,
    durationSeconds: Math.max(1, Math.round(durationSeconds || fallback.durationSeconds)),
    genre: song.genre || fallback.genre,
    energy: fallback.energy,
    mood: fallback.mood,
    source: "azuracast"
  };
}

export async function getStation(): Promise<StationConfig & { demoMode: boolean }> {
  const station = await readJson<StationConfig>("station.json");
  const azuraCast = await getAzuraCastNowPlaying();
  const streamUrl = process.env.RADIUM_STREAM_URL || azuraCast?.station?.listen_url || station.streamUrl;
  const publicUrl = process.env.RADIUM_PUBLIC_URL || station.publicUrl;

  return {
    ...station,
    description: azuraCast?.station?.description || station.description,
    streamUrl,
    publicUrl,
    status: azuraCast?.is_online ? "online" : station.status,
    demoMode: !streamUrl || !azuraCast?.is_online
  };
}

export function getDayOfWeek(date: Date, timezone: string): DayOfWeek {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: timezone
  })
    .format(date)
    .toLowerCase();

  return weekday as DayOfWeek;
}

export async function getCatalog() {
  const [tracks, playlists, programs, schedule] = await Promise.all([
    readJson<Track[]>("tracks.json"),
    readJson<Playlist[]>("playlists.json"),
    readJson<Program[]>("programs.json"),
    readJson<ScheduleBlock[]>("schedule.json")
  ]);

  return { tracks, playlists, programs, schedule };
}

export async function getPrograms(): Promise<Program[]> {
  const { programs } = await getCatalog();
  return programs;
}

export async function getPlaylists(): Promise<(Playlist & { tracks: Track[] })[]> {
  const { playlists, tracks } = await getCatalog();
  const trackMap = new Map(tracks.map((track) => [track.id, track]));

  return playlists.map((playlist) => ({
    ...playlist,
    tracks: playlist.trackIds
      .map((trackId) => trackMap.get(trackId))
      .filter((track): track is Track => Boolean(track))
  }));
}

export async function getScheduleForDate(dateInput?: string): Promise<{
  date: string;
  day: DayOfWeek;
  blocks: EnrichedScheduleBlock[];
}> {
  const station = await getStation();
  const date = dateInput ? new Date(`${dateInput}T12:00:00`) : new Date();
  const day = getDayOfWeek(date, station.timezone);
  const { playlists, programs, schedule } = await getCatalog();
  const programMap = new Map(programs.map((program) => [program.id, program]));
  const playlistMap = new Map(playlists.map((playlist) => [playlist.id, playlist]));

  const blocks = schedule
    .filter((block) => block.days.includes(day))
    .map((block) => {
      const program = programMap.get(block.programId);
      const playlist = playlistMap.get(block.playlistId);

      if (!program || !playlist) {
        throw new Error(`Invalid schedule block: ${block.id}`);
      }

      return { ...block, program, playlist };
    })
    .sort((a, b) => a.start.localeCompare(b.start));

  return {
    date: date.toISOString().slice(0, 10),
    day,
    blocks
  };
}

export async function getNowPlaying(now = new Date()): Promise<NowPlaying> {
  const station = await getStation();
  const { tracks } = await getCatalog();

  if (tracks.length === 0) {
    throw new Error("No tracks configured");
  }

  const fallbackTrack = tracks[0] as Track;
  const azuraCast = await getAzuraCastNowPlaying();

  if (azuraCast?.now_playing?.song) {
    const durationSeconds = Math.max(1, Math.round(azuraCast.now_playing.duration || fallbackTrack.durationSeconds));
    const progressSeconds = Math.min(
      durationSeconds,
      Math.max(0, Math.round(azuraCast.now_playing.elapsed || 0))
    );
    const startedAt = azuraCast.now_playing.played_at
      ? new Date(azuraCast.now_playing.played_at * 1000)
      : new Date(now.getTime() - progressSeconds * 1000);
    const track = azuraSongToTrack(azuraCast.now_playing.song, durationSeconds, fallbackTrack);
    const nextTrack = azuraSongToTrack(
      azuraCast.playing_next?.song,
      Math.round(azuraCast.playing_next?.duration || fallbackTrack.durationSeconds),
      fallbackTrack
    );

    return {
      stationId: station.id,
      generatedAt: now.toISOString(),
      streamUrl: station.streamUrl,
      demoMode: !station.streamUrl || !azuraCast.is_online,
      track,
      nextTrack,
      progressSeconds,
      durationSeconds,
      startedAt: startedAt.toISOString(),
      endsAt: new Date(startedAt.getTime() + durationSeconds * 1000).toISOString()
    };
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

  const track = tracks[index] ?? fallbackTrack;
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

export async function appendListenerEvent(event: ListenerEvent): Promise<{
  id: string;
  savedAt: string;
}> {
  const savedAt = new Date().toISOString();
  const payload = {
    id: randomUUID(),
    savedAt,
    ...event,
    at: event.at ?? savedAt
  };

  await appendFile(join(dataDir, "listener-events.jsonl"), `${JSON.stringify(payload)}\n`, "utf8");

  return {
    id: payload.id,
    savedAt
  };
}

export function allWeekdays(): readonly (typeof weekdays)[number][] {
  return weekdays;
}
