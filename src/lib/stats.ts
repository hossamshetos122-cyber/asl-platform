import { prisma } from "@/lib/prisma";
import type {
  HomeStatsVM,
  Result,
  StandingRowVM,
  TopAssisterVM,
  TopScorerVM,
} from "@/lib/types";
import type { Match, Team } from "@prisma/client";

/**
 * Single source of truth for every league statistic:
 *  - player goal counts (players list, player profile, team roster, top-scorers, hero)
 *  - player matches-played (player profile)
 *  - the "featured"/current tournament that frames the site (standings, scorers, hero)
 *  - standings table points/W/D/L/GF/GA
 *
 * ONE canonical definition is used everywhere:
 *  goals + penalty goals counted ONLY in FINISHED matches of the featured
 *  tournament. Player pages, top-scorers and the home hero therefore always
 *  agree on the same numbers.
 */

export const GOAL_EVENT_TYPES = ["GOAL", "PENALTY_SCORED"] as const;

export const ASSIST_EVENT_TYPE = "ASSIST" as const;

export const OFFICIAL_MATCH_STATUS = "FINISHED" as const;

export interface FeaturedTournament {
  id: string;
  name: string;
}

/**
 * The featured tournament is the ONGOING competition with the most fixtures —
 * the "main" competition of the platform. Ties are broken by latest start date.
 * This replaces the old "latest-start among ONGOING" rule that could pick a
 * side cup instead of the league.
 */
export async function getFeaturedTournament(): Promise<Result<FeaturedTournament>> {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { status: "ONGOING" },
      include: { _count: { select: { matches: true } } },
      orderBy: { startDate: "desc" },
    });

    if (tournaments.length === 0) {
      return { status: "empty" };
    }

    const featured = tournaments.reduce((best, current) =>
      current._count.matches > best._count.matches ? current : best
    );

    return { status: "success", data: { id: featured.id, name: featured.name } };
  } catch (error) {
    console.error("[getFeaturedTournament]", error);
    return { status: "error", message: "تعذّر تحديد البطولة الحالية." };
  }
}

export async function getFeaturedTournamentId(): Promise<Result<string>> {
  const result = await getFeaturedTournament();
  return result.status === "success"
    ? { status: "success", data: result.data.id }
    : result;
}

/**
 * The season label attached to the featured tournament (from the majority of
 * its FINISHED matches' Season rows). Null when there is no featured
 * tournament or no season data — callers fall back to the clock-based label.
 */
export async function getFeaturedSeasonLabel(): Promise<string | null> {
  try {
    const featured = await getFeaturedTournament();
    if (featured.status !== "success") return null;

    const majority = await prisma.match.groupBy({
      by: ["seasonId"],
      where: {
        tournamentId: featured.data.id,
        status: OFFICIAL_MATCH_STATUS,
        seasonId: { not: null },
      },
      _count: { seasonId: true },
      orderBy: { _count: { seasonId: "desc" } },
      take: 1,
    });

    const top = majority[0];
    if (!top || !top.seasonId) return null;

    const season = await prisma.season.findUnique({
      where: { id: top.seasonId },
      select: { label: true },
    });

    return season?.label ?? null;
  } catch (error) {
    console.error("[getFeaturedSeasonLabel]", error);
    return null;
  }
}

/**
 * Canonical player goal count: GOAL + PENALTY_SCORED events inside FINISHED
 * matches, across ALL tournaments (not just the featured one). Returns a
 * Map playerId -> goals so a single query serves lists, profiles and rosters
 * identically.
 */
export async function getPlayerGoalCounts(
  playerIds: string[]
): Promise<Map<string, number>> {
  if (playerIds.length === 0) return new Map<string, number>();

  const grouped = await prisma.matchEvent.groupBy({
    by: ["playerId"],
    where: {
      playerId: { in: playerIds },
      type: { in: [...GOAL_EVENT_TYPES] },
      match: { status: OFFICIAL_MATCH_STATUS },
    },
    _count: { playerId: true },
  });

  const map = new Map<string, number>();
  for (const group of grouped) {
    map.set(group.playerId, group._count.playerId);
  }
  return map;
}

