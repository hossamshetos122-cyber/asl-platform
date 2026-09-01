import { redirect } from "next/navigation";
import Link from "next/link";
import { requireTeamManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ImageDisplay } from "@/components/ui/image-display";
import { formatMatchDateTime } from "@/lib/dates";
import { getUserNotifications } from "@/lib/notify";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { ConfirmSquadButton } from "./confirm-squad-button";

export const dynamic = "force-dynamic";

const SQUAD_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكدة",
  ABSENT: "غائبة",
};

function opponentLabel(m: {
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
}, teamId: string): string {
  return m.homeTeamId === teamId ? m.awayTeam.name : m.homeTeam.name;
}

function MatchLine({ match, teamId, showScore }: {
  match: {
    id: string;
    status: string;
    kickoffAt: Date;
    venue: string | null;
    tournament: { name: string };
    homeScore: number;
    awayScore: number;
    homeTeamId: string;
    awayTeamId: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
  };
  teamId: string;
  showScore: boolean;
}) {
  const opponent = opponentLabel(match, teamId);
  const isHome = match.homeTeamId === teamId;
  return (
    <Link href={`/matches/${match.id}`} className="group flex items-center gap-3 rounded-lg border border-line/40 px-3 py-2.5 transition-all hover:bg-surface-elevated hover:border-line">
      <div className="flex-1 min-w-0">
        <div className="font-body text-[12px] font-bold text-text group-hover:text-accent transition-colors truncate">
          {showScore
            ? <>هدفنا {isHome ? match.homeScore : match.awayScore} - {isHome ? match.awayScore : match.homeScore} ضد {opponent}</>
            : <>ضد {opponent}</>}
        </div>
        <div className="mt-0.5 font-body text-[10px] text-text-dimmer truncate">
          {formatMatchDateTime(match.kickoffAt)}
          {match.venue ? ` · ${match.venue}` : ""} · {match.tournament.name}
        </div>
      </div>
      <span className="badge-muted text-[10px] flex-shrink-0">
        {match.status === "FINISHED" ? "انتهت" : match.status === "LIVE" ? "مباشر" : match.status === "HALFTIME" ? "استراحة" : match.status === "POSTPONED" ? "مؤجلة" : "مجدولة"}
      </span>
    </Link>
  );
}

