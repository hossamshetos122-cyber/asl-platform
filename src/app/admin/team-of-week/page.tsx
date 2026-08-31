import { prisma } from "@/lib/prisma";
import { getFeaturedTournamentId } from "@/lib/stats";
import { TeamOfWeekForm } from "./team-of-week-form";

export const metadata = {
  title: "فريق الأسبوع | لوحة التحكم",
};

export default async function AdminTeamOfWeekPage() {
  const [tournaments, tournamentTeams, featureResult, currentLineup] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: [
        { status: "asc" },
        { startDate: "desc" },
      ],
      select: { id: true, name: true, status: true },
    }),
    prisma.tournamentTeam.findMany({
      orderBy: { team: { name: "asc" } },
      select: {
        tournamentId: true,
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            crestUrl: true,
            memberships: {
              where: { status: "ACTIVE" },
              select: {
                player: {
                  select: {
                    id: true,
                    jerseyNumber: true,
                    user: { select: { fullName: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    getFeaturedTournamentId(),
    prisma.teamOfWeekPlayer.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        tournamentId: true,
        playerId: true,
        position: true,
        sortOrder: true,
      },
    }),
  ]);

  const grouped = new Map<string, typeof tournamentTeams>();
  for (const row of tournamentTeams) {
    const list = grouped.get(row.tournamentId) ?? [];
    list.push(row);
    grouped.set(row.tournamentId, list);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h1 className="font-display text-xl font-black text-text">فريق الأسبوع</h1>
        <span className="badge-accent font-num">XI</span>
      </div>

      <TeamOfWeekForm
        tournaments={tournaments.map((t) => ({ id: t.id, name: t.name, status: t.status }))}
        candidatesByTournament={Array.from(grouped.entries()).map(([tournamentId, rows]) => ({
          tournamentId,
          teams: rows.map((row) => ({
            teamId: row.team.id,
            teamName: row.team.name,
            shortName: row.team.shortName,
            crestUrl: row.team.crestUrl,
            players: row.team.memberships.map((m) => ({
              id: m.player.id,
              fullName: m.player.user.fullName,
              jerseyNumber: m.player.jerseyNumber,
            })),
          })),
        }))}
        featuredTournamentId={featureResult.status === "success" ? featureResult.data : null}
        currentLineup={currentLineup.map((row) => ({
          tournamentId: row.tournamentId,
          playerId: row.playerId,
          position: row.position,
          sortOrder: row.sortOrder,
        }))}
      />
    </div>
  );
}