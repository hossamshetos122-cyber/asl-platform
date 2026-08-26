import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getMatchById } from "@/lib/data/matches";
import { TeamBadge } from "@/components/ui/team-badge";
import { notFound } from "next/navigation";
import type { MatchSquadVM } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "مجدولة", LIVE: "مباشر", HALFTIME: "استراحة", FINISHED: "انتهت",
  POSTPONED: "مؤجلة", CANCELLED: "ملغاة",
};

const STATUS_CLASSES: Record<string, string> = {
  SCHEDULED: "badge-muted", LIVE: "badge-live", HALFTIME: "badge-gold",
  FINISHED: "badge-success", POSTPONED: "badge-muted", CANCELLED: "badge-muted",
};

const EVENT_LABELS: Record<string, string> = {
  GOAL: "هدف", OWN_GOAL: "هدف عكسي", ASSIST: "تمريرة حاسمة",
  YELLOW_CARD: "بطاقة صفراء", RED_CARD: "بطاقة حمراء",
};

const STATUS_LABELS_SQUAD: Record<string, string> = {
  PENDING: "قيد الانتظار", CONFIRMED: "مؤكدة", ABSENT: "غائبة",
};

const STATUS_COLORS_SQUAD: Record<string, string> = {
  PENDING: "badge-muted", CONFIRMED: "badge-success", ABSENT: "badge-live",
};

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: "حارس مرمى", DEFENDER: "مدافع", MIDFIELDER: "لاعب وسط", FORWARD: "مهاجم",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function SquadSection({ squad }: { squad: MatchSquadVM }) {
  const starters = squad.players.filter((p) => p.isStarter);
  const subs = squad.players.filter((p) => !p.isStarter);

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {squad.teamCrestUrl && (
            <div className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded">
              <Image src={squad.teamCrestUrl} alt={squad.teamName} fill className="object-contain" sizes="20px" />
            </div>
          )}
          <h3 className="font-display text-sm font-black text-text">{squad.teamName}</h3>
        </div>
        <span className={STATUS_COLORS_SQUAD[squad.status] ?? "badge-muted"}>
          {STATUS_LABELS_SQUAD[squad.status] ?? squad.status}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-3 font-body text-xs text-text-dim">
        <span>{squad.squadSize}/20 لاعبًا</span>
        <span className={squad.isXIComplete ? "text-green-400" : "text-amber-400"}>
          {squad.starters}/11 أساسي
        </span>
        <span>{squad.subs} بدلاء</span>
        {!squad.isXIComplete && squad.starters > 0 && (
          <span className="text-amber-400">التشكيلة غير مكتملة</span>
        )}
      </div>

      {starters.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-2 font-body text-xs font-bold text-text-dim">الأساسيون</h4>
          <div className="flex flex-wrap gap-1.5">
            {starters.map((p) => (
              <Link
                key={p.playerId}
                href={`/players/${p.playerId}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/5 px-2 py-1 transition-colors hover:bg-gold/10"
              >
                {p.photoUrl && (
                  <div className="relative h-4 w-4 flex-shrink-0 overflow-hidden rounded-full">
                    <Image src={p.photoUrl} alt={p.playerName} fill className="object-cover" sizes="16px" />
                  </div>
                )}
                <span className="font-num text-[10px] font-bold text-gold">{p.jerseyNumber ?? "-"}</span>
                <span className="font-body text-[11px] text-text">{p.playerName}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {subs.length > 0 && (
        <div>
          <h4 className="mb-2 font-body text-xs font-bold text-text-dim">البدلاء</h4>
          <div className="flex flex-wrap gap-1.5">
            {subs.map((p) => (
              <Link
                key={p.playerId}
                href={`/players/${p.playerId}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 transition-colors hover:bg-bg-raised2/50"
              >
                {p.photoUrl && (
                  <div className="relative h-4 w-4 flex-shrink-0 overflow-hidden rounded-full">
                    <Image src={p.photoUrl} alt={p.playerName} fill className="object-cover" sizes="16px" />
                  </div>
                )}
                <span className="font-num text-[10px] font-bold text-text-dimmer">{p.jerseyNumber ?? "-"}</span>
                <span className="font-body text-[11px] text-text-dim">{p.playerName}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
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
        <Link href="/matches" className="mb-6 inline-flex items-center gap-1 font-body text-sm text-gold hover:text-gold-bright transition-colors">
          <svg className="h-3 w-3 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 6h8M7 3l3 3-3 3" />
          </svg>
          العودة للمباريات
        </Link>

        <div className="card p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className={STATUS_CLASSES[match.status] ?? "badge-muted"}>
              {match.status === "LIVE" && <span className="ml-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-live inline-block" />}
              {STATUS_LABELS[match.status] ?? match.status}
            </span>
            <span className="badge-muted">{match.tournamentName}</span>
            {match.round && <span className="badge-muted">{match.round}</span>}
          </div>

          <div className="grid grid-cols-3 items-center gap-4 text-center">
            <div className="flex flex-col items-center gap-3">
              <TeamBadge team={match.homeTeam} size="lg" />
              <div className="font-display text-base sm:text-lg font-extrabold text-text">{match.homeTeam.name}</div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="font-num text-5xl sm:text-6xl font-bold text-text">
                {match.homeScore}
                <span className="mx-2 sm:mx-3 font-utility text-2xl sm:text-3xl text-gold">-</span>
                {match.awayScore}
              </div>
              <div className="font-body text-xs text-text-dim">{formatDate(match.kickoffAt)}</div>
              {match.venue && <div className="font-utility text-[10px] text-text-dimmer">{match.venue}</div>}
            </div>

            <div className="flex flex-col items-center gap-3">
              <TeamBadge team={match.awayTeam} size="lg" />
              <div className="font-display text-base sm:text-lg font-extrabold text-text">{match.awayTeam.name}</div>
            </div>
          </div>
        </div>

        {match.events.length > 0 && (
          <div className="card p-6">
            <h2 className="mb-4 section-title text-lg">أحداث المباراة</h2>
            <div className="space-y-3">
              {match.events.map((event) => (
                <div key={event.id} className="flex items-center gap-3 rounded-lg border border-line px-4 py-3">
                  <span className="font-num text-sm font-bold text-gold w-10 text-center">{event.minute}&#39;</span>
                  <div className="flex-1 flex items-center gap-2">
                    {event.photoUrl && (
                      <Image src={event.photoUrl} alt={event.playerName} width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
                    )}
                    <div>
                      <Link href={`/players/${event.playerId}`} className="font-body text-sm font-bold text-text hover:text-gold transition-colors">
                        {event.playerName}
                      </Link>
                      <span className="mr-2 font-body text-xs text-text-dim">{event.teamName}</span>
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

        {(match.homeSquad || match.awaySquad) && (
          <div className="mt-6">
            <h2 className="mb-4 section-title text-lg">قوائم المباراة</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
