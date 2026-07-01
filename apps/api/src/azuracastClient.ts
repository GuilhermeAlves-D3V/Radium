import { config } from "./config.js";

type AzuraCastQueueSong = {
  id?: string;
  text?: string;
  artist?: string;
  title?: string;
};

type AzuraCastQueueItem = {
  id?: number;
  timestamp_cued?: number;
  cued_at?: number;
  media?: {
    id?: number;
    song_id?: string;
    artist?: string;
    title?: string;
  };
  song?: AzuraCastQueueSong;
  links?: {
    self?: string;
  };
};

function stationApiUrl(path: string) {
  const base = config.azuraCastBaseUrl.replace(/\/$/, "");
  const stationId = encodeURIComponent(config.azuraCastStationId);
  return `${base}/api/station/${stationId}${path}`;
}

async function azuraCastRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!config.azuraCastApiKey) {
    throw new Error("azuracast_api_key_missing");
  }

  const response = await fetch(stationApiUrl(path), {
    ...init,
    headers: {
      "X-API-Key": config.azuraCastApiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`azuracast_${response.status}`);
  }

  return (await response.json()) as T;
}

export function canControlAzuraCast() {
  return Boolean(config.azuraCastApiKey);
}

export async function skipAzuraCastTrack() {
  return azuraCastRequest<Record<string, unknown>>("/backend/skip", {
    method: "POST"
  });
}

export async function getAzuraCastQueue(limit = 5) {
  if (!canControlAzuraCast()) {
    return [];
  }

  const items = await azuraCastRequest<AzuraCastQueueItem[]>("/queue");

  return items.slice(0, limit).map((item, index) => {
    const title = item.media?.title || item.song?.title || item.song?.text || "Queued track";
    const artist = item.media?.artist || item.song?.artist || "Radium";

    return {
      id: String(item.id ?? queueIdFromLink(item.links?.self) ?? item.song?.id ?? `azuracast-${index}`),
      title,
      artist,
      source: "azuracast" as const,
      position: index
    };
  });
}

function queueIdFromLink(link: string | undefined) {
  const match = link?.match(/\/queue\/([^/?#]+)$/);
  return match?.[1];
}
