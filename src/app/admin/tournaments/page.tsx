import { prisma } from "@/lib/prisma";
import TournamentsTable from "./tournaments-table";

export const metadata = {
  title: "إدارة البطولات | لوحة التحكم",
};

export default async function AdminTournamentsPage() {
  const [tournaments, teams] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { teams: true } },
        teams: {
          include: { team: { select: { id: true, name: true, shortName: true } } },
        },
      },
    }),
    prisma.team.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h1 className="font-display text-xl font-black text-text">البطولات</h1>
        <span className="badge-accent font-num">{tournaments.length}</span>
      </div>
      <TournamentsTable
        tournaments={tournaments.map((t) => ({
          ...t,
          startDate: t.startDate.toISOString(),
          teams: t.teams.map((te) => ({ id: te.team.id, name: te.team.name, shortName: te.team.shortName })),
        }))}
        allTeams={teams}
      />
    </div>
  );
}
