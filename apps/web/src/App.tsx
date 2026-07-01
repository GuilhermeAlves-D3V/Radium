import {
  Activity,
  CalendarDays,
  Download,
  ListMusic,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Signal,
  SlidersHorizontal,
  Volume2,
  WifiOff
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getBootstrap, getNowPlaying, sendListenerEvent } from "./api";
import type {
  BootstrapPayload,
  NowPlaying,
  Playlist,
  Program,
  Schedule,
  ScheduleBlock,
  Station
} from "./types";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const dayLabels: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terca",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sabado",
  sunday: "Domingo"
};

const meterBars = [28, 54, 42, 76, 48, 64, 36, 88, 52, 70, 44, 60, 32, 82, 46, 66, 38, 72];

export function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.78);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const streamUrl = nowPlaying?.streamUrl || station?.streamUrl || station?.fallbackStreamUrl || "";
  const progress = nowPlaying
    ? Math.min(100, Math.max(0, (nowPlaying.progressSeconds / nowPlaying.durationSeconds) * 100))
    : 0;

  const currentBlock = useMemo(() => {
    if (!schedule) {
      return null;
    }

    return findCurrentBlock(schedule.blocks);
  }, [schedule]);

  const libraryStats = useMemo(() => {
    const tracks = new Map<string, number>();

    for (const playlist of playlists) {
      for (const track of playlist.tracks) {
        tracks.set(track.id, track.durationSeconds);
      }
    }

    const minutes = Math.round(
      Array.from(tracks.values()).reduce((total, duration) => total + duration, 0) / 60
    );

    return {
      tracks: tracks.size,
      minutes
    };
  }, [playlists]);

  useEffect(() => {
    void loadBootstrap();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      getNowPlaying()
        .then(setNowPlaying)
        .catch(() => undefined);
    }, 10_000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }

    const id = window.setInterval(() => {
      void sendListenerEvent("heartbeat", {
        trackId: nowPlaying?.track.id
      }).catch(() => undefined);
    }, 60_000);

    return () => window.clearInterval(id);
  }, [nowPlaying?.track.id, playing]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  async function loadBootstrap() {
    setRefreshing(true);
    setError(null);

    try {
      const payload: BootstrapPayload = await getBootstrap();
      setStation(payload.station);
      setNowPlaying(payload.nowPlaying);
      setSchedule(payload.schedule);
      setPrograms(payload.programs);
      setPlaylists(payload.playlists);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Falha ao carregar a Radium.";
      setError(message);
    } finally {
      setLoading(false);
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
      void sendListenerEvent("pause", {
        trackId: nowPlaying?.track.id
      }).catch(() => undefined);
      return;
    }

    try {
      await audioRef.current.play();
      setPlaying(true);
      void sendListenerEvent("play", {
        trackId: nowPlaying?.track.id
      }).catch(() => undefined);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "O browser bloqueou o audio.";
      setError(message);
      void sendListenerEvent("error", {
        message
      }).catch(() => undefined);
    }
  }

  async function installApp() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "accepted") {
      void sendListenerEvent("install").catch(() => undefined);
    }
  }

  return (
    <div className="app-shell">
      <audio ref={audioRef} src={streamUrl || undefined} preload="none" />

      <header className="topbar">
        <div className="brand-lockup" aria-label="Radium">
          <div className="brand-mark">
            <Radio size={24} strokeWidth={2.2} />
          </div>
          <div>
            <p className="eyebrow">Personal station</p>
            <h1>{station?.name ?? "Radium"}</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <StatusPill online={Boolean(streamUrl)} demoMode={Boolean(station?.demoMode)} />
          <button
            className="icon-button"
            type="button"
            title="Atualizar"
            aria-label="Atualizar"
            onClick={() => void loadBootstrap()}
            disabled={refreshing}
          >
            <RefreshCw size={19} className={refreshing ? "spin" : undefined} />
          </button>
          <button
            className="icon-button"
            type="button"
            title="Instalar"
            aria-label="Instalar"
            onClick={() => void installApp()}
            disabled={!installPrompt}
          >
            <Download size={19} />
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="player-panel" aria-label="Player Radium">
          <div className="artwork-frame">
            <img src="/assets/radium-studio.png" alt="" />
            <div className="artwork-signal" aria-hidden="true">
              {meterBars.map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>

          <div className="player-content">
            <div className="live-row">
              <span className={streamUrl ? "live-dot" : "live-dot live-dot-muted"} />
              <span>{streamUrl ? "Stream pronto" : "Stream por configurar"}</span>
            </div>

            <div className="track-heading">
              <p>{nowPlaying?.track.artist ?? "Radium Library"}</p>
              <h2>{nowPlaying?.track.title ?? "A carregar rotacao"}</h2>
            </div>

            <div className="progress-bar" aria-label="Progresso da faixa">
              <span style={{ width: `${progress}%` }} />
            </div>

            <div className="time-row">
              <span>{formatSeconds(nowPlaying?.progressSeconds ?? 0)}</span>
              <span>{formatSeconds(nowPlaying?.durationSeconds ?? 0)}</span>
            </div>

            <div className="controls">
              <button
                className="play-button"
                type="button"
                title={streamUrl ? "Tocar" : "Configurar RADIUM_STREAM_URL"}
                aria-label={playing ? "Pausar" : "Tocar"}
                aria-pressed={playing}
                disabled={!streamUrl || loading}
                onClick={() => void togglePlayback()}
              >
                {playing ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
              </button>

              <label className="volume-control" title="Volume">
                <Volume2 size={19} />
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

            {nowPlaying ? (
              <div className="next-track">
                <span>Segue</span>
                <strong>{nowPlaying.nextTrack.title}</strong>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="side-stack">
          <section className="panel">
            <PanelTitle icon={<Activity size={18} />} title="Operacao" />
            <div className="signal-grid">
              <Metric label="Estado" value={station?.status ?? "loading"} />
              <Metric label="Modo" value={station?.demoMode ? "demo" : "live"} />
              <Metric label="Faixas" value={String(libraryStats.tracks)} />
              <Metric label="Minutos" value={String(libraryStats.minutes)} />
            </div>
            {error ? <p className="error-line">{error}</p> : null}
          </section>

          <section className="panel current-slot">
            <PanelTitle icon={<Signal size={18} />} title="Agora" />
            {currentBlock ? (
              <>
                <p className="slot-time">
                  {currentBlock.start} - {currentBlock.end}
                </p>
                <h3>{currentBlock.program.title}</h3>
                <p>{currentBlock.playlist.name}</p>
              </>
            ) : (
              <>
                <p className="slot-time">AutoDJ</p>
                <h3>Rotacao livre</h3>
                <p>Sem bloco ativo nesta hora.</p>
              </>
            )}
          </section>
        </aside>

        <section className="panel schedule-panel">
          <PanelTitle icon={<CalendarDays size={18} />} title="Grelha" />
          <div className="section-meta">
            <span>{schedule ? dayLabels[schedule.day] ?? schedule.day : "Hoje"}</span>
            <span>{schedule?.date ?? ""}</span>
          </div>
          <div className="timeline">
            {schedule?.blocks.map((block) => (
              <article className="timeline-item" key={block.id}>
                <div className="timeline-time">
                  <span>{block.start}</span>
                  <span>{block.end}</span>
                </div>
                <div className="timeline-body" style={{ borderColor: block.program.color }}>
                  <h3>{block.program.title}</h3>
                  <p>{block.program.description}</p>
                  <span>{block.playlist.name}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelTitle icon={<ListMusic size={18} />} title="Playlists" />
          <div className="playlist-grid">
            {playlists.map((playlist) => (
              <article className="playlist-card" key={playlist.id}>
                <div>
                  <h3>{playlist.name}</h3>
                  <p>{playlist.description}</p>
                </div>
                <span>{playlist.tracks.length} faixas</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelTitle icon={<SlidersHorizontal size={18} />} title="Programas" />
          <div className="program-grid">
            {programs.map((program) => (
              <article className="program-card" key={program.id}>
                <span style={{ background: program.color }} />
                <div>
                  <h3>{program.title}</h3>
                  <p>{program.host}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="panel-title">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusPill({ online, demoMode }: { online: boolean; demoMode: boolean }) {
  return (
    <div className={online ? "status-pill" : "status-pill status-pill-muted"}>
      {online ? <Signal size={16} /> : <WifiOff size={16} />}
      <span>{online ? (demoMode ? "Demo" : "Live") : "Offline"}</span>
    </div>
  );
}

function formatSeconds(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function findCurrentBlock(blocks: ScheduleBlock[]) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  return (
    blocks.find((block) => {
      const start = timeToMinutes(block.start);
      const end = block.end === "00:00" ? 24 * 60 : timeToMinutes(block.end);
      return minutes >= start && minutes < end;
    }) ?? null
  );
}

function timeToMinutes(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}
