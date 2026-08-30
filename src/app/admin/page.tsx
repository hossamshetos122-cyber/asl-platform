import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSuspendedPlayers } from "@/lib/discipline";

export default async function AdminDashboard() {
  const overdueMatches = await prisma.match.findMany({
    where: {
      status: { in: ["SCHEDULED", "POSTPONED"] },
      kickoffAt: { lt: new Date() },
    },
    orderBy: { kickoffAt: "asc" },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      tournament: { select: { name: true } },
    },
  });

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

  const suspended = await getSuspendedPlayers();

  const stats = [
    { label: "البطولات", value: tournamentCount, href: "/admin/tournaments", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { label: "الفرق", value: teamCount, href: "/admin/teams", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { label: "اللاعبين", value: playerCount, href: "/admin/players", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { label: "المباريات", value: matchCount, href: "/admin/matches", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-black text-text">لوحة التحكم</h1>

      {overdueMatches.length > 0 ? (
        <div className="rounded-xl border border-live/30 bg-live/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-live/20 font-num text-sm font-bold text-live">{overdueMatches.length}</span>
            <div>
              <h2 className="font-body text-[13px] font-bold text-live">مباريات فات موعدها بدون نتيجة</h2>
              <p className="font-body text-[12px] text-live/80">سجّل نتيجتها من صفحة المباريات (اضغط &quot;حفظ وإنهاء&quot;) أو أرجئها من زر &quot;الموعد&quot;.</p>
            </div>
            <Link href="/admin/matches" className="mr-auto shrink-0 rounded-lg border border-live/40 bg-live/15 px-3 py-1.5 font-body text-[11px] font-bold text-live transition-colors hover:bg-live/25">عرض المباريات</Link>
          </div>
          <div className="mt-3 space-y-1.5">
            {overdueMatches.map((match) => (
              <Link key={match.id} href="/admin/matches" className="flex items-center justify-between rounded-lg border border-live/20 bg-surface/60 px-3 py-2 transition-colors hover:bg-surface">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-body text-[12px] font-bold text-text truncate">{match.homeTeam.name}</span>
                  <span className="font-num text-[12px] text-text-dimmer">-</span>
                  <span className="font-body text-[12px] font-bold text-text truncate">{match.awayTeam.name}</span>
                  <span className="font-body text-[10px] text-text-dimmer truncate hidden sm:inline">({match.tournament.name})</span>
                </div>
                <span className="font-body text-[11px] text-text-dimmer whitespace-nowrap">{match.kickoffAt.toLocaleDateString("ar-EG")}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 font-num text-[12px] font-bold text-emerald-500">0</span>
          <p className="font-body text-[12px] font-bold text-emerald-500">لا توجد مباريات متأخرة بدون نتيجة. كل المواعيد تحت السيطرة.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group rounded-xl border border-line bg-surface p-4 premier-card">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/[0.08] border border-accent/15 group-hover:bg-accent/15 transition-colors">
              <svg className="h-4.5 w-4.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={stat.icon} /></svg>
            </div>
            <div className="font-num text-2xl font-bold text-accent">{stat.value}</div>
            <div className="mt-0.5 font-body text-[12px] text-text-dim">{stat.label}</div>
          </Link>
        ))}
      </div>

      {suspended.length > 0 ? (
        <Link href="/admin/suspensions" className="group flex items-center gap-3 rounded-xl border border-live/30 bg-live/10 px-4 py-3 transition-colors hover:bg-live/15">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-live/20 font-num text-[13px] font-bold text-live">{suspended.length}</span>
          <div>
            <p className="font-body text-[13px] font-bold text-live">لاعبون موقوفون عن المباراة القادمة</p>
            <p className="font-body text-[11px] text-live/80">عرض قائمة الموقوفين مع سبب الإيقاف والمباراة القادمة</p>
          </div>
          <span className="mr-auto font-body text-[11px] font-bold text-live group-hover:underline">عرض القائمة</span>
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 font-num text-[12px] font-bold text-emerald-500">0</span>
          <p className="font-body text-[12px] font-bold text-emerald-500">لا يوجد لاعبون موقوفون عن المباراة القادمة.</p>
        </div>
      )}

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
                    <span className="font-num text-[12px] text-accent font-bold mx-1">{match.homeScore} - {match.awayScore}</span>
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
