import Image from "next/image";
import Link from "next/link";
import { getTopScorers } from "@/lib/data/home";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

interface TopScorersProps {
  tournamentId: string;
}

export async function TopScorers({ tournamentId }: TopScorersProps) {
  const result = await getTopScorers(tournamentId, 5);

  return (
    <div className="bg-bg-raised/50 p-5 sm:p-6 rounded-xl">
      <SectionHeader title="الهدافين" tag="TOP SCORERS" href="/top-scorers" bordered={false} />

      {result.status === "error" && <ErrorState message={result.message} />}
      {result.status === "empty" && <EmptyState message="لا يوجد هدافون مسجّلون بعد هذا الموسم." />}

      {result.status === "success" && (
        <ul>
          {result.data.map((scorer) => (
            <li key={scorer.playerId} className="flex items-center justify-between border-b border-line py-3.5 last:border-none transition-colors hover:bg-bg-raised2/30 rounded-lg px-2 -mx-2">
              <Link href={`/players/${scorer.playerId}`} className="flex items-center gap-3">
                <span className={scorer.rank === 1 ? "rank-badge-1" : scorer.rank <= 3 ? "rank-badge-top" : "rank-badge-normal"}>
                  {String(scorer.rank).padStart(2, "0")}
                </span>
                <div className="h-9 w-9 rounded-lg border border-line bg-bg-raised2 flex items-center justify-center overflow-hidden" aria-hidden="true">
                  {scorer.photoUrl ? (
                    <Image src={scorer.photoUrl} alt={scorer.playerName} width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
                  ) : (
                    <svg className="h-4 w-4 text-text-dimmer" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-body text-sm font-bold text-text">{scorer.playerName}</div>
                  <div className="font-utility text-[10px] sm:text-[11px] text-text-dimmer tracking-wide">{scorer.teamName}</div>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-num text-xl font-bold text-gold">{scorer.goals}</span>
                <span className="font-utility text-[9px] text-text-dimmer">هدف</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
