import Link from "next/link";
import { getFeaturedLiveMatch } from "@/lib/data/home";
import { ImageDisplay } from "@/components/ui/image-display";
import { LiveMatchUI } from "@/components/live/live-match-ui";

export async function LiveMatchBanner() {
  const result = await getFeaturedLiveMatch();

  if (result.status !== "success") return null;

  const match = result.data;
  const liveInitial = {
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    minute: match.minute,
  };

  return (
    <section className="sticky top-14 sm:top-16 z-40 relative border-y border-live/25 overflow-hidden bg-surface">
      <div className="absolute inset-0 bg-gradient-to-r from-live/[0.05] via-transparent to-live/[0.05]" />
      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-live/70 via-live/30 to-transparent" />

      <div className="page-container relative py-4 sm:py-5">
        {/* Status */}
        <div className="mb-3 flex items-center justify-center gap-2.5">
          <LiveMatchUI matchId={match.id} initial={liveInitial} role="pill" />
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
              <LiveMatchUI matchId={match.id} initial={liveInitial} role="score" />
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
