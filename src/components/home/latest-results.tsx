import { getLatestResults } from "@/lib/data/home";
import { MatchCard } from "./match-card";
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((match) => (
            <MatchCard
              key={match.id}
              id={match.id}
              tournamentName={match.tournamentName}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              venue={match.venue}
              variant="result"
            />
          ))}
        </div>
      )}
    </section>
  );
}
