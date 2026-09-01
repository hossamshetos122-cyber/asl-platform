import { prisma } from "@/lib/prisma";
import { getPlayerAssistCounts, getPlayerGoalCounts, getPlayerMatchesPlayedCounts, OFFICIAL_MATCH_STATUS } from "@/lib/stats";
import { getPlayerDiscipline } from "@/lib/discipline";
import type { Result, PlayerProfileVM, PlayerListItemVM } from "@/lib/types";

export async function getPlayerMatchLog(
  playerId: string,
  teamId: string | null
): Promise<{
  cleanSheets: number;
  matchLog: PlayerProfileVM["matchLog"];
}> {
  if (!teamId) return { cleanSheets: 0, matchLog: [] };

  const entries = await prisma.matchSquadPlayer.findMany({
    where: {
      playerId,
      squad: {
        status: "CONFIRMED",
        teamId,
        match: { status: OFFICIAL_MATCH_STATUS },
      },
    },
    select: {
      squad: {
        select: {
          teamId: true,
          match: {
            select: {
              id: true,
              kickoffAt: true,
              homeScore: true,
              awayScore: true,
              homeTeamId: true,
              awayTeamId: true,
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
              tournament: { select: { name: true } },
              events: {
                where: { playerId },
                select: { type: true },
              },
            },
          },
        },
      },
    },
    orderBy: { squad: { match: { kickoffAt: "desc" } } },
  });

  let cleanSheets = 0;
  const matchLog: PlayerProfileVM["matchLog"] = [];

  for (const entry of entries) {
    const m = entry.squad.match;
    const ownTeamIsHome = m.homeTeamId === teamId;
    const teamScore = ownTeamIsHome ? m.homeScore : m.awayScore;
    const opponentScore = ownTeamIsHome ? m.awayScore : m.homeScore;
    const ownPlayerGoals = m.events.filter((e) => e.type === "GOAL" || e.type === "PENALTY_SCORED").length;
    const ownPlayerAssists = m.events.filter((e) => e.type === "ASSIST").length;

    if (opponentScore === 0) cleanSheets += 1;

    matchLog.push({
      matchId: m.id,
      tournamentName: m.tournament.name,
      kickoffAt: m.kickoffAt,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      ownTeamIsHome,
      teamName: ownTeamIsHome ? m.homeTeam.name : m.awayTeam.name,
      teamScore,
      opponentScore,
      won: teamScore > opponentScore,
      drew: teamScore === opponentScore,
      goals: ownPlayerGoals,
      assists: ownPlayerAssists,
    });
  }

  return { cleanSheets, matchLog };
}

const FAKE_EMAIL_SUFFIX = "@asl-platform.local";

function hasRealPlayerEmail(email: string): boolean {
  return !email.toLowerCase().endsWith(FAKE_EMAIL_SUFFIX);
}

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
    const assistCounts = await getPlayerAssistCounts(players.map((p) => p.id));

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
        assists: assistCounts.get(player.id) ?? 0,
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
        user: { select: { fullName: true, email: true, phone: true } },
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

    const [goalsByPlayer, assistsByPlayer, matchesPlayedByPlayer, discipline, history] = await Promise.all([
      getPlayerGoalCounts([id]),
      getPlayerAssistCounts([id]),
      getPlayerMatchesPlayedCounts([id]),
      getPlayerDiscipline(id, team?.id ?? null),
      getPlayerMatchLog(id, team?.id ?? null),
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
      assists: assistsByPlayer.get(id) ?? 0,
      matchesPlayed: matchesPlayedByPlayer.get(id) ?? 0,
      cleanSheets: history.cleanSheets,
      yellows: discipline.yellows,
      reds: discipline.reds,
      suspendedNext: discipline.suspendedNext,
      suspendedReason: discipline.reason,
      nextFixture: discipline.suspendedNext ? discipline.nextFixture : null,
      matchLog: history.matchLog,
      accountClaimable: !hasRealPlayerEmail(player.user.email),
      phoneSet: Boolean(player.user.phone),
    };

    return { status: "success", data: vm };
  } catch (error) {
    console.error("[getPlayerById]", error);
    return { status: "error", message: "تعذّر تحميل ملف اللاعب." };
  }
}
