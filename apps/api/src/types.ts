export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type StationBrand = {
  primary: string;
  accent: string;
  ink: string;
  surface: string;
};

export type StationConfig = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  owner: string;
  timezone: string;
  locale: string;
  status: string;
  streamUrl: string;
  fallbackStreamUrl: string;
  publicUrl: string;
  studioEmail: string;
  brand: StationBrand;
  legalMode: string;
  complianceNotes: string[];
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  genre: string;
  energy: number;
  mood: string;
  source: string;
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
};

export type Program = {
  id: string;
  title: string;
  host: string;
  description: string;
  color: string;
  defaultPlaylistId: string;
};

export type ScheduleBlock = {
  id: string;
  days: DayOfWeek[];
  start: string;
  end: string;
  programId: string;
  playlistId: string;
};

export type EnrichedScheduleBlock = ScheduleBlock & {
  program: Program;
  playlist: Playlist;
};

export type NowPlaying = {
  stationId: string;
  generatedAt: string;
  streamUrl: string;
  demoMode: boolean;
  track: Track;
  nextTrack: Track;
  progressSeconds: number;
  durationSeconds: number;
  startedAt: string;
  endsAt: string;
};

export type ListenerEvent = {
  type: "play" | "pause" | "heartbeat" | "install" | "error";
  at?: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
};

export type PartyRequestStatus = "suggested" | "queued" | "skipped" | "played" | "rejected";

export type PartyRequest = {
  id: string;
  title: string;
  artist: string;
  requestedBy: string;
  note: string;
  status: PartyRequestStatus;
  createdAt: string;
  updatedAt: string;
  position: number;
};

export type PartyState = {
  requests: PartyRequest[];
  updatedAt: string;
};

export type PartyUpNextItem = {
  id: string;
  title: string;
  artist: string;
  requestedBy?: string;
  source: "party" | "azuracast";
  position: number;
};

export type PartySnapshot = {
  upNext: PartyUpNextItem[];
  queue: PartyRequest[];
  suggestions: PartyRequest[];
  recent: PartyRequest[];
  canControlAzuraCast: boolean;
  adminEnabled: boolean;
};
