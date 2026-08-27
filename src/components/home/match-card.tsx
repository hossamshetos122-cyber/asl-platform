import Link from "next/link";
import { ImageDisplay } from "@/components/ui/image-display";
import type { TeamSummaryVM } from "@/lib/types";

interface MatchCardProps {
  id: string;
  tournamentName: string;
  homeTeam: TeamSummaryVM;
  awayTeam: TeamSummaryVM;
  homeScore?: number;
  awayScore?: number;
  kickoffTime?: string;
  venue?: string | null;
  status?: string;
  variant?: "fixture" | "result";
}

export function MatchCard({
  id,
  tournamentName,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  kickoffTime,
  status,
  variant = "fixture",
}: MatchCardProps) {
  const isResult = variant === "result";
  const isLive = status === "LIVE" || status === "HALFTIME";

  return (
    <Link
      href={`/matches/${id}`}
      className="group block rounded-xl border border-line bg-surface overflow-hidden premier-card"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-line/50">
        <span className="font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase truncate">
          {tournamentName}
        </span>
        {isLive ? (
          <span className="badge-live text-[9px] py-0">
            <span className="relative flex h-1.5 w-1.5 mr-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
            </span>
            مباشر
          </span>
        ) : isResult ? (
          <span className="font-utility text-[9px] tracking-wider text-emerald-400/70 uppercase">انتهت</span>
        ) : kickoffTime ? (
          <span className="font-num text-[11px] font-bold text-gold">{kickoffTime}</span>
        ) : null}
      </div>

      {/* Teams */}
      <div className="px-4 py-3 space-y-0">
        {/* Home */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end">
            <span className="font-body text-[13px] font-bold text-text truncate group-hover:text-gold transition-colors">
              {homeTeam.name}
            </span>
            <ImageDisplay src={homeTeam.crestUrl} alt={homeTeam.name} type="team-logo" size="sm" shortCode={homeTeam.shortCode} />
          </div>
          {isResult && homeScore !== undefined && (
            <span className={`font-num text-xl font-bold tabular-nums min-w-[24px] text-center ${homeScore > awayScore! ? "text-gold" : "text-text-dim"}`}>
              {homeScore}
            </span>
          )}
        </div>

        {/* VS / Score divider */}
        <div className="flex items-center gap-2 py-0.5">
          <div className="flex-1 h-px bg-line group-hover:bg-gold/15 transition-colors" />
          <div className="px-2.5 py-0.5 rounded bg-surface-elevated border border-line">
            {isResult ? (
              <span className="font-num text-[11px] font-bold text-text-dimmer">{homeScore} - {awayScore}</span>
            ) : (
              <span className="font-utility text-[9px] tracking-wider text-text-dimmer uppercase">vs</span>
            )}
          </div>
          <div className="flex-1 h-px bg-line group-hover:bg-gold/15 transition-colors" />
        </div>

        {/* Away */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end">
            <span className="font-body text-[13px] font-bold text-text truncate group-hover:text-gold transition-colors">
              {awayTeam.name}
            </span>
            <ImageDisplay src={awayTeam.crestUrl} alt={awayTeam.name} type="team-logo" size="sm" shortCode={awayTeam.shortCode} />
          </div>
          {isResult && awayScore !== undefined && (
            <span className={`font-num text-xl font-bold tabular-nums min-w-[24px] text-center ${awayScore > homeScore! ? "text-gold" : "text-text-dim"}`}>
              {awayScore}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
