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
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-line pb-5">
        <h1 className="font-display text-2xl font-extrabold text-text">
          الفرق
        </h1>
        <span className="rounded-sm border border-line-gold px-2.5 py-1 font-utility text-[11px] tracking-wide text-gold">
          {teams.length}
        </span>
      </div>

      <TeamsTable teams={teams} />
    </div>
  );
}
