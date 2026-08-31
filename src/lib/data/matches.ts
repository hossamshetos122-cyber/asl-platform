import { prisma } from "@/lib/prisma";
import type { Result, MatchSummaryVM, MatchDetailVM, MatchSquadVM, MatchSquadPlayerVM } from "@/lib/types";


export async function getMatches(statusFilter?: string, teamId?: string): Promise<Result<MatchSummaryVM[]>> {
  try {
    const matches = await prisma.match.findMany({
      where: teamId
        ? {
            status: statusFilter ?? { notIn: ["CANCELLED"] },
            OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
          }
        : statusFilter
          ? { status: statusFilter }
          : { status: { notIn: ["CANCELLED"] } },
      orderBy: { kickoffAt: "desc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { name: true } },
      },
    });

    if (matches.length === 0) {
      return { status: "empty" };
    }

    const vms: MatchSummaryVM[] = matches.map((m) => ({
      id: m.id,
      tournamentName: m.tournament.name,
      round: m.round,
      status: m.status,
      kickoffAt: m.kickoffAt,
      venue: m.venue,
      venueImageUrl: m.venueImageUrl,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
        shortCode: m.homeTeam.shortName,
        crestUrl: m.homeTeam.crestUrl,
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
        shortCode: m.awayTeam.shortName,
        crestUrl: m.awayTeam.crestUrl,
      },
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      minute: m.minute,
    }));

    return { status: "success", data: vms };
  } catch (error) {
    console.error("[getMatches]", error);
    return { status: "error", message: "تعذّر تحميل المباريات." };
  }
}

function mapSquad(
  squad: {
    id: string;
    teamId: string;
    status: string;
    team: { id: string; name: string; crestUrl: string | null };
    players: {
      playerId: string;
      isStarter: boolean;
      sortOrder: number | null;
      player: {
        id: string;
        photoUrl: string | null;
        jerseyNumber: number | null;
        position: string;
        user: { fullName: string };
      };
    }[];
  } | null
): MatchSquadVM | null {
  if (!squad) return null;

  const players: MatchSquadPlayerVM[] = squad.players
    .sort((a, b) => {
      if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
      if (a.sortOrder !== null && b.sortOrder !== null) return a.sortOrder - b.sortOrder;
      if (a.sortOrder !== null) return -1;
      if (b.sortOrder !== null) return 1;
      return 0;
    })
    .map((sp) => ({
      playerId: sp.player.id,
      playerName: sp.player.user.fullName,
      photoUrl: sp.player.photoUrl,
      jerseyNumber: sp.player.jerseyNumber,
      position: sp.player.position,
      isStarter: sp.isStarter,
      sortOrder: sp.sortOrder,
    }));

  const starters = players.filter((p) => p.isStarter).length;
  const subs = players.filter((p) => !p.isStarter).length;

  return {
    squadId: squad.id,
    teamId: squad.teamId,
    teamName: squad.team.name,
    teamCrestUrl: squad.team.crestUrl,
    status: squad.status as "PENDING" | "CONFIRMED" | "ABSENT",
    players,
    starters,
    subs,
    squadSize: players.length,
    isXIComplete: starters === 11,
  };
}

export async function getMatchById(id: string): Promise<Result<MatchDetailVM>> {
  try {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { name: true } },
        events: {
          include: {
            player: { include: { user: { select: { fullName: true } } } },
          },
          orderBy: { minute: "asc" },
        },
        squads: {
          include: {
            team: true,
            players: {
              include: {
                player: {
                  include: { user: { select: { fullName: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!match) {
      return { status: "empty" };
    }

    const events = match.events.map((e) => ({
      id: e.id,
      type: e.type,
      minute: e.minute,
      playerName: e.player.user.fullName,
      playerId: e.player.id,
      photoUrl: e.player.photoUrl,
      teamName: e.teamId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name,
      teamId: e.teamId,
    }));

    const homeSquadRaw = match.squads.find((s) => s.teamId === match.homeTeamId);
    const awaySquadRaw = match.squads.find((s) => s.teamId === match.awayTeamId);

    const vm: MatchDetailVM = {
      id: match.id,
      tournamentName: match.tournament.name,
      round: match.round,
      status: match.status,
      kickoffAt: match.kickoffAt,
      venue: match.venue,
      venueImageUrl: match.venueImageUrl,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        shortCode: match.homeTeam.shortName,
        crestUrl: match.homeTeam.crestUrl,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        shortCode: match.awayTeam.shortName,
        crestUrl: match.awayTeam.crestUrl,
      },
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      minute: match.minute,
      events,
      homeSquad: mapSquad(homeSquadRaw ?? null),
      awaySquad: mapSquad(awaySquadRaw ?? null),
    };

    return { status: "success", data: vm };
  } catch (error) {
    console.error("[getMatchById]", error);
    return { status: "error", message: "تعذّر تحميل تفاصيل المباراة." };
  }
}

export async function getMatchesByTournament(tournamentId: string): Promise<Result<MatchSummaryVM[]>> {
  try {
    const matches = await prisma.match.findMany({
      where: { tournamentId },
      orderBy: { kickoffAt: "desc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { name: true } },
      },
    });

    if (matches.length === 0) {
      return { status: "empty" };
    }

    const vms: MatchSummaryVM[] = matches.map((m) => ({
      id: m.id,
      tournamentName: m.tournament.name,
      round: m.round,
      status: m.status,
      kickoffAt: m.kickoffAt,
      venue: m.venue,
      venueImageUrl: m.venueImageUrl,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
        shortCode: m.homeTeam.shortName,
        crestUrl: m.homeTeam.crestUrl,
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
        shortCode: m.awayTeam.shortName,
        crestUrl: m.awayTeam.crestUrl,
      },
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      minute: m.minute,
    }));

    return { status: "success", data: vms };
  } catch (error) {
    console.error("[getMatchesByTournament]", error);
    return { status: "error", message: "تعذّر تحميل مباريات البطولة." };
  }
}

export type MatchSquadAdminVM = {
  squadId: string;
  teamId: string;
  teamName: string;
  teamCrestUrl: string | null;
  status: string;
  players: {
    playerId: string;
    playerName: string;
    photoUrl: string | null;
    jerseyNumber: number | null;
    position: string;
    isStarter: boolean;
    sortOrder: number | null;
  }[];
};

export type MatchAdminDetailVM = {
  id: string;
  homeTeam: { id: string; name: string; crestUrl: string | null };
  awayTeam: { id: string; name: string; crestUrl: string | null };
  status: string;
  kickoffAt: Date;
  homeSquad: MatchSquadAdminVM | null;
  awaySquad: MatchSquadAdminVM | null;
};

export async function getMatchAdminDetail(matchId: string): Promise<Result<MatchAdminDetailVM>> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        squads: {
          include: {
            team: true,
            players: {
              include: {
                player: {
                  include: { user: { select: { fullName: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!match) return { status: "empty" };

    const mapAdminSquad = (
      squad: typeof match.squads[0] | null
    ): MatchSquadAdminVM | null => {
      if (!squad) return null;
      return {
        squadId: squad.id,
        teamId: squad.teamId,
        teamName: squad.team.name,
        teamCrestUrl: squad.team.crestUrl,
        status: squad.status,
        players: squad.players.map((sp) => ({
          playerId: sp.player.id,
          playerName: sp.player.user.fullName,
          photoUrl: sp.player.photoUrl,
          jerseyNumber: sp.player.jerseyNumber,
          position: sp.player.position,
          isStarter: sp.isStarter,
          sortOrder: sp.sortOrder,
        })),
      };
    };

    const homeSquadRaw = match.squads.find((s) => s.teamId === match.homeTeamId);
    const awaySquadRaw = match.squads.find((s) => s.teamId === match.awayTeamId);

    return {
      status: "success",
      data: {
        id: match.id,
        homeTeam: { id: match.homeTeam.id, name: match.homeTeam.name, crestUrl: match.homeTeam.crestUrl },
        awayTeam: { id: match.awayTeam.id, name: match.awayTeam.name, crestUrl: match.awayTeam.crestUrl },
        status: match.status,
        kickoffAt: match.kickoffAt,
        homeSquad: mapAdminSquad(homeSquadRaw ?? null),
        awaySquad: mapAdminSquad(awaySquadRaw ?? null),
      },
    };
  } catch (error) {
    console.error("[getMatchAdminDetail]", error);
    return { status: "error", message: "تعذّر تحميل تفاصيل المباراة." };
  }
}

export type TeamRosterPlayerVM = {
  id: string;
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  position: string;
};

export async function getTeamActiveRoster(teamId: string): Promise<TeamRosterPlayerVM[]> {
  const memberships = await prisma.teamMembership.findMany({
    where: { teamId, status: "ACTIVE" },
    include: {
      player: {
        include: { user: { select: { fullName: true } } },
      },
    },
    orderBy: { player: { jerseyNumber: "asc" } },
  });

  return memberships.map((m) => ({
    id: m.player.id,
    name: m.player.user.fullName,
    photoUrl: m.player.photoUrl,
    jerseyNumber: m.player.jerseyNumber,
    position: m.player.position,
  }));
}