/**
 * Canonical player assist count: ASSIST events inside FINISHED matches of
 * ALL tournaments (not just the featured one). Same contract as
 * getPlayerGoalCounts so lists, profiles and rosters share one definition.
 */
export async function getPlayerAssistCounts(
  playerIds: string[]
): Promise<Map<string, number>> {
  if (playerIds.length === 0) return new Map<string, number>();

  const grouped = await prisma.matchEvent.groupBy({
    by: ["playerId"],
    where: {
      playerId: { in: playerIds },
      type: ASSIST_EVENT_TYPE,
      match: { status: OFFICIAL_MATCH_STATUS },
    },
    _count: { playerId: true },
  });

  const map = new Map<string, number>();
  for (const group of grouped) {
    map.set(group.playerId, group._count.playerId);
  }
  return map;
}

/**
 * Canonical player matches-played: distinct FINISHED matches (across ALL
 * tournaments) where the player was on a CONFIRMED squad (not PENDING/ABSENT).
 */
export async function getPlayerMatchesPlayedCounts(
  playerIds: string[]
): Promise<Map<string, number>> {
  if (playerIds.length === 0) return new Map<string, number>();

  const entries = await prisma.matchSquadPlayer.findMany({
    where: {
      playerId: { in: playerIds },
      squad: {
        status: "CONFIRMED",
        match: { status: OFFICIAL_MATCH_STATUS },
      },
    },
    select: {
      playerId: true,
      squad: { select: { matchId: true } },
    },
  });

  const map = new Map<string, number>();
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.playerId}:${entry.squad.matchId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    map.set(entry.playerId, (map.get(entry.playerId) ?? 0) + 1);
  }
  return map;
}

/**
 * Canonical total goals shown on the home hero: every goal event inside
 * FINISHED matches across ALL tournaments (equals the sum of all player goal
 * counts).
 */
export async function getFeaturedGoalsCount(): Promise<number> {
  try {
    return await prisma.matchEvent.count({
      where: {
        type: { in: [...GOAL_EVENT_TYPES] },
        match: { status: OFFICIAL_MATCH_STATUS },
      },
    });
  } catch (error) {
    console.error("[getFeaturedGoalsCount]", error);
    return 0;
  }
}

/**
 * Standings are computed on read from finished matches rather than stored,
 * so this is the single source of truth. For an amateur-league match volume
 * this is cheap; if it ever becomes a bottleneck, cache the result behind a
 * short TTL instead of introducing a second stored copy of the same data.
 */
