import { prisma } from "@/lib/prisma";
import MatchesTable from "./matches-table";

export const metadata = {
  title: "إدارة المباريات | لوحة التحكم",
};

export default async function AdminMatchesPage() {
  const [matches, teams, tournaments] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-line pb-5">
        <h1 className="font-display text-2xl font-extrabold text-text">
          المباريات
        </h1>
        <span className="rounded-sm border border-line-gold px-2.5 py-1 font-utility text-[11px] tracking-wide text-gold">
          {matches.length}
        </span>
      </div>

      <MatchesTable
        matches={matches.map((m) => ({ ...m, kickoffAt: m.kickoffAt.toISOString() }))}
        teams={teams}
        tournaments={tournaments}
      />
    </div>
  );
}
