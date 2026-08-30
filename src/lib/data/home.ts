import { prisma } from "@/lib/prisma";
import { getFeaturedTournament } from "@/lib/stats";
import type {
  LatestResultVM,
  LiveMatchVM,
  Result,
  TeamSummaryVM,
  UpcomingMatchVM,
} from "@/lib/types";
import type { Team } from "@prisma/client";

function toTeamSummary(team: Team): TeamSummaryVM {
  return {
    id: team.id,
    name: team.name,
    shortCode: team.shortName,
    crestUrl: team.crestUrl,
  };
}

/**
 * All standpoints (standings, top scorers, goal counts, matches played,
 * home stats) live in @/lib/stats — the single source of truth. Only the
 * time-based home panels are here (live banner, upcoming, latest results),
 * scoped to the featured tournament so they always agree with the table and
 * scorers list on the same page.
 */

/**
 * Returns the single most relevant live/halftime match for the hero banner
 * inside the featured tournament (falls back to any live match when the
 * featured tournament has none, so the banner never goes dark).
 */
export async function getFeaturedLiveMatch(): Promise<Result<LiveMatchVM>> {
  try {
    const featured = await getFeaturedTournament();
    const liveStatuses = ["LIVE", "HALFTIME"];
    const baseWhere =
      featured.status === "success"
        ? { status: { in: liveStatuses }, tournamentId: featured.data.id }
        : { status: { in: liveStatuses } };

    const match = await prisma.match.findFirst({
      where: baseWhere,
      orderBy: { kickoffAt: "desc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { name: true } },
      },
    });

    if (!match && featured.status === "success") {
      // No live fixture in the featured tournament — surface any live match.
      return getFeaturedLiveMatchAnywhere();
    }

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

async function getFeaturedLiveMatchAnywhere(): Promise<Result<LiveMatchVM>> {
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
    const featured = await getFeaturedTournament();
    const where =
      featured.status === "success"
        ? {
            status: "SCHEDULED" as const,
            tournamentId: featured.data.id,
            kickoffAt: { gte: new Date() },
          }
        : { status: "SCHEDULED" as const, kickoffAt: { gte: new Date() } };

    const matches = await prisma.match.findMany({
      where,
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
      venueImageUrl: m.venueImageUrl,
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
    const featured = await getFeaturedTournament();
    const where =
      featured.status === "success"
        ? { status: "FINISHED" as const, tournamentId: featured.data.id }
        : { status: "FINISHED" as const };

    const matches = await prisma.match.findMany({
      where,
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
      venueImageUrl: m.venueImageUrl,
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