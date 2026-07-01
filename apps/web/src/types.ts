export type Station = {
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
  brand: {
    primary: string;
    accent: string;
    ink: string;
    surface: string;
  };
  legalMode: string;
  complianceNotes: string[];
  demoMode: boolean;
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
  tracks: Track[];
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
  days: string[];
  start: string;
  end: string;
  programId: string;
  playlistId: string;
  program: Program;
  playlist: Playlist;
};

export type Schedule = {
  date: string;
  day: string;
  blocks: ScheduleBlock[];
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

export type BootstrapPayload = {
  station: Station;
  nowPlaying: NowPlaying;
  party: PartySnapshot;
  schedule: Schedule;
  programs: Program[];
  playlists: Playlist[];
};

export type PartyPayload = {
  nowPlaying: NowPlaying;
  party: PartySnapshot;
};
