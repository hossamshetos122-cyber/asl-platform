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
    { label: "البطولات", value: tournamentCount, href: "/admin/tournaments", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { label: "الفرق", value: teamCount, href: "/admin/teams", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { label: "اللاعبين", value: playerCount, href: "/admin/players", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { label: "المباريات", value: matchCount, href: "/admin/matches", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-black text-text">لوحة التحكم</h1>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group rounded-xl border border-line bg-surface p-4 premier-card">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gold/[0.08] border border-gold/15 group-hover:bg-gold/15 transition-colors">
              <svg className="h-4.5 w-4.5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={stat.icon} /></svg>
            </div>
            <div className="font-num text-2xl font-bold text-gold">{stat.value}</div>
            <div className="mt-0.5 font-body text-[12px] text-text-dim">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-line">
          <h2 className="font-display text-base font-black text-text">آخر المباريات</h2>
        </div>
        <div className="p-4">
          {recentMatches.length === 0 ? (
            <p className="font-body text-[13px] text-text-dimmer">لا توجد مباريات بعد.</p>
          ) : (
            <div className="space-y-1.5">
              {recentMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between rounded-lg border border-line/40 px-3 py-2.5 transition-colors hover:bg-surface-elevated/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-body text-[12px] font-bold text-text truncate">{match.homeTeam.name}</span>
                    <span className="font-num text-[12px] text-gold font-bold mx-1">{match.homeScore} - {match.awayScore}</span>
                    <span className="font-body text-[12px] font-bold text-text truncate">{match.awayTeam.name}</span>
                  </div>
                  <span className={match.status === "FINISHED" ? "badge-success" : match.status === "LIVE" ? "badge-live" : "badge-muted"}>
                    {match.status === "FINISHED" ? "انتهت" : match.status === "LIVE" ? "مباشر" : "مقررة"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
