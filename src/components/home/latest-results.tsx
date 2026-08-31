import Link from "next/link";
import { getLatestResults } from "@/lib/data/home";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

export async function LatestResults() {
  const result = await getLatestResults(3);

  return (
    <section className="page-container editorial-section">
      <SectionHeader title="آخر النتائج" tag="RESULTS" href="/matches" />

      {result.status === "error" && <ErrorState message={result.message} />}
      {result.status === "empty" && <EmptyState message="لا توجد نتائج بعد هذا الموسم." />}

      {result.status === "success" && (
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-16 bg-gradient-to-r from-bg to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-16 bg-gradient-to-l from-bg to-transparent" />

          <div className="marquee-track flex w-max items-center gap-3 py-1" dir="ltr">
            {[...result.data, ...result.data].map((match, i) => (
              <Link
                key={i}
                href={`/matches/${match.id}`}
                className="flex flex-shrink-0 items-center gap-2.5 rounded-full border border-line bg-surface-elevated px-4 py-2.5 shadow-card transition-colors hover:border-accent/40 hover:bg-surface-raised2"
              >
                <span className="max-w-[88px] truncate font-body text-xs font-bold text-text sm:max-w-[130px]">{match.homeTeam.name}</span>
                <span className="font-num text-sm font-black text-accent tabular-nums" dir="ltr">
                  {match.homeScore}
                </span>
                <span className="font-num text-[10px] font-bold text-text-dimmer">-</span>
                <span className="font-num text-sm font-black text-text-dim tabular-nums" dir="ltr">
                  {match.awayScore}
                </span>
                <span className="max-w-[88px] truncate font-body text-xs font-bold text-text sm:max-w-[130px]">{match.awayTeam.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
