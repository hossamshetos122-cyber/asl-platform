import { prisma } from "@/lib/prisma";
import type {
  HomeStatsVM,
  LatestResultVM,
  LiveMatchVM,
  Result,
  StandingRowVM,
  TeamSummaryVM,
  TopScorerVM,
  UpcomingMatchVM,
} from "@/lib/types";
import type { Match, Team } from "@prisma/client";

function toTeamSummary(team: Team): TeamSummaryVM {
  return {
    id: team.id,
    name: team.name,
    shortCode: team.shortName,
    crestUrl: team.crestUrl,
  };
}

/**
 * Returns the single most relevant live/halftime match for the hero banner.
 * If several matches are live at once (plausible once the league has
 * multiple concurrent pitches), we surface the one that started most
 * recently so the banner stays meaningful rather than picking arbitrarily.
 */
export async function getFeaturedLiveMatch(): Promise<Result<LiveMatchVM>> {
  try {
    const match = await prisma.match.findFirst({
      where: { status: { in: ["LIVE", "HALFTIME"] } },
      orderBy: { kickoffAt: "desc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { name: true } },
      },
    });

    if (!match) {
      return { status: "empty" };
    }

    const vm: LiveMatchVM = {
      id: match.id,
      tournamentName: match.tournament.name,
      round: match.round,
      status: match.status === "HALFTIME" ? "HALFTIME" : "LIVE",
      minute: match.minute,
      homeTeam: toTeamSummary(match.homeTeam),
      awayTeam: toTeamSummary(match.awayTeam),
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    };

    return { status: "success", data: vm };
  } catch (error) {
    console.error("[getFeaturedLiveMatch]", error);
    return { status: "error", message: "تعذّر تحميل المباراة المباشرة." };
  }
}

export async function getUpcomingMatches(limit = 3): Promise<Result<UpcomingMatchVM[]>> {
  try {
    const matches = await prisma.match.findMany({
      where: { status: "SCHEDULED", kickoffAt: { gte: new Date() } },
      orderBy: { kickoffAt: "asc" },
      take: limit,
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { name: true } },
      },
    });

    if (matches.length === 0) {
      return { status: "empty" };
    }

    const vms: UpcomingMatchVM[] = matches.map((m) => ({
      id: m.id,
      tournamentName: m.tournament.name,
      kickoffAt: m.kickoffAt,
      venue: m.venue,
      homeTeam: toTeamSummary(m.homeTeam),
      awayTeam: toTeamSummary(m.awayTeam),
    }));

    return { status: "success", data: vms };
  } catch (error) {
    console.error("[getUpcomingMatches]", error);
    return { status: "error", message: "تعذّر تحميل المباريات القادمة." };
  }
}

export async function getLatestResults(limit = 3): Promise<Result<LatestResultVM[]>> {
  try {
    const matches = await prisma.match.findMany({
      where: { status: "FINISHED" },
      orderBy: { kickoffAt: "desc" },
      take: limit,
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { name: true } },
      },
    });

    if (matches.length === 0) {
      return { status: "empty" };
    }

    const vms: LatestResultVM[] = matches.map((m) => ({
      id: m.id,
      tournamentName: m.tournament.name,
      playedAt: m.kickoffAt,
      venue: m.venue,
      homeTeam: toTeamSummary(m.homeTeam),
      awayTeam: toTeamSummary(m.awayTeam),
      homeScore: m.homeScore,
      awayScore: m.awayScore,
    }));

    return { status: "success", data: vms };
  } catch (error) {
    console.error("[getLatestResults]", error);
    return { status: "error", message: "تعذّر تحميل آخر النتائج." };
  }
}

/**
 * Standings are computed on read from finished matches rather than stored,
 * so this is the single source of truth (see schema.prisma header note).
 * For an amateur-league match volume this is cheap; if it ever becomes a
 * bottleneck, cache the result behind a short TTL instead of introducing a
 * second stored copy of the same data.
 */
export async function getStandings(
  tournamentId: string,
  limit = 5
): Promise<Result<StandingRowVM[]>> {
  try {
    const matches = await prisma.match.findMany({
      where: { tournamentId, status: "FINISHED" },
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
        team: toTeamSummary(row.team),
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

export async function getTopScorers(
  tournamentId: string,
  limit = 4
): Promise<Result<TopScorerVM[]>> {
  try {
    const grouped = await prisma.matchEvent.groupBy({
      by: ["playerId"],
      where: {
        type: { in: ["GOAL", "PENALTY_SCORED"] },
        match: { tournamentId },
      },
      _count: { playerId: true },
      orderBy: { _count: { playerId: "desc" } },
      take: limit,
    });

    if (grouped.length === 0) {
      return { status: "empty" };
    }

    const playerIds = grouped.map((g) => g.playerId);
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      include: {
        user: { select: { fullName: true } },
        memberships: {
          where: { status: "ACTIVE" },
          include: { team: { select: { id: true, name: true } } },
          take: 1,
        },
      },
    });

    const playerById = new Map(players.map((p) => [p.id, p]));

    const rows: TopScorerVM[] = grouped
      .map((g) => {
        const player = playerById.get(g.playerId);
        if (!player) return null;
        const teamName = player.memberships[0]?.team.name ?? "بدون فريق";
        const teamId = player.memberships[0]?.team.id ?? null;
        const row: TopScorerVM = {
          rank: 0,
          playerId: player.id,
          playerName: player.user.fullName,
          photoUrl: player.photoUrl,
          teamName,
          teamId,
          goals: g._count.playerId,
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
 * The homepage shows one "featured" tournament's table and scorers list.
 * We pick the ongoing tournament with the most recently played match, which
 * in practice is whichever league/cup is currently the active one.
 */
export async function getFeaturedTournamentId(): Promise<Result<string>> {
  try {
    const tournament = await prisma.tournament.findFirst({
      where: { status: "ONGOING" },
      orderBy: { startDate: "desc" },
      select: { id: true },
    });

    if (!tournament) {
      return { status: "empty" };
    }

    return { status: "success", data: tournament.id };
  } catch (error) {
    console.error("[getFeaturedTournamentId]", error);
    return { status: "error", message: "تعذّر تحديد البطولة الحالية." };
  }
}

export async function getHomeStats(): Promise<Result<HomeStatsVM>> {
  try {
    const [registeredTeams, registeredPlayers, activeTournaments, goalsAgg] =
      await Promise.all([
        prisma.team.count(),
        prisma.player.count(),
        prisma.tournament.count({ where: { status: "ONGOING" } }),
        prisma.matchEvent.count({ where: { type: { in: ["GOAL", "PENALTY_SCORED"] } } }),
      ]);

    const stats: HomeStatsVM = {
      registeredTeams,
      goalsThisSeason: goalsAgg,
      activeTournaments,
      registeredPlayers,
    };

    return { status: "success", data: stats };
  } catch (error) {
    console.error("[getHomeStats]", error);
    return { status: "error", message: "تعذّر تحميل إحصائيات المنصة." };
  }
}
