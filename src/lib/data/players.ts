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
        matchEvents: { where: { type: "GOAL" }, select: { id: true } },
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
      const matchIds = await prisma.matchEvent.findMany({
        where: { playerId: id },
        select: { matchId: true },
        distinct: ["matchId"],
      });
      matchesPlayed = matchIds.length;
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
