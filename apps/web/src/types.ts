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

export type BootstrapPayload = {
  station: Station;
  nowPlaying: NowPlaying;
  schedule: Schedule;
  programs: Program[];
  playlists: Playlist[];
};

