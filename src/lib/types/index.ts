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
  venue: string | null;
  venueImageUrl: string | null;
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
  venueImageUrl: string | null;
  homeTeam: TeamSummaryVM;
  awayTeam: TeamSummaryVM;
}

export interface LatestResultVM {
  id: string;
  tournamentName: string;
  playedAt: Date;
  venue: string | null;
  venueImageUrl: string | null;
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
  assists: number;
  contributions: number;
}

export interface TopAssisterVM {
  rank: number;
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  teamName: string;
  teamId: string | null;
  assists: number;
  goals: number;
  contributions: number;
}

export interface HomeStatsVM {
  registeredTeams: number;
  goalsThisSeason: number;
  activeTournaments: number;
  registeredPlayers: number;
}

export type RatingTierKey = "green" | "diamond" | "gold" | "silver" | "base";

export interface TeamOfTheWeekPlayerVM {
  playerId: string;
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  rating: number;
  team: {
    id: string;
    name: string;
    shortName: string;
    crestUrl: string | null;
  };
}

export interface TeamOfTheWeekSlotVM {
  positionSlot: string;
  label: string;
  band: number; // pitch row, 0 = GK … higher = attack
  captain: boolean;
  player: TeamOfTheWeekPlayerVM;
}

export interface TeamOfTheWeekVM {
  id: string;
  weekLabel: string;
  formation: string;
  weekStart: Date | null;
  weekEnd: Date | null;
  tournamentName: string;
  slots: TeamOfTheWeekSlotVM[];
}

/** A pickable player in the admin lineup builder (grouped per team). */
export interface TOTWCandidateVM {
  playerId: string;
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  rating: number | null;
  teamId: string;
  teamName: string;
  shortName: string;
  crestUrl: string | null;
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
  venueImageUrl: string | null;
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
  venueImageUrl: string | null;
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
  /** The team's next fixture still to be played (null when none is left). */
  nextFixture: { id: string; kickoffAt: Date; venue: string | null } | null;
  /** Open (PENDING) join requests, shown to owners/managers for approval. */
  pendingRequests: PendingRequestVM[];
}

export interface PendingRequestVM {
  id: string;
  playerId: string;
  name: string;
  requestedAt: Date;
}

export interface TeamPlayerVM {
  id: string;
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  position: string;
  goals: number;
  assists: number;
  yellows: number;
  reds: number;
  suspendedNext: boolean;
  suspendedReason: "RED" | "SECOND_YELLOW" | null;
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
  assists: number;
  matchesPlayed: number;
  cleanSheets: number;
  yellows: number;
  reds: number;
  suspendedNext: boolean;
  suspendedReason: "RED" | "SECOND_YELLOW" | null;
  /** The player's next fixture, when the team has one that is a suspension target. */
  nextFixture: { id: string; kickoffAt: Date; venue: string | null } | null;
  /** True when the linked user account has no real email yet and can be claimed. */
  accountClaimable: boolean;
  /** True when a phone number is on file (used to verify account claims). */
  phoneSet: boolean;
  /** Recent finished matches, with this player's contribution in each. */
  matchLog: {
    matchId: string;
    tournamentName: string;
    kickoffAt: Date;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    ownTeamIsHome: boolean;
    teamName: string;
    teamScore: number;
    opponentScore: number;
    won: boolean;
    drew: boolean;
    goals: number;
    assists: number;
  }[];
}

export interface PlayerListItemVM {
  id: string;
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  position: string;
  team: { id: string; name: string; crestUrl: string | null } | null;
  goals: number;
  assists: number;
}

// --- Full standings / scorers (no limit) ------------------------------------

export type FullStandingRowVM = StandingRowVM;
export type FullTopScorerVM = TopScorerVM;
export type FullTopAssisterVM = TopAssisterVM;

// --- News -------------------------------------------------------------------

export interface NewsVM {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  imageUrl: string | null;
  authorName: string | null;
  publishedAt: Date;
  createdAt: Date;
}

// --- Live polling -----------------------------------------------------------

/** Lightweight snapshot polled by the client while a match is live. */
export interface MatchLiveSnapshotVM {
  id: string;
  status: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
  updatedAt: string;
}

// --- Notifications ----------------------------------------------------------

export interface NotificationVM {
  id: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}
