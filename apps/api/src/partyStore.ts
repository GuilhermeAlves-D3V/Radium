import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { canControlAzuraCast, getAzuraCastQueue, skipAzuraCastTrack } from "./azuracastClient.js";
import { config } from "./config.js";
import type { NowPlaying, PartyRequest, PartySnapshot, PartyState, PartyUpNextItem } from "./types.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");
const partyFile = join(dataDir, "party-queue.json");

const initialState: PartyState = {
  requests: [],
  updatedAt: new Date(0).toISOString()
};

async function readPartyState(): Promise<PartyState> {
  try {
    const content = await readFile(partyFile, "utf8");
    return JSON.parse(content) as PartyState;
  } catch {
    return initialState;
  }
}

async function writePartyState(state: PartyState) {
  await mkdir(dataDir, { recursive: true });
  const payload = JSON.stringify(
    {
      ...state,
      updatedAt: new Date().toISOString()
    },
    null,
    2
  );
  const tempFile = `${partyFile}.tmp`;
  await writeFile(tempFile, payload, "utf8");
  await rename(tempFile, partyFile);
}

function normalize(value: unknown, fallback = "") {
  return String(value ?? fallback)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function queuedRequests(state: PartyState) {
  return state.requests
    .filter((request) => request.status === "queued")
    .sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
}

function suggestedRequests(state: PartyState) {
  return state.requests
    .filter((request) => request.status === "suggested")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function recentRequests(state: PartyState) {
  return state.requests
    .filter((request) => ["played", "skipped", "rejected"].includes(request.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);
}

function nextPosition(state: PartyState) {
  const positions = queuedRequests(state).map((request) => request.position);
  return positions.length > 0 ? Math.max(...positions) + 1 : 0;
}

function resequenceQueue(state: PartyState) {
  queuedRequests(state).forEach((request, index) => {
    request.position = index;
    request.updatedAt = new Date().toISOString();
  });
}

export function isAdminPinValid(pin: string | undefined) {
  return Boolean(config.adminPin) && pin === config.adminPin;
}

export async function getPartySnapshot(nowPlaying?: NowPlaying): Promise<PartySnapshot> {
  const state = await readPartyState();
  const localQueue = queuedRequests(state);
  const localUpNext: PartyUpNextItem[] = localQueue.map((request, index) => ({
    id: request.id,
    title: request.title,
    artist: request.artist,
    requestedBy: request.requestedBy,
    source: "party",
    position: index
  }));

  let azuraCastUpNext: PartyUpNextItem[] = [];

  try {
    azuraCastUpNext = await getAzuraCastQueue(5);
  } catch {
    azuraCastUpNext = [];
  }

  const fallbackNext = nowPlaying
    ? [
        {
          id: nowPlaying.nextTrack.id,
          title: nowPlaying.nextTrack.title,
          artist: nowPlaying.nextTrack.artist,
          source: "azuracast" as const,
          position: 0
        }
      ]
    : [];

  const upNext = azuraCastUpNext.length > 0 ? azuraCastUpNext : [...localUpNext, ...fallbackNext];

  return {
    upNext: upNext.slice(0, 5),
    queue: localQueue,
    suggestions: suggestedRequests(state),
    recent: recentRequests(state),
    canControlAzuraCast: canControlAzuraCast(),
    adminEnabled: Boolean(config.adminPin)
  };
}

export async function addSuggestion(input: {
  title?: unknown;
  artist?: unknown;
  requestedBy?: unknown;
  note?: unknown;
}) {
  const title = normalize(input.title);

  if (title.length < 2) {
    throw new Error("title_required");
  }

  const state = await readPartyState();
  const now = new Date().toISOString();
  const request: PartyRequest = {
    id: randomUUID(),
    title,
    artist: normalize(input.artist, "Unknown"),
    requestedBy: normalize(input.requestedBy, "Guest") || "Guest",
    note: normalize(input.note),
    status: "suggested",
    createdAt: now,
    updatedAt: now,
    position: 9999
  };

  state.requests.push(request);
  await writePartyState(state);
  return request;
}

export async function approveSuggestion(id: string) {
  const state = await readPartyState();
  const request = state.requests.find((item) => item.id === id);

  if (!request) {
    throw new Error("request_not_found");
  }

  const position = nextPosition(state);
  request.status = "queued";
  request.position = position;
  request.updatedAt = new Date().toISOString();
  resequenceQueue(state);
  await writePartyState(state);
  return request;
}

export async function updateQueueItem(id: string, action: "up" | "down" | "top" | "skip" | "played" | "reject") {
  const state = await readPartyState();
  const request = state.requests.find((item) => item.id === id);

  if (!request) {
    throw new Error("request_not_found");
  }

  const queue = queuedRequests(state);
  const index = queue.findIndex((item) => item.id === id);

  if (action === "up" && index > 0) {
    [queue[index - 1]!.position, queue[index]!.position] = [queue[index]!.position, queue[index - 1]!.position];
  } else if (action === "down" && index >= 0 && index < queue.length - 1) {
    [queue[index + 1]!.position, queue[index]!.position] = [queue[index]!.position, queue[index + 1]!.position];
  } else if (action === "top") {
    request.position = -1;
  } else if (action === "skip") {
    request.status = "skipped";
  } else if (action === "played") {
    request.status = "played";
  } else if (action === "reject") {
    request.status = "rejected";
  }

  request.updatedAt = new Date().toISOString();
  resequenceQueue(state);
  await writePartyState(state);
  return request;
}

export async function clearPartyState() {
  await writePartyState({
    requests: [],
    updatedAt: new Date().toISOString()
  });
}

export async function skipCurrentAzuraCastTrack() {
  return skipAzuraCastTrack();
}
