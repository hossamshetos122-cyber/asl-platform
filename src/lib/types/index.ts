// A small Result type so every data-access function can express success,
// empty, and failure explicitly instead of components having to guess
// what `null` or `[]` means. Server components branch on `.status`.
export type Result<T> =
  | { status: "success"; data: T }
  | { status: "empty" }
  | { status: "error"; message: string };

// --- View models -----------------------------------------------------------
// These are intentionally decoupled from the raw Prisma models: the UI
// should never depend on the exact shape of a database row, only on what
// it needs to render. This keeps schema changes from cascading into JSX.

export interface LiveMatchVM {
  id: string;
  tournamentName: string;
  round: string | null;
  status: "LIVE" | "HALFTIME";
  minute: number | null;
  homeTeam: TeamSummaryVM;
  awayTeam: TeamSummaryVM;
  homeScore: number;
  awayScore: number;
}

export interface TeamSummaryVM {
  id: string;
  name: string;
  shortCode: string; // 2-letter fallback shown when no crest image exists
  crestUrl: string | null;
  city?: string;
}

export interface UpcomingMatchVM {
  id: string;
  tournamentName: string;
  kickoffAt: Date;
  venue: string | null;
  homeTeam: TeamSummaryVM;
  awayTeam: TeamSummaryVM;
}

export interface LatestResultVM {
  id: string;
  tournamentName: string;
  playedAt: Date;
  venue: string | null;
  homeTeam: TeamSummaryVM;
  awayTeam: TeamSummaryVM;
  homeScore: number;
  awayScore: number;
}

export interface StandingRowVM {
  rank: number;
  team: TeamSummaryVM;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface TopScorerVM {
  rank: number;
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  teamName: string;
  teamId: string | null;
  goals: number;
}

export interface HomeStatsVM {
  registeredTeams: number;
  goalsThisSeason: number;
  activeTournaments: number;
  registeredPlayers: number;
}

// --- Tournament view models -------------------------------------------------

export interface TournamentSummaryVM {
  id: string;
  name: string;
  format: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  teamCount: number;
}

export interface TournamentDetailVM {
  id: string;
  name: string;
  format: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  teams: TeamSummaryVM[];
}

// --- Match view models ------------------------------------------------------

export interface MatchSummaryVM {
  id: string;
  tournamentName: string;
  round: string | null;
  status: string;
  kickoffAt: Date;
  venue: string | null;
  homeTeam: TeamSummaryVM;
  awayTeam: TeamSummaryVM;
  homeScore: number;
  awayScore: number;
  minute: number | null;
}

export interface MatchDetailVM {
  id: string;
  tournamentName: string;
  round: string | null;
  status: string;
  kickoffAt: Date;
  venue: string | null;
  homeTeam: TeamSummaryVM;
  awayTeam: TeamSummaryVM;
  homeScore: number;
  awayScore: number;
  minute: number | null;
  events: MatchEventVM[];
  homeSquad: MatchSquadVM | null;
  awaySquad: MatchSquadVM | null;
}

export interface MatchEventVM {
  id: string;
  type: string;
  minute: number;
  playerName: string;
  playerId: string;
  photoUrl: string | null;
  teamName: string;
  teamId: string;
}

// --- Match squad view models ------------------------------------------------

export interface MatchSquadPlayerVM {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  position: string;
  isStarter: boolean;
  sortOrder: number | null;
}

export interface MatchSquadVM {
  squadId: string;
  teamId: string;
  teamName: string;
  teamCrestUrl: string | null;
  status: "PENDING" | "CONFIRMED" | "ABSENT";
  players: MatchSquadPlayerVM[];
  starters: number;
  subs: number;
  squadSize: number;
  isXIComplete: boolean;
}

// --- Team view models -------------------------------------------------------

export interface TeamDetailVM {
  id: string;
  name: string;
  shortCode: string;
  city: string;
  crestUrl: string | null;
  foundedAt: Date | null;
  ownerId: string | null;
  playerCount: number;
  squadLimit: number;
  players: TeamPlayerVM[];
  tournaments: { id: string; name: string }[];
}

export interface TeamPlayerVM {
  id: string;
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  position: string;
  goals: number;
}

// --- Player view models -----------------------------------------------------

export interface PlayerProfileVM {
  id: string;
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  position: string;
  dateOfBirth: Date | null;
  team: { id: string; name: string; crestUrl: string | null } | null;
  goals: number;
  matchesPlayed: number;
}

export interface PlayerListItemVM {
  id: string;
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  position: string;
  team: { id: string; name: string; crestUrl: string | null } | null;
  goals: number;
}

// --- Full standings / scorers (no limit) ------------------------------------

export type FullStandingRowVM = StandingRowVM;
export type FullTopScorerVM = TopScorerVM;
