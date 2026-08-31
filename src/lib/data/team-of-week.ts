import { prisma } from "@/lib/prisma";
import {
  getFeaturedTournament,
  getPlayerAssistCounts,
  getPlayerGoalCounts,
} from "@/lib/stats";
import type {
  Result,
  TeamOfWeekPlayerVM,
  TeamOfWeekPosition,
  TeamOfWeekVM,
} from "@/lib/types";

const POSITION_ORDER: Record<TeamOfWeekPosition, number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  FW: 3,
};

/**
 * The "Team of the Week" — an admin-chosen starting XI of the best players
 * across the featured tournament's clubs. Goals/assists come from the same
 * canonical sources (featured tournament, FINISHED matches) used everywhere
 * else on the site, so the lineup always agrees with scorers/assisters lists.
 */
export async function getTeamOfWeek(): Promise<Result<TeamOfWeekVM>> {
  try {
    const featured = await getFeaturedTournament();
    if (featured.status !== "success") {
      return { status: "empty" };
    }

    const rows = await prisma.teamOfWeekPlayer.findMany({
      where: { tournamentId: featured.data.id },
      include: {
        player: {
          include: {
            user: { select: { fullName: true } },
            memberships: {
              where: { status: "ACTIVE" },
              include: {
                team: { select: { id: true, name: true, shortName: true, crestUrl: true } },
              },
              take: 1,
            },
          },
        },
      },
    });

    if (rows.length === 0) {
      return { status: "empty" };
    }

    const playerIds = rows.map((r) => r.playerId);
    const [goals, assists] = await Promise.all([
      getPlayerGoalCounts(playerIds),
      getPlayerAssistCounts(playerIds),
    ]);

    const players: TeamOfWeekPlayerVM[] = rows
      .map((row) => {
        const team = row.player.memberships[0]?.team ?? null;
        if (!team) return null;
        return {
          playerId: row.player.id,
          name: row.player.user.fullName,
          photoUrl: row.player.photoUrl,
          jerseyNumber: row.player.jerseyNumber,
          position: row.position as TeamOfWeekPosition,
          sortOrder: row.sortOrder,
          goals: goals.get(row.playerId) ?? 0,
          assists: assists.get(row.playerId) ?? 0,
          team,
        };
      })
      .filter((row): row is TeamOfWeekPlayerVM => row !== null)
      .sort(
        (a, b) =>
          POSITION_ORDER[a.position] - POSITION_ORDER[b.position] ||
          a.sortOrder - b.sortOrder
      );

    return {
      status: "success",
      data: {
        tournamentId: featured.data.id,
        tournamentName: featured.data.name,
        players,
      },
    };
  } catch (error) {
    console.error("[getTeamOfWeek]", error);
    return { status: "error", message: "تعذّر تحميل فريق الأسبوع." };
  }
}