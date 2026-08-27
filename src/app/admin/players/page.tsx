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
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h1 className="font-display text-xl font-black text-text">اللاعبين</h1>
        <span className="badge-gold font-num">{players.length}</span>
      </div>
      <PlayersTable players={players} teams={teams} />
    </div>
  );
}
