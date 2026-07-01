import type { BootstrapPayload, NowPlaying } from "./types";

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
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function getBootstrap(): Promise<BootstrapPayload> {
  return request<BootstrapPayload>("/api/bootstrap");
}

export function getNowPlaying(): Promise<NowPlaying> {
  return request<NowPlaying>("/api/now-playing");
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