export async function getStandings(
  tournamentId: string,
  limit = 5
): Promise<Result<StandingRowVM[]>> {
  try {
    const matches = await prisma.match.findMany({
      where: { tournamentId, status: OFFICIAL_MATCH_STATUS },
      include: { homeTeam: true, awayTeam: true },
    });

    if (matches.length === 0) {
      return { status: "empty" };
    }

    interface Accumulator {
      team: Team;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
    }

    const table = new Map<string, Accumulator>();

    const ensureRow = (team: Team): Accumulator => {
      const existing = table.get(team.id);
      if (existing) return existing;
      const fresh: Accumulator = {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      };
      table.set(team.id, fresh);
      return fresh;
    };

    const applyResult = (
      match: Match & { homeTeam: Team; awayTeam: Team }
    ): void => {
      const home = ensureRow(match.homeTeam);
      const away = ensureRow(match.awayTeam);

      home.played += 1;
      away.played += 1;
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        home.won += 1;
        away.lost += 1;
      } else if (match.homeScore < match.awayScore) {
        away.won += 1;
        home.lost += 1;
      } else {
        home.drawn += 1;
        away.drawn += 1;
      }
    };

    for (const match of matches) {
      applyResult(match);
    }

    // Build a map of head-to-head results between teams
    // key = "teamA_id:teamB_id" (sorted), value = { goalsFor, goalsAgainst } from teamA's perspective
    const h2hMap = new Map<string, { goalsFor: number; goalsAgainst: number }>();
    for (const match of matches) {
      const aId = match.homeTeamId < match.awayTeamId ? match.homeTeamId : match.awayTeamId;
      const bId = match.homeTeamId < match.awayTeamId ? match.awayTeamId : match.homeTeamId;
      const key = `${aId}:${bId}`;
      const existing = h2hMap.get(key) ?? { goalsFor: 0, goalsAgainst: 0 };
      if (match.homeTeamId === aId) {
        existing.goalsFor += match.homeScore;
        existing.goalsAgainst += match.awayScore;
      } else {
        existing.goalsFor += match.awayScore;
        existing.goalsAgainst += match.homeScore;
      }
      h2hMap.set(key, existing);
    }

    const rows: StandingRowVM[] = Array.from(table.values())
      .map((row) => ({
        rank: 0,
        team: {
          id: row.team.id,
          name: row.team.name,
          shortCode: row.team.shortName,
          crestUrl: row.team.crestUrl,
        },
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: row.won * 3 + row.drawn,
      }))
      .sort((a, b) => {
        // 1. Points
        if (b.points !== a.points) return b.points - a.points;
        // 2. Goal difference
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        // 3. Goals scored
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        // 4. Head-to-head (deterministic — alphabetical order ensures no cycles)
        const aId = a.team.id;
        const bId = b.team.id;
        const key = aId < bId ? `${aId}:${bId}` : `${bId}:${aId}`;
        const h2h = h2hMap.get(key);
        if (h2h) {
          const aGoalsFor = aId < bId ? h2h.goalsFor : h2h.goalsAgainst;
          const bGoalsFor = aId < bId ? h2h.goalsAgainst : h2h.goalsFor;
          if (aGoalsFor !== bGoalsFor) return bGoalsFor - aGoalsFor;
        }
        // 5. Alphabetical fallback (deterministic)
        return a.team.name.localeCompare(b.team.name, "ar");
      })
      .slice(0, limit)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    return { status: "success", data: rows };
  } catch (error) {
    console.error("[getStandings]", error);
    return { status: "error", message: "تعذّر تحميل جدول الترتيب." };
  }
}

/**
 * Canonical top scorers: GOAL + PENALTY_SCORED events inside FINISHED matches.
 * When tournamentId is omitted, counts across ALL tournaments; when provided,
 * scopes to that tournament. The same definition powers the home panel and the
 * full top-scorers page, and matches the per-player goal counts. Also carries
 * the player's assists so pages can show goals+assists (G+A) contribution.
 */
export async function getTopScorers(
  tournamentId?: string,
  limit = 4
): Promise<Result<TopScorerVM[]>> {
  try {
    const matchWhere = tournamentId
      ? { tournamentId, status: OFFICIAL_MATCH_STATUS }
      : { status: OFFICIAL_MATCH_STATUS };

    const grouped = await prisma.matchEvent.groupBy({
      by: ["playerId"],
      where: {
        type: { in: [...GOAL_EVENT_TYPES] },
        match: matchWhere,
      },
      _count: { playerId: true },
      orderBy: { _count: { playerId: "desc" } },
      take: limit,
    });

    if (grouped.length === 0) {
      return { status: "empty" };
    }

    const playerIds = grouped.map((g) => g.playerId);
    const [players, assistsGrouped] = await Promise.all([
      prisma.player.findMany({
        where: { id: { in: playerIds } },
        include: {
          user: { select: { fullName: true } },
          memberships: {
            where: { status: "ACTIVE" },
            include: { team: { select: { id: true, name: true } } },
            take: 1,
          },
        },
      }),
      prisma.matchEvent.groupBy({
        by: ["playerId"],
        where: {
          playerId: { in: playerIds },
          type: ASSIST_EVENT_TYPE,
          match: matchWhere,
        },
        _count: { playerId: true },
      }),
    ]);

    const playerById = new Map(players.map((p) => [p.id, p]));
    const assistById = new Map(assistsGrouped.map((a) => [a.playerId, a._count.playerId]));

    const rows: TopScorerVM[] = grouped
      .map((g) => {
        const player = playerById.get(g.playerId);
        if (!player) return null;
        const teamName = player.memberships[0]?.team.name ?? "بدون فريق";
        const teamId = player.memberships[0]?.team.id ?? null;
        const assists = assistById.get(player.id) ?? 0;
        const goals = g._count.playerId;
        const row: TopScorerVM = {
          rank: 0,
          playerId: player.id,
          playerName: player.user.fullName,
          photoUrl: player.photoUrl,
          teamName,
          teamId,
          goals,
          assists,
          contributions: goals + assists,
        };
        return row;
      })
      .filter((row): row is TopScorerVM => row !== null)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    return { status: "success", data: rows };
  } catch (error) {
    console.error("[getTopScorers]", error);
    return { status: "error", message: "تعذّر تحميل ترتيب الهدافين." };
  }
}

