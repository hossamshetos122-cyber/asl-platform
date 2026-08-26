import { prisma } from "@/lib/prisma";
import PlayersTable from "./players-table";

export const metadata = {
  title: "إدارة اللاعبين | لوحة التحكم",
};

export default async function AdminPlayersPage() {
  const [players, teams] = await Promise.all([
    prisma.player.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        memberships: {
          where: { status: "ACTIVE" },
          include: { team: { select: { name: true } } },
          take: 1,
        },
      },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            memberships: { where: { status: "ACTIVE" } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-line pb-5">
        <h1 className="font-display text-2xl font-extrabold text-text">
          اللاعبين
        </h1>
        <span className="rounded-sm border border-line-gold px-2.5 py-1 font-utility text-[11px] tracking-wide text-gold">
          {players.length}
        </span>
      </div>

      <PlayersTable players={players} teams={teams} />
    </div>
  );
}
