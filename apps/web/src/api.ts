import type { BootstrapPayload, NowPlaying, PartyPayload, PartyRequest } from "./types";

const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status} ${response.statusText}`;

    try {
      const payload = (await response.json()) as { error?: string; message?: string };
      message = payload.message || payload.error || message;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getBootstrap(): Promise<BootstrapPayload> {
  return request<BootstrapPayload>("/api/bootstrap");
}

export function getNowPlaying(): Promise<NowPlaying> {
  return request<NowPlaying>("/api/now-playing");
}

export function getParty(): Promise<PartyPayload> {
  return request<PartyPayload>("/api/party");
}

export function addSuggestion(input: {
  title: string;
  artist?: string;
  requestedBy?: string;
  note?: string;
}): Promise<PartyRequest> {
  return request<PartyRequest>("/api/suggestions", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function verifyAdminPin(pin: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/admin/session", {
    headers: {
      "X-Radium-Admin": pin
    }
  });
}

export function approveSuggestion(id: string, pin: string): Promise<PartyRequest> {
  return request<PartyRequest>(`/api/admin/suggestions/${id}/approve`, {
    method: "POST",
    headers: {
      "X-Radium-Admin": pin
    },
    body: "{}"
  });
}

export function updateQueueItem(
  id: string,
  action: "up" | "down" | "top" | "skip" | "played" | "reject",
  pin: string
): Promise<PartyRequest> {
  return request<PartyRequest>(`/api/admin/queue/${id}`, {
    method: "POST",
    headers: {
      "X-Radium-Admin": pin
    },
    body: JSON.stringify({ action })
  });
}

export function skipLiveTrack(pin: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/admin/skip", {
    method: "POST",
    headers: {
      "X-Radium-Admin": pin
    },
    body: "{}"
  });
}

export function clearParty(pin: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/admin/clear-party", {
    method: "POST",
    headers: {
      "X-Radium-Admin": pin
    },
    body: "{}"
  });
}

export function sendListenerEvent(
  type: "play" | "pause" | "heartbeat" | "install" | "error",
  payload?: Record<string, unknown>
): Promise<{ id: string; savedAt: string }> {
  return request("/api/listener-events", {
    method: "POST",
    keepalive: true,
    body: JSON.stringify({
      type,
      at: new Date().toISOString(),
      sessionId: getSessionId(),
      payload
    })
  });
}

function getSessionId(): string {
  const key = "radium_session_id";
  const existing = window.localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(key, sessionId);
  return sessionId;
}
