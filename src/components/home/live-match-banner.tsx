import { getFeaturedLiveMatch } from "@/lib/data/home";
import { TeamBadge } from "@/components/ui/team-badge";

export async function LiveMatchBanner() {
  const result = await getFeaturedLiveMatch();

  if (result.status !== "success") return null;

  const match = result.data;
  const statusLabel = match.status === "HALFTIME" ? "الشوط الأول انتهى" : "مباشر الآن";

  return (
    <section className="relative border-y border-gold/20 bg-gradient-to-r from-gold/[0.06] via-gold/[0.03] to-transparent">
      <div className="page-container py-8 sm:py-10">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="badge-live">
            <span className="ml-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-live" aria-hidden="true" />
            {statusLabel}
          </span>
          <span className="badge-muted">{match.tournamentName}</span>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:text-center">
          <div className="flex items-center justify-center gap-4 sm:justify-end sm:text-right">
            <div className="text-right">
              <div className="font-display text-lg sm:text-xl font-extrabold text-text">{match.homeTeam.name}</div>
              <div className="font-utility text-[10px] tracking-wider text-text-dimmer uppercase">HOME</div>
            </div>
            <TeamBadge team={match.homeTeam} size="lg" />
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="font-num text-5xl sm:text-6xl leading-none text-text">
              {match.homeScore}
              <span className="mx-3 font-utility text-2xl sm:text-3xl text-gold">-</span>
              {match.awayScore}
            </div>
            {match.minute !== null && (
              <div className="font-num text-xs text-text-dim">الدقيقة {match.minute}</div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 sm:justify-start sm:text-left">
            <TeamBadge team={match.awayTeam} size="lg" />
            <div className="text-left">
              <div className="font-display text-lg sm:text-xl font-extrabold text-text">{match.awayTeam.name}</div>
              <div className="font-utility text-[10px] tracking-wider text-text-dimmer uppercase">AWAY</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
