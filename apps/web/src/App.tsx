import {
  ArrowDown,
  ArrowUp,
  Check,
  Disc3,
  Headphones,
  Lock,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Send,
  SkipForward,
  Trash2,
  Volume2,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  addSuggestion,
  approveSuggestion,
  clearParty,
  getBootstrap,
  getParty,
  sendListenerEvent,
  skipLiveTrack,
  updateQueueItem
} from "./api";
import type { BootstrapPayload, NowPlaying, PartySnapshot, Station } from "./types";

type SuggestionForm = {
  title: string;
  artist: string;
  requestedBy: string;
  note: string;
};

const initialForm: SuggestionForm = {
  title: "",
  artist: "",
  requestedBy: "",
  note: ""
};

export function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [party, setParty] = useState<PartySnapshot | null>(null);
  const [form, setForm] = useState<SuggestionForm>(initialForm);
  const [adminPin, setAdminPin] = useState(() => window.localStorage.getItem("radium_admin_pin") ?? "");
  const [adminOpen, setAdminOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.82);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamUrl = nowPlaying?.streamUrl || station?.streamUrl || station?.fallbackStreamUrl || "";
  const progress = nowPlaying
    ? Math.min(100, Math.max(0, (nowPlaying.progressSeconds / nowPlaying.durationSeconds) * 100))
    : 0;
  const queuedCount = party?.upNext.filter((item) => item.source === "party").length ?? 0;
  const pendingCount = party?.suggestions.length ?? 0;

  const deckBars = useMemo(() => Array.from({ length: 24 }, (_, index) => 18 + ((index * 17) % 70)), []);

  useEffect(() => {
    void loadBootstrap();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshParty(false);
    }, 7000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  async function loadBootstrap() {
    setRefreshing(true);
    setError(null);

    try {
      const payload: BootstrapPayload = await getBootstrap();
      setStation(payload.station);
      setNowPlaying(payload.nowPlaying);
      setParty(payload.party);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar a festa.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshParty(showSpinner = true) {
    if (showSpinner) {
      setRefreshing(true);
    }

    try {
      const payload = await getParty();
      setNowPlaying(payload.nowPlaying);
      setParty(payload.party);
    } catch {
      // Keep the current party state during transient network drops.
    } finally {
      setRefreshing(false);
    }
  }

  async function togglePlayback() {
    if (!audioRef.current || !streamUrl) {
      return;
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      void sendListenerEvent("pause", { trackId: nowPlaying?.track.id }).catch(() => undefined);
      return;
    }

    try {
      await audioRef.current.play();
      setPlaying(true);
      void sendListenerEvent("play", { trackId: nowPlaying?.track.id }).catch(() => undefined);
    } catch {
      setError("Nao consegui tocar o stream neste dispositivo.");
    }
  }

  async function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await addSuggestion(form);
      setForm({
        ...initialForm,
        requestedBy: form.requestedBy
      });
      setNotice("Pedido enviado para o deck.");
      await refreshParty(false);
    } catch {
      setError("Preenche pelo menos o nome da musica.");
    } finally {
      setSubmitting(false);
    }
  }

  function saveAdminPin(value: string) {
    setAdminPin(value);
    window.localStorage.setItem("radium_admin_pin", value);
  }

  async function runAdminAction(action: () => Promise<unknown>, success: string) {
    setError(null);
    setNotice(null);

    try {
      await action();
      setNotice(success);
      await refreshParty(false);
    } catch {
      setError("Acao admin falhou. Confirma o PIN e, para skip real, a API key do AzuraCast.");
    }
  }

  return (
    <div className="party-shell">
      <audio ref={audioRef} src={streamUrl || undefined} preload="none" />

      <header className="party-header">
        <div className="party-brand">
          <span className="brand-disc">
            <Disc3 size={25} />
          </span>
          <div>
            <p>House Party Radio</p>
            <h1>{station?.name ?? "Radium"}</h1>
          </div>
        </div>

        <button className="ghost-button" type="button" onClick={() => void refreshParty()} disabled={refreshing}>
          <RefreshCw size={18} className={refreshing ? "spin" : undefined} />
          Sync
        </button>
      </header>

      <main className="party-grid">
        <section className="deck-hero">
          <img src="/assets/radium-deck.png" alt="" />
          <div className="deck-overlay">
            <div className="live-chip">
              <Radio size={16} />
              {streamUrl ? "Local stream" : "Offline"}
            </div>

            <div className="now-card">
              <p className="kicker">Now playing</p>
              <h2>{nowPlaying?.track.title ?? "A ligar ao deck"}</h2>
              <p>{nowPlaying?.track.artist || "Radium"}</p>
              <div className="progress-bar">
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="time-row">
                <span>{formatSeconds(nowPlaying?.progressSeconds ?? 0)}</span>
                <span>{formatSeconds(nowPlaying?.durationSeconds ?? 0)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="control-surface">
          <div className="transport-row">
            <button
              className="play-button"
              type="button"
              onClick={() => void togglePlayback()}
              disabled={!streamUrl || loading}
              aria-label={playing ? "Pausar" : "Tocar"}
            >
              {playing ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
            </button>
            <label className="volume-control">
              <Volume2 size={18} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="Volume"
              />
            </label>
          </div>

          <div className="deck-meter" aria-hidden="true">
            {deckBars.map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>

          <div className="deck-stats">
            <Stat label="Na fila" value={String(queuedCount)} />
            <Stat label="Pedidos" value={String(pendingCount)} />
            <Stat label="Controlo" value={party?.canControlAzuraCast ? "API" : "Local"} />
          </div>
        </section>

        <section className="panel up-next-panel">
          <PanelHeading icon={<Headphones size={18} />} title="Proximas 5" />
          <div className="up-next-list">
            {(party?.upNext ?? []).length > 0 ? (
              party?.upNext.map((item, index) => (
                <article className="queue-row" key={`${item.source}-${item.id}-${index}`}>
                  <span className="queue-index">{index + 1}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>
                      {item.artist}
                      {item.requestedBy ? ` - pedido por ${item.requestedBy}` : ""}
                    </p>
                  </div>
                  <span className={`source-pill source-${item.source}`}>{item.source === "party" ? "pedido" : "auto"}</span>
                </article>
              ))
            ) : (
              <p className="empty-state">Ainda nao ha fila. Pede a primeira musica.</p>
            )}
          </div>
        </section>

        <section className="panel request-panel">
          <PanelHeading icon={<Plus size={18} />} title="Pedir musica" />
          <form className="request-form" onSubmit={(event) => void submitSuggestion(event)}>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Musica"
              maxLength={120}
              required
            />
            <input
              value={form.artist}
              onChange={(event) => setForm((current) => ({ ...current, artist: event.target.value }))}
              placeholder="Artista"
              maxLength={120}
            />
            <input
              value={form.requestedBy}
              onChange={(event) => setForm((current) => ({ ...current, requestedBy: event.target.value }))}
              placeholder="O teu nome"
              maxLength={80}
            />
            <button className="primary-button" type="submit" disabled={submitting}>
              <Send size={18} />
              Enviar
            </button>
          </form>
          {notice ? <p className="notice-line">{notice}</p> : null}
          {error ? <p className="error-line">{error}</p> : null}
        </section>

        <section className="panel admin-panel">
          <button className="admin-toggle" type="button" onClick={() => setAdminOpen((open) => !open)}>
            <Lock size={18} />
            Admin deck
          </button>

          {adminOpen ? (
            <div className="admin-content">
              <input
                value={adminPin}
                onChange={(event) => saveAdminPin(event.target.value)}
                placeholder="PIN admin"
                type="password"
                inputMode="numeric"
              />

              <div className="admin-actions">
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => void runAdminAction(() => skipLiveTrack(adminPin), "Skip enviado ao AzuraCast.")}
                >
                  <SkipForward size={17} />
                  Skip live
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => void runAdminAction(() => clearParty(adminPin), "Fila de festa limpa.")}
                >
                  <RotateCcw size={17} />
                  Limpar
                </button>
              </div>

              <div className="admin-columns">
                <div>
                  <h3>Pedidos novos</h3>
                  {(party?.suggestions ?? []).length > 0 ? (
                    party?.suggestions.map((request) => (
                      <AdminRequestRow
                        key={request.id}
                        title={request.title}
                        subtitle={`${request.artist} - ${request.requestedBy}`}
                        actions={
                          <>
                            <button
                              type="button"
                              title="Aprovar"
                              onClick={() =>
                                void runAdminAction(() => approveSuggestion(request.id, adminPin), "Pedido entrou na fila.")
                              }
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              title="Rejeitar"
                              onClick={() =>
                                void runAdminAction(
                                  () => updateQueueItem(request.id, "reject", adminPin),
                                  "Pedido rejeitado."
                                )
                              }
                            >
                              <X size={16} />
                            </button>
                          </>
                        }
                      />
                    ))
                  ) : (
                    <p className="empty-state">Sem pedidos novos.</p>
                  )}
                </div>

                <div>
                  <h3>Fila social</h3>
                  {(party?.upNext.filter((item) => item.source === "party") ?? []).length > 0 ? (
                    party?.upNext
                      .filter((item) => item.source === "party")
                      .map((item) => (
                        <AdminRequestRow
                          key={item.id}
                          title={item.title}
                          subtitle={`${item.artist}${item.requestedBy ? ` - ${item.requestedBy}` : ""}`}
                          actions={
                            <>
                              <button
                                type="button"
                                title="Subir"
                                onClick={() =>
                                  void runAdminAction(() => updateQueueItem(item.id, "up", adminPin), "Fila atualizada.")
                                }
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                type="button"
                                title="Descer"
                                onClick={() =>
                                  void runAdminAction(() => updateQueueItem(item.id, "down", adminPin), "Fila atualizada.")
                                }
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button
                                type="button"
                                title="Marcar como tocada"
                                onClick={() =>
                                  void runAdminAction(
                                    () => updateQueueItem(item.id, "played", adminPin),
                                    "Marcado como tocado."
                                  )
                                }
                              >
                                <Check size={16} />
                              </button>
                              <button
                                type="button"
                                title="Remover"
                                onClick={() =>
                                  void runAdminAction(() => updateQueueItem(item.id, "skip", adminPin), "Pedido removido.")
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          }
                        />
                      ))
                  ) : (
                    <p className="empty-state">A fila social esta vazia.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function PanelHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="panel-heading">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdminRequestRow({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle: string;
  actions: ReactNode;
}) {
  return (
    <article className="admin-row">
      <div>
        <h4>{title}</h4>
        <p>{subtitle}</p>
      </div>
      <div className="mini-actions">{actions}</div>
    </article>
  );
}

function formatSeconds(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
