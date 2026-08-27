import { prisma } from "@/lib/prisma";
import TeamsTable from "./teams-table";

export const metadata = {
  title: "إدارة الفرق | لوحة التحكم",
};

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { memberships: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h1 className="font-display text-xl font-black text-text">الفرق</h1>
        <span className="badge-gold font-num">{teams.length}</span>
      </div>
      <TeamsTable teams={teams} />
    </div>
  );
}
