import Link from "next/link";
import { getFeaturedLiveMatch } from "@/lib/data/home";
import { ImageDisplay } from "@/components/ui/image-display";

export async function LiveMatchBanner() {
  const result = await getFeaturedLiveMatch();

  if (result.status !== "success") return null;

  const match = result.data;
  const statusLabel = match.status === "HALFTIME" ? "الشوط الأول انتهى" : "مباشر الآن";

  return (
    <section className="relative border-y border-live/20 overflow-hidden bg-surface">
      <div className="absolute inset-0 bg-gradient-to-r from-live/[0.04] via-transparent to-live/[0.04]" />

      <div className="page-container relative py-5 sm:py-7">
        {/* Status */}
        <div className="mb-4 flex items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-live/25 bg-live/8 px-3 py-1 font-utility text-[10px] tracking-[0.15em] text-live uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
            </span>
            <span className={match.status === "LIVE" ? "live-word" : ""}>{statusLabel}</span>
          </span>
          <span className="font-utility text-[10px] tracking-wider text-text-dimmer uppercase">{match.tournamentName}</span>
          {match.venue && (
            <span className="inline-flex items-center gap-1.5 font-body text-[11px] text-text-dimmer">
              <svg className="h-3 w-3 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="7" /><circle cx="8" cy="8" r="2.5" /><path d="M8 2v2.5M8 11.5V14M2.5 8H5M11 8h2.5" />
              </svg>
              <span>{match.venue}</span>
            </span>
          )}
        </div>

        {/* Match */}
        <Link href={`/matches/${match.id}`} className="block group">
          <div className="grid grid-cols-3 items-center gap-3">
            {/* Home */}
            <div className="flex items-center justify-end gap-3 min-w-0 flex-1">
              <div className="text-right min-w-0">
                <div className="font-display text-sm sm:text-lg font-black text-text group-hover:text-accent transition-colors truncate">
                  {match.homeTeam.name}
                </div>
              </div>
              <ImageDisplay src={match.homeTeam.crestUrl} alt={match.homeTeam.name} type="team-logo" size="lg" shortCode={match.homeTeam.shortCode} />
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-1">
              <div className="font-num text-4xl sm:text-5xl lg:text-6xl font-bold text-text score-live tabular-nums">
                {match.homeScore}
                <span className="mx-1.5 sm:mx-2 text-xl sm:text-2xl text-text-dimmer">-</span>
                {match.awayScore}
              </div>
              {match.minute !== null && (
                <div className="rounded bg-surface-elevated px-2.5 py-0.5 font-num text-[11px] font-bold text-text-dim border border-line">
                  {match.minute}&#39;
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <ImageDisplay src={match.awayTeam.crestUrl} alt={match.awayTeam.name} type="team-logo" size="lg" shortCode={match.awayTeam.shortCode} />
              <div className="text-left min-w-0">
                <div className="font-display text-sm sm:text-lg font-black text-text group-hover:text-accent transition-colors truncate">
                  {match.awayTeam.name}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