/**
 * Canonical top assisters: ASSIST events inside FINISHED matches. When
 * tournamentId is omitted, counts across ALL tournaments; when provided,
 * scopes to that tournament. Mirrors getTopScorers so both tables agree on
 * every page, and carries goals so G+A contribution can be shown.
 */
export async function getTopAssisters(
  tournamentId?: string,
  limit = 8
): Promise<Result<TopAssisterVM[]>> {
  try {
    const matchWhere = tournamentId
      ? { tournamentId, status: OFFICIAL_MATCH_STATUS }
      : { status: OFFICIAL_MATCH_STATUS };

    const grouped = await prisma.matchEvent.groupBy({
      by: ["playerId"],
      where: {
        type: ASSIST_EVENT_TYPE,
        match: matchWhere,
      },
      _count: { playerId: true },
      orderBy: { _count: { playerId: "desc" } },
      take: limit,
    });

    if (grouped.length === 0) {
      return { status: "empty" };
    }

    const playerIds = grouped.map((g) => g.playerId);
    const [players, goalsGrouped] = await Promise.all([
      prisma.player.findMany({
        where: { id: { in: playerIds } },
        include: {
          user: { select: { fullName: true } },
          memberships: {
            where: { status: "ACTIVE" },
            include: { team: { select: { id: true, name: true } } },
            take: 1,
          },
        },
      }),
      prisma.matchEvent.groupBy({
        by: ["playerId"],
        where: {
          playerId: { in: playerIds },
          type: { in: [...GOAL_EVENT_TYPES] },
          match: matchWhere,
        },
        _count: { playerId: true },
      }),
    ]);

    const playerById = new Map(players.map((p) => [p.id, p]));
    const goalById = new Map(goalsGrouped.map((g) => [g.playerId, g._count.playerId]));

    const rows: TopAssisterVM[] = grouped
      .map((g) => {
        const player = playerById.get(g.playerId);
        if (!player) return null;
        const teamName = player.memberships[0]?.team.name ?? "بدون فريق";
        const teamId = player.memberships[0]?.team.id ?? null;
        const assists = g._count.playerId;
        const goals = goalById.get(player.id) ?? 0;
        const row: TopAssisterVM = {
          rank: 0,
          playerId: player.id,
          playerName: player.user.fullName,
          photoUrl: player.photoUrl,
          teamName,
          teamId,
          assists,
          goals,
          contributions: assists + goals,
        };
        return row;
      })
      .filter((row): row is TopAssisterVM => row !== null)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    return { status: "success", data: rows };
  } catch (error) {
    console.error("[getTopAssisters]", error);
    return { status: "error", message: "تعذّر تحميل ترتيب صناع الأهداف." };
  }
}

export async function getHomeStats(): Promise<Result<HomeStatsVM>> {
  try {
    const [registeredTeams, registeredPlayers, activeTournaments, goalsThisSeason] =
      await Promise.all([
        prisma.team.count(),
        prisma.player.count(),
        prisma.tournament.count({ where: { status: "ONGOING" } }),
        getFeaturedGoalsCount(),
      ]);

    const stats: HomeStatsVM = {
      registeredTeams,
      goalsThisSeason,
      activeTournaments,
      registeredPlayers,
    };

    return { status: "success", data: stats };
  } catch (error) {
    console.error("[getHomeStats]", error);
    return { status: "error", message: "تعذّر تحميل إحصائيات المنصة." };
  }
}