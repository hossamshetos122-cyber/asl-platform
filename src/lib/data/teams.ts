import { prisma } from "@/lib/prisma";
import type { Result, TeamSummaryVM, TeamDetailVM } from "@/lib/types";

export async function getTeams(): Promise<Result<TeamSummaryVM[]>> {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
    });

    if (teams.length === 0) {
      return { status: "empty" };
    }

    const vms: TeamSummaryVM[] = teams.map((t) => ({
      id: t.id,
      name: t.name,
      shortCode: t.shortName,
      crestUrl: t.crestUrl,
      city: t.city,
    }));

    return { status: "success", data: vms };
  } catch (error) {
    console.error("[getTeams]", error);
    return { status: "error", message: "تعذّر تحميل الفرق." };
  }
}

export async function getTeamById(id: string): Promise<Result<TeamDetailVM>> {
  try {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            player: {
              include: {
                user: { select: { fullName: true } },
                matchEvents: { where: { type: { in: ["GOAL", "PENALTY_SCORED"] } }, select: { id: true } },
              },
            },
          },
          orderBy: { player: { jerseyNumber: "asc" } },
        },
        tournamentEntries: {
          include: { tournament: { select: { id: true, name: true } } },
        },
      },
    });

    if (!team) {
      return { status: "empty" };
    }

    const vm: TeamDetailVM = {
      id: team.id,
      name: team.name,
      shortCode: team.shortName,
      city: team.city,
      crestUrl: team.crestUrl,
      foundedAt: team.foundedAt,
      ownerId: team.ownerId,
      playerCount: team.memberships.length,
      squadLimit: 20,
      players: team.memberships.map((m) => ({
        id: m.player.id,
        name: m.player.user.fullName,
        photoUrl: m.player.photoUrl,
        jerseyNumber: m.player.jerseyNumber,
        position: m.player.position,
        goals: m.player.matchEvents.length,
      })),
      tournaments: team.tournamentEntries.map((te) => ({
        id: te.tournament.id,
        name: te.tournament.name,
      })),
    };

    return { status: "success", data: vm };
  } catch (error) {
    console.error("[getTeamById]", error);
    return { status: "error", message: "تعذّر تحميل تفاصيل الفريق." };
  }
}

export async function getTeamSquadSize(teamId: string): Promise<number> {
  try {
    return await prisma.teamMembership.count({
      where: { teamId, status: "ACTIVE" },
    });
  } catch (error) {
    console.error("[getTeamSquadSize]", error);
    return 0;
  }
}
