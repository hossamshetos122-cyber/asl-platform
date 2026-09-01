import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getMatchById } from "@/lib/data/matches";
import { TeamBadge } from "@/components/ui/team-badge";
import { ImageDisplay } from "@/components/ui/image-display";
import { LiveMatchUI } from "@/components/live/live-match-ui";
import { notFound } from "next/navigation";
import type { MatchSquadVM } from "@/lib/types";
import { formatMatchDateTime } from "@/lib/dates";

const STATUS_LABELS: Record<string, string> = { SCHEDULED: "مجدولة", LIVE: "مباشر", HALFTIME: "استراحة", FINISHED: "انتهت", POSTPONED: "مؤجلة", CANCELLED: "ملغاة" };
const EVENT_LABELS: Record<string, string> = { GOAL: "هدف", OWN_GOAL: "هدف عكسي", ASSIST: "تمريرة حاسمة", YELLOW_CARD: "بطاقة صفراء", RED_CARD: "بطاقة حمراء", PENALTY_SCORED: "هدف من ركلة جزاء", PENALTY_MISSED: "ضائع ركلة جزاء", SUBSTITUTION_IN: "دخول", SUBSTITUTION_OUT: "خروج" };
const STATUS_LABELS_SQUAD: Record<string, string> = { PENDING: "قيد الانتظار", CONFIRMED: "مؤكدة", ABSENT: "غائبة" };
const STATUS_COLORS_SQUAD: Record<string, string> = { PENDING: "badge-muted", CONFIRMED: "badge-success", ABSENT: "badge-live" };
const POSITION_LABELS: Record<string, string> = { GOALKEEPER: "حارس مرمى", DEFENDER: "مدافع", MIDFIELDER: "لاعب وسط", FORWARD: "مهاجم" };

function formatDate(date: Date): string {
  return formatMatchDateTime(date);
}

