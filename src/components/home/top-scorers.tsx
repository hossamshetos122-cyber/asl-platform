import Link from "next/link";
import { getTopScorers } from "@/lib/stats";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImageDisplay } from "@/components/ui/image-display";

interface TopScorersProps {
  tournamentId?: string;
}

export async function TopScorers({ tournamentId }: TopScorersProps) {
  const result = await getTopScorers(tournamentId, 8);

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="px-4 pt-4 pb-0">
        <SectionHeader title="الهدافين" tag="TOP SCORERS" href="/top-scorers" bordered={false} />
      </div>

      {result.status === "error" && <div className="px-4 pb-4"><ErrorState message={result.message} /></div>}
      {result.status === "empty" && <div className="px-4 pb-4"><EmptyState message="لا يوجد هدافون مسجّلون بعد." /></div>}

      {result.status === "success" && (
        <div className="divide-y divide-line/40">
          {result.data.map((scorer) => (
            <Link
              key={scorer.playerId}
              href={`/players/${scorer.playerId}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-elevated/30 group"
            >
              <span className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded font-num text-[10px] font-bold ${
                scorer.rank === 1 ? "bg-emerald-500 text-bg" : scorer.rank <= 3 ? "border border-emerald-500/40 text-emerald-500" : "text-text-dimmer"
              }`}>
                {String(scorer.rank).padStart(2, "0")}
              </span>

              <ImageDisplay src={scorer.photoUrl} alt={scorer.playerName} type="player" size="sm" />

              <div className="flex-1 min-w-0">
                <div className="font-body text-[12px] font-bold text-text group-hover:text-accent transition-colors truncate">{scorer.playerName}</div>
                <div className="font-utility text-[8px] tracking-[0.1em] text-text-dimmer uppercase truncate">{scorer.teamName}</div>
              </div>

              <div className="flex-shrink-0 text-left">
                <span className="font-num text-lg font-bold text-emerald-500">{scorer.goals}</span>
                <span className="block font-utility text-[7px] tracking-wider text-text-dimmer uppercase">هدف</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
