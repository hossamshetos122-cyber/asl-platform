import { prisma } from "@/lib/prisma";
import MatchesTable, { type GoalPlayerOption, type EventLite } from "./matches-table";

export const metadata = {
  title: "إدارة المباريات | لوحة التحكم",
};

export default async function AdminMatchesPage() {
  const [matches, teams, tournaments, referees] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoffAt: "desc" },
      include: {
        homeTeam: { select: { name: true, shortName: true } },
        awayTeam: { select: { name: true, shortName: true } },
        tournament: { select: { name: true, id: true } },
      },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.tournament.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    }),
    prisma.referee.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { user: { fullName: "asc" } },
    }),
  ]);
  const refereesOptions = referees.map((r) => ({ id: r.id, fullName: r.user.fullName }));

  const matchIds = matches.map((m) => m.id);

  const [memberships, events] = await Promise.all([
    prisma.teamMembership.findMany({
      where: { status: "ACTIVE" },
      select: {
        teamId: true,
        player: {
          select: {
            id: true,
            jerseyNumber: true,
            user: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.matchEvent.findMany({
      where: {
        matchId: { in: matchIds },
        type: { in: ["GOAL", "ASSIST", "YELLOW_CARD", "RED_CARD"] },
      },
      select: { matchId: true, playerId: true, teamId: true, type: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const playersByTeam: Record<string, GoalPlayerOption[]> = {};
  for (const mb of memberships) {
    const list = (playersByTeam[mb.teamId] ??= []);
    list.push({
      id: mb.player.id,
      name: mb.player.user.fullName,
      jerseyNumber: mb.player.jerseyNumber,
    });
  }
  for (const list of Object.values(playersByTeam)) {
    list.sort(
      (a, b) =>
        (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999) ||
        a.name.localeCompare(b.name, "ar")
    );
  }

  const eventsByMatch: Record<string, EventLite[]> = {};
  for (const ev of events) {
    (eventsByMatch[ev.matchId] ??= []).push({
      playerId: ev.playerId,
      teamId: ev.teamId,
      type: ev.type as EventLite["type"],
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h1 className="font-display text-xl font-black text-text">المباريات</h1>
        <span className="badge-accent font-num">{matches.length}</span>
      </div>
      <MatchesTable
        matches={matches.map((m) => ({ ...m, kickoffAt: m.kickoffAt.toISOString() }))}
        teams={teams}
        tournaments={tournaments}
        referees={refereesOptions}
        playersByTeam={playersByTeam}
        eventsByMatch={eventsByMatch}
      />
    </div>
  );
}