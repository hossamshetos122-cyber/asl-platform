import Link from "next/link";
import { getUpcomingMatches } from "@/lib/data/home";
import { formatKickoffTime } from "@/lib/dates";
import { MatchCard } from "./match-card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

function formatKickoff(date: Date): string {
  return formatKickoffTime(date);
}

export async function UpcomingMatches() {
  const result = await getUpcomingMatches(3);

  return (
    <section className="page-container editorial-section">
      <SectionHeader title="المباريات القادمة" tag="FIXTURES" href="/matches" />

      {result.status === "error" && <ErrorState message={result.message} />}
      {result.status === "empty" && <EmptyState message="لا توجد مباريات قادمة حالياً." />}

      {result.status === "success" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((match) => (
            <MatchCard
              key={match.id}
              id={match.id}
              tournamentName={match.tournamentName}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              kickoffTime={formatKickoff(match.kickoffAt)}
              venue={match.venue}
              variant="fixture"
            />
          ))}
        </div>
      )}
    </section>
  );
}
