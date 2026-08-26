import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [teamCount, playerCount, matchCount, tournamentCount, recentMatches] = await Promise.all([
    prisma.team.count(),
    prisma.player.count(),
    prisma.match.count(),
    prisma.tournament.count(),
    prisma.match.findMany({
      orderBy: { kickoffAt: "desc" },
      take: 5,
      include: { homeTeam: true, awayTeam: true, tournament: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { label: "البطولات", value: tournamentCount, href: "/admin/tournaments", color: "text-gold" },
    { label: "الفرق", value: teamCount, href: "/admin/teams", color: "text-blue-400" },
    { label: "اللاعبين", value: playerCount, href: "/admin/players", color: "text-green-400" },
    { label: "المباريات", value: matchCount, href: "/admin/matches", color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="section-title">لوحة التحكم</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card-hover p-4 sm:p-5">
            <div className={`font-num text-3xl sm:text-4xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="mt-1 font-body text-sm text-text-dim">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Matches */}
      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 section-title text-lg">آخر المباريات</h2>
        {recentMatches.length === 0 ? (
          <p className="font-body text-sm text-text-dimmer">لا توجد مباريات بعد.</p>
        ) : (
          <div className="space-y-2">
            {recentMatches.map((match) => (
              <div key={match.id} className="flex items-center justify-between rounded-lg border border-line px-4 py-3 transition-colors hover:bg-bg-raised2/50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-body text-sm font-bold text-text truncate">{match.homeTeam.name}</span>
                  <span className="font-num text-sm text-gold mx-1">{match.homeScore} - {match.awayScore}</span>
                  <span className="font-body text-sm font-bold text-text truncate">{match.awayTeam.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={match.status === "FINISHED" ? "badge-success" : match.status === "LIVE" ? "badge-live" : "badge-muted"}>
                    {match.status === "FINISHED" ? "انتهت" : match.status === "LIVE" ? "مباشر" : match.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
