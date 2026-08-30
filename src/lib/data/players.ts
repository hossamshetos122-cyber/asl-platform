import { prisma } from "@/lib/prisma";
import { getPlayerGoalCounts, getPlayerMatchesPlayedCounts } from "@/lib/stats";
import { getPlayerDiscipline } from "@/lib/discipline";
import type { Result, PlayerProfileVM, PlayerListItemVM } from "@/lib/types";

export async function getPlayersList(): Promise<Result<PlayerListItemVM[]>> {
  try {
    const players = await prisma.player.findMany({
      orderBy: { user: { fullName: "asc" } },
      include: {
        user: { select: { fullName: true } },
        memberships: {
          where: { status: "ACTIVE" },
          include: { team: { select: { id: true, name: true, crestUrl: true } } },
          take: 1,
        },
      },
    });

    const goalCounts = await getPlayerGoalCounts(players.map((p) => p.id));

    const list = players.map((player) => {
      const membership = player.memberships[0];
      return {
        id: player.id,
        name: player.user.fullName,
        photoUrl: player.photoUrl,
        jerseyNumber: player.jerseyNumber,
        position: player.position,
        team: membership
          ? { id: membership.team.id, name: membership.team.name, crestUrl: membership.team.crestUrl }
          : null,
        goals: goalCounts.get(player.id) ?? 0,
      };
    });

    return { status: "success", data: list };
  } catch (error) {
    console.error("[getPlayersList]", error);
    return { status: "error", message: "تعذّر تحميل قائمة اللاعبين." };
  }
}

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
      },
    });

    if (!player) {
      return { status: "empty" };
    }

    const membership = player.memberships[0];
    const team = membership
      ? { id: membership.team.id, name: membership.team.name, crestUrl: membership.team.crestUrl }
      : null;

    const [goalsByPlayer, matchesPlayedByPlayer, discipline] = await Promise.all([
      getPlayerGoalCounts([id]),
      getPlayerMatchesPlayedCounts([id]),
      getPlayerDiscipline(id, team?.id ?? null),
    ]);

    const vm: PlayerProfileVM = {
      id: player.id,
      name: player.user.fullName,
      photoUrl: player.photoUrl,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      dateOfBirth: player.dateOfBirth,
      team,
      goals: goalsByPlayer.get(id) ?? 0,
      matchesPlayed: matchesPlayedByPlayer.get(id) ?? 0,
      yellows: discipline.yellows,
      reds: discipline.reds,
      suspendedNext: discipline.suspendedNext,
      suspendedReason: discipline.reason,
      nextFixture: discipline.suspendedNext ? discipline.nextFixture : null,
    };

    return { status: "success", data: vm };
  } catch (error) {
    console.error("[getPlayerById]", error);
    return { status: "error", message: "تعذّر تحميل ملف اللاعب." };
  }
}