function SquadSection({ squad }: { squad: MatchSquadVM }) {
  const starters = squad.players.filter((p) => p.isStarter);
  const subs = squad.players.filter((p) => !p.isStarter);

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-surface-elevated/30">
        <div className="flex items-center gap-2">
          <ImageDisplay src={squad.teamCrestUrl} alt={squad.teamName} type="team-logo" size="xs" />
          <h3 className="font-display text-[13px] font-black text-text">{squad.teamName}</h3>
        </div>
        <span className={STATUS_COLORS_SQUAD[squad.status] ?? "badge-muted"}>{STATUS_LABELS_SQUAD[squad.status] ?? squad.status}</span>
      </div>
      <div className="px-4 py-2 flex items-center gap-2.5 font-body text-[10px] text-text-dim border-b border-line/40">
        <span>{squad.squadSize}/20 لاعبًا</span>
        <span className={squad.isXIComplete ? "text-emerald-400" : "text-amber-400"}>{squad.starters}/11 أساسي</span>
        <span>{squad.subs} بدلاء</span>
      </div>
      <div className="p-4 space-y-3">
        {starters.length > 0 && (
          <div>
            <h4 className="mb-1.5 font-utility text-[8px] tracking-[0.15em] text-accent uppercase">الأساسيون</h4>
            <div className="flex flex-wrap gap-1.5">
              {starters.map((p) => (
                <Link key={p.playerId} href={`/players/${p.playerId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-accent/15 bg-accent/[0.03] px-2.5 py-1 transition-colors hover:bg-accent/8">
                  {p.photoUrl && <ImageDisplay src={p.photoUrl} alt={p.playerName} type="player" size="xs" />}
                  <span className="font-num text-[10px] font-bold text-accent">{p.jerseyNumber ?? "-"}</span>
                  <span className="font-body text-[11px] text-text">{p.playerName}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {subs.length > 0 && (
          <div>
            <h4 className="mb-1.5 font-utility text-[8px] tracking-[0.15em] text-text-dimmer uppercase">البدلاء</h4>
            <div className="flex flex-wrap gap-1.5">
              {subs.map((p) => (
                <Link key={p.playerId} href={`/players/${p.playerId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line/40 px-2.5 py-1 transition-colors hover:bg-surface-elevated">
                  {p.photoUrl && <ImageDisplay src={p.photoUrl} alt={p.playerName} type="player" size="xs" />}
                  <span className="font-num text-[10px] font-bold text-text-dimmer">{p.jerseyNumber ?? "-"}</span>
                  <span className="font-body text-[11px] text-text-dim">{p.playerName}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params;
  const result = await getMatchById(id);

  if (result.status === "error" || result.status === "empty") notFound();

  const match = result.data;
  const liveInitial = {
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    minute: match.minute,
  };

  const isGoalEvent = (t: string) => t === "GOAL" || t === "PENALTY_SCORED" || t === "OWN_GOAL";
  let runningHome = 0;
  let runningAway = 0;
  const timeline = match.events.map((event) => {
    if (isGoalEvent(event.type)) {
      const scoresHome = event.type === "OWN_GOAL" ? event.teamId === match.awayTeam.id : event.teamId === match.homeTeam.id;
      if (scoresHome) runningHome += 1;
      else runningAway += 1;
      return { ...event, runningHome, runningAway };
    }
    return { ...event, runningHome, runningAway };
  });

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <Link href="/matches" className="mb-5 inline-flex items-center gap-1.5 py-2 -my-2 font-body text-sm font-bold text-accent hover:text-accent-bright transition-colors">
          <svg className="h-3.5 w-3.5 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M7 3l3 3-3 3" /></svg>
          العودة للمباريات
        </Link>

        {/* Match Hero */}
        <div className="mb-5 rounded-xl border border-line bg-surface overflow-hidden animate-fade-up">
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 border-b border-line bg-surface-elevated/30">
            <LiveMatchUI matchId={match.id} initial={liveInitial} role="pill" variant="hero" />
            <span className="badge-muted">{match.tournamentName}</span>
            {match.round && <span className="badge-muted">{match.round}</span>}
          </div>
          <div className="px-5 py-6 sm:py-8">
            <div className="grid grid-cols-3 items-center gap-3 text-center">
              <div className="flex flex-col items-center gap-2.5">
                <TeamBadge team={match.homeTeam} size="lg" />
                <div className="font-display text-sm sm:text-base font-black text-text">{match.homeTeam.name}</div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <LiveMatchUI matchId={match.id} initial={liveInitial} role="score" />
                <div className="font-body text-[11px] text-text-dim">{formatDate(match.kickoffAt)}</div>
              </div>
              <div className="flex flex-col items-center gap-2.5">
                <TeamBadge team={match.awayTeam} size="lg" />
                <div className="font-display text-sm sm:text-base font-black text-text">{match.awayTeam.name}</div>
              </div>
            </div>
          </div>

          {match.venue && (
            <div className="border-t border-line">
              {match.venueImageUrl ? (
                <div className="relative h-44 sm:h-56 overflow-hidden">
                  <ImageDisplay src={match.venueImageUrl} alt={match.venue} type="cover" fill className="h-full w-full" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 pt-12 pb-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-accent-bright" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 22V10l9-6 9 6v12M6 22v-4h12v4M7 10h.01M11 10h.01M15 10h.01M9 18v-3h6v3" />
                      </svg>
                      <div>
                        <div className="font-utility text-[8px] tracking-[0.2em] text-accent-bright uppercase">الملعب</div>
                        <div className="font-display text-sm sm:text-base font-black text-white drop-shadow">{match.venue}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 bg-surface-elevated/30 px-4 py-3">
                  <svg className="h-4 w-4 text-text-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 22V10l9-6 9 6v12M6 22v-4h12v4M7 10h.01M11 10h.01M15 10h.01M9 18v-3h6v3" />
                  </svg>
                  <span className="font-body text-[12px] text-text-dim">{match.venue}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Events */}
        {match.events.length > 0 && (
<div className="mb-5 rounded-xl border border-line bg-surface overflow-hidden animate-fade-up">
            <div className="px-4 py-3 border-b border-line">
              <h2 className="font-display text-base font-black text-text">أحداث المباراة</h2>
            </div>
            <div className="divide-y divide-line/40">
              {timeline.map((event) => (
                <div key={event.id} className="flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-surface-elevated/20">
                  <span className="font-num text-[12px] font-bold text-accent w-8 text-center">{event.minute}&#39;</span>
                  <div className="flex-1 flex items-center gap-2">
                    <ImageDisplay src={event.photoUrl} alt={event.playerName} type="player" size="sm" />
                    <div>
                      <Link href={`/players/${event.playerId}`} className="font-body text-[12px] font-bold text-text hover:text-accent transition-colors">{event.playerName}</Link>
                      <span className="mr-1.5 font-body text-[10px] text-text-dim">{event.teamName}</span>
                    </div>
                  </div>
                  {isGoalEvent(event.type) && (
                    <span className="font-num text-[12px] font-bold text-text-dim w-16 text-center">{event.runningHome} - {event.runningAway}</span>
                  )}
                  <span className={event.type === "GOAL" || event.type === "PENALTY_SCORED" ? "badge-success" : event.type === "RED_CARD" || event.type === "PENALTY_MISSED" ? "badge-live" : event.type === "YELLOW_CARD" ? "badge-accent" : "badge-muted"}>
                    {EVENT_LABELS[event.type] ?? event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Squads */}
        {(match.homeSquad || match.awaySquad) && (
          <div>
            <h2 className="mb-3 font-display text-base font-black text-text">قوائم المباراة</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {match.homeSquad && <SquadSection squad={match.homeSquad} />}
              {match.awaySquad && <SquadSection squad={match.awaySquad} />}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
