import { prisma } from "@/lib/prisma";
import type { Result, PlayerProfileVM } from "@/lib/types";

export async function getPlayerById(id: string): Promise<Result<PlayerProfileVM>> {
  try {
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true } },
        memberships: {
          where: { status: "ACTIVE" },
          include: { team: { select: { id: true, name: true, crestUrl: true } } },
          take: 1,
        },
        matchEvents: { where: { type: { in: ["GOAL", "PENALTY_SCORED"] } }, select: { id: true } },
      },
    });

    if (!player) {
      return { status: "empty" };
    }

    const membership = player.memberships[0];
    const team = membership
      ? { id: membership.team.id, name: membership.team.name, crestUrl: membership.team.crestUrl }
      : null;

    let matchesPlayed = 0;
    if (team) {
      const squadAppearances = await prisma.matchSquadPlayer.count({
        where: {
          playerId: id,
          squad: {
            match: { status: "FINISHED" },
          },
        },
      });
      matchesPlayed = squadAppearances;
    }

    const vm: PlayerProfileVM = {
      id: player.id,
      name: player.user.fullName,
      photoUrl: player.photoUrl,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      dateOfBirth: player.dateOfBirth,
      team,
      goals: player.matchEvents.length,
      matchesPlayed,
    };

    return { status: "success", data: vm };
  } catch (error) {
    console.error("[getPlayerById]", error);
    return { status: "error", message: "تعذّر تحميل ملف اللاعب." };
  }
}
