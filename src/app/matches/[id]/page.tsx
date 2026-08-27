import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getMatchById } from "@/lib/data/matches";
import { TeamBadge } from "@/components/ui/team-badge";
import { ImageDisplay } from "@/components/ui/image-display";
import { notFound } from "next/navigation";
import type { MatchSquadVM } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = { SCHEDULED: "مجدولة", LIVE: "مباشر", HALFTIME: "استراحة", FINISHED: "انتهت", POSTPONED: "مؤجلة", CANCELLED: "ملغاة" };
const STATUS_CLASSES: Record<string, string> = { SCHEDULED: "badge-muted", LIVE: "badge-live", HALFTIME: "badge-gold", FINISHED: "badge-success", POSTPONED: "badge-muted", CANCELLED: "badge-muted" };
const EVENT_LABELS: Record<string, string> = { GOAL: "هدف", OWN_GOAL: "هدف عكسي", ASSIST: "تمريرة حاسمة", YELLOW_CARD: "بطاقة صفراء", RED_CARD: "بطاقة حمراء" };
const STATUS_LABELS_SQUAD: Record<string, string> = { PENDING: "قيد الانتظار", CONFIRMED: "مؤكدة", ABSENT: "غائبة" };
const STATUS_COLORS_SQUAD: Record<string, string> = { PENDING: "badge-muted", CONFIRMED: "badge-success", ABSENT: "badge-live" };
const POSITION_LABELS: Record<string, string> = { GOALKEEPER: "حارس مرمى", DEFENDER: "مدافع", MIDFIELDER: "لاعب وسط", FORWARD: "مهاجم" };

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
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
            <h4 className="mb-1.5 font-utility text-[8px] tracking-[0.15em] text-gold uppercase">الأساسيون</h4>
            <div className="flex flex-wrap gap-1.5">
              {starters.map((p) => (
                <Link key={p.playerId} href={`/players/${p.playerId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gold/15 bg-gold/[0.03] px-2.5 py-1 transition-colors hover:bg-gold/8">
                  {p.photoUrl && <ImageDisplay src={p.photoUrl} alt={p.playerName} type="player" size="xs" />}
                  <span className="font-num text-[10px] font-bold text-gold">{p.jerseyNumber ?? "-"}</span>
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

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <Link href="/matches" className="mb-5 inline-flex items-center gap-1.5 font-body text-sm font-bold text-gold hover:text-gold-bright transition-colors">
          <svg className="h-3.5 w-3.5 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M7 3l3 3-3 3" /></svg>
          العودة للمباريات
        </Link>

        {/* Match Hero */}
        <div className="mb-5 rounded-xl border border-line bg-surface overflow-hidden">
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 border-b border-line bg-surface-elevated/30">
            <span className={STATUS_CLASSES[match.status] ?? "badge-muted"}>
              {match.status === "LIVE" && <span className="ml-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-live inline-block" />}
              {STATUS_LABELS[match.status] ?? match.status}
            </span>
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
                <div className="font-num text-4xl sm:text-5xl lg:text-6xl font-bold text-text tabular-nums">
                  {match.homeScore}
                  <span className="mx-1.5 sm:mx-2 text-xl sm:text-2xl text-text-dimmer">-</span>
                  {match.awayScore}
                </div>
                <div className="font-body text-[11px] text-text-dim">{formatDate(match.kickoffAt)}</div>
                {match.venue && <div className="font-utility text-[8px] tracking-wider text-text-dimmer uppercase">{match.venue}</div>}
              </div>
              <div className="flex flex-col items-center gap-2.5">
                <TeamBadge team={match.awayTeam} size="lg" />
                <div className="font-display text-sm sm:text-base font-black text-text">{match.awayTeam.name}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Events */}
        {match.events.length > 0 && (
          <div className="mb-5 rounded-xl border border-line bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <h2 className="font-display text-base font-black text-text">أحداث المباراة</h2>
            </div>
            <div className="divide-y divide-line/40">
              {match.events.map((event) => (
                <div key={event.id} className="flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-surface-elevated/20">
                  <span className="font-num text-[12px] font-bold text-gold w-8 text-center">{event.minute}&#39;</span>
                  <div className="flex-1 flex items-center gap-2">
                    <ImageDisplay src={event.photoUrl} alt={event.playerName} type="player" size="sm" />
                    <div>
                      <Link href={`/players/${event.playerId}`} className="font-body text-[12px] font-bold text-text hover:text-gold transition-colors">{event.playerName}</Link>
                      <span className="mr-1.5 font-body text-[10px] text-text-dim">{event.teamName}</span>
                    </div>
                  </div>
                  <span className={event.type === "GOAL" ? "badge-success" : event.type === "RED_CARD" ? "badge-live" : "badge-muted"}>
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
