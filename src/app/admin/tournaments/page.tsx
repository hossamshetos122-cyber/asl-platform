import { prisma } from "@/lib/prisma";
import TournamentsTable from "./tournaments-table";

export const metadata = {
  title: "إدارة البطولات | لوحة التحكم",
};

export default async function AdminTournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { teams: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-line pb-5">
        <h1 className="font-display text-2xl font-extrabold text-text">
          البطولات
        </h1>
        <span className="rounded-sm border border-line-gold px-2.5 py-1 font-utility text-[11px] tracking-wide text-gold">
          {tournaments.length}
        </span>
      </div>

      <TournamentsTable
        tournaments={tournaments.map((t) => ({ ...t, startDate: t.startDate.toISOString() }))}
      />
    </div>
  );
}
