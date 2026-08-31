import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export type RefereeEventVM = {
  id: string;
  type: string;
  minute: number;
  playerName: string;
  teamId: string;
};

export type RefereeMatchVM = {
  id: string;
  tournamentName: string;
  round: string | null;
  status: string;
  venue: string | null;
  homeTeam: { id: string; name: string; shortCode: string };
  awayTeam: { id: string; name: string; shortCode: string };
  homeScore: number;
  awayScore: number;
  minute: number | null;
  events: RefereeEventVM[];
};

/**
 * Matches visible in the referee portal. Referees see only the fixtures
 * assigned to them; admins see all fixtures (so they can also drive the
 * scoreboard from here if needed).
 */
export async function getRefereeMatches(user: User): Promise<RefereeMatchVM[]> {
  const profile = user.role === "ADMIN"
    ? null
    : await prisma.referee.findUnique({ where: { userId: user.id }, select: { id: true } });

  let matches;
  if (user.role === "ADMIN") {
    matches = await prisma.match.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      orderBy: [{ status: "asc" }, { kickoffAt: "desc" }],
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { name: true } },
        events: {
          include: { player: { include: { user: { select: { fullName: true } } } } },
          orderBy: { minute: "asc" },
        },
      },
    });
  } else {
    if (!profile) {
      return [];
    }
    matches = await prisma.match.findMany({
      where: { refereeId: profile.id, status: { notIn: ["CANCELLED"] } },
      orderBy: [{ status: "asc" }, { kickoffAt: "desc" }],
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { name: true } },
        events: {
          include: { player: { include: { user: { select: { fullName: true } } } } },
          orderBy: { minute: "asc" },
        },
      },
    });
  }

  return matches.map((m) => ({
    id: m.id,
    tournamentName: m.tournament.name,
    round: m.round,
    status: m.status,
    venue: m.venue,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, shortCode: m.homeTeam.shortName },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, shortCode: m.awayTeam.shortName },
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    minute: m.minute,
    events: m.events.map((e) => ({
      id: e.id,
      type: e.type,
      minute: e.minute,
      playerName: e.player.user.fullName,
      teamId: e.teamId,
    })),
  }));
}

/** Active roster of a team (players to pick from when adding events). */
export async function getTeamPlayers(teamId: string): Promise<{ id: string; name: string; jerseyNumber: number | null }[]> {
  const memberships = await prisma.teamMembership.findMany({
    where: { teamId, status: "ACTIVE" },
    include: { player: { include: { user: { select: { fullName: true } } } } },
    orderBy: { player: { jerseyNumber: "asc" } },
  });
  return memberships.map((m) => ({
    id: m.player.id,
    name: m.player.user.fullName,
    jerseyNumber: m.player.jerseyNumber,
  }));
}