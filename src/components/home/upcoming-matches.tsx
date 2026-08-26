import Link from "next/link";
import { getUpcomingMatches } from "@/lib/data/home";
import { TeamBadge } from "@/components/ui/team-badge";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

function formatKickoff(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function UpcomingMatches() {
  const result = await getUpcomingMatches(3);

  return (
    <section className="page-container page-padding">
      <SectionHeader title="المباريات القادمة" tag="FIXTURES" href="/matches" />

      {result.status === "error" && <ErrorState message={result.message} />}
      {result.status === "empty" && <EmptyState message="لا توجد مباريات قادمة حالياً." />}

      {result.status === "success" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((match) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="card-hover p-5"
            >
              <div className="mb-3 font-utility text-[10px] tracking-wider text-gold uppercase">
                {match.tournamentName}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <TeamBadge team={match.homeTeam} size="sm" />
                  <span className="font-body text-sm font-bold text-text">{match.homeTeam.name}</span>
                </div>
                <span className="font-num text-sm text-gold">{formatKickoff(match.kickoffAt)}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <TeamBadge team={match.awayTeam} size="sm" />
                <span className="font-body text-sm font-bold text-text">{match.awayTeam.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