export default async function ManagePage() {
  let user;
  let teams;
  try {
    const data = await requireTeamManager();
    user = data.user;
    teams = data.teams;
  } catch {
    redirect("/login?redirect=/manage");
  }
  if (!teams || teams.length === 0) redirect("/dashboard");

  const notifications = await getUserNotifications(user.id);

  const now = new Date();

  const snapshots = await Promise.all(
    teams.map(async (team) => {
      const matches = await prisma.match.findMany({
        where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] },
        orderBy: { kickoffAt: "desc" },
        take: 60,
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          tournament: { select: { name: true } },
        },
      });

      const upcoming = matches
        .filter((m) => (m.status === "SCHEDULED" || m.status === "POSTPONED") && new Date(m.kickoffAt) > now)
        .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
        .slice(0, 6);
      const results = matches.filter((m) => m.status === "FINISHED").slice(0, 4);
      const liveNow = matches.filter((m) => m.status === "LIVE" || m.status === "HALFTIME");

      const squads = await prisma.matchSquad.findMany({
        where: { teamId: team.id },
        include: {
          match: {
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
              tournament: { select: { name: true } },
            },
          },
        },
        orderBy: { match: { kickoffAt: "desc" } },
        take: 10,
      });
      const pendingSquads = squads.filter(
        (s) =>
          (s.status === "PENDING" || s.status === "ABSENT") &&
          s.match.status !== "FINISHED" &&
          s.match.status !== "CANCELLED" &&
          new Date(s.match.kickoffAt) > now
      );

      return { team, matches: upcoming, results, liveNow, pendingSquads };
    })
  );

  return (
    <>
      <Navbar />
      <section className="relative overflow-hidden bg-surface border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-elevated/50 to-surface" />
        <div className="page-container relative pt-10 sm:pt-14 pb-8 sm:pb-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/25">
              <svg className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21V8l9-5 9 5v13M9 21v-6h6v6" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-black text-text">بوابة الفريق</h1>
              <p className="mt-1 font-body text-[13px] text-text-dim">{user.fullName}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="page-container page-padding space-y-6">
        {notifications.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="border-b border-line px-4 py-3">
              <h2 className="font-display text-base font-black text-text">الإشعارات</h2>
            </div>
            <div className="p-4">
              <NotificationsList notifications={notifications} />
            </div>
          </div>
        )}

        {snapshots.map(({ team, matches, results, liveNow, pendingSquads }) => (
          <div key={team.id} className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-elevated/30 px-4 py-3">
              <ImageDisplay src={team.crestUrl} alt={`شعار ${team.name}`} type="team-logo" size="md" shortCode={team.shortName} />
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-[15px] font-black text-text">{team.name}</h2>
                <div className="font-utility text-[9px] tracking-wider text-text-dimmer uppercase">
                  {team.city} · {team._count.memberships} لاعب نشط
                </div>
              </div>
              <Link href={`/teams/${team.id}`} className="rounded-lg border border-accent/25 bg-accent/5 px-3 py-1.5 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/10">
                صفحة الفريق
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
              <div className="lg:col-span-2 space-y-4">
                {liveNow.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 font-utility text-[10px] tracking-[0.18em] text-live uppercase">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
                      جارية الآن
                    </h3>
                    <div className="space-y-2">
                      {liveNow.map((m) => (
                        <MatchLine key={m.id} match={m} teamId={team.id} showScore />
                      ))}
                    </div>
                  </div>
                )}

                {matches.length > 0 ? (
                  <div>
                    <h3 className="mb-2 font-utility text-[10px] tracking-[0.18em] text-text-dimmer uppercase">المباريات القادمة</h3>
                    <div className="space-y-2">
                      {matches.map((m) => (
                        <MatchLine key={m.id} match={m} teamId={team.id} showScore={false} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-line px-4 py-6 text-center">
                    <p className="font-body text-[12px] text-text-dim">لا توجد مباريات قادمة لفريقك حالياً.</p>
                  </div>
                )}

                {results.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-utility text-[10px] tracking-[0.18em] text-text-dimmer uppercase">آخر النتائج</h3>
                    <div className="space-y-2">
                      {results.map((m) => (
                        <MatchLine key={m.id} match={m} teamId={team.id} showScore />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-line/50 bg-surface-elevated/20 p-3.5">
                <h3 className="mb-2.5 font-utility text-[10px] tracking-[0.18em] text-text-dimmer uppercase">قوائم المباريات للتأكيد</h3>
                {pendingSquads.length === 0 ? (
                  <p className="font-body text-[11px] text-text-dim">
                    لا توجد قوائم في انتظار التأكيد.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingSquads.map((s) => (
                      <div key={s.id} className="rounded-lg border border-line/40 px-3 py-2.5">
                        <div className="font-body text-[12px] font-bold text-text">ضد {opponentLabel(s.match, team.id)}</div>
                        <div className="mt-0.5 font-body text-[10px] text-text-dimmer">{formatMatchDateTime(s.match.kickoffAt)}</div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="badge-muted text-[9px]">{SQUAD_STATUS_LABELS[s.status] ?? s.status}</span>
                          <ConfirmSquadButton squadId={s.id} status="CONFIRMED" label="تأكيد القائمة" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-3 border-t border-line/40 pt-2.5 font-body text-[10px] text-text-dimmer">
                  لا يمكنك تعديل النتائج أو بيانات الفرق الأخرى من هذه البوابة.
                </p>
              </div>
            </div>
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}