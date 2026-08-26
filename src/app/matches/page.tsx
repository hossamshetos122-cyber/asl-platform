import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getMatches } from "@/lib/data/matches";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/ui/team-badge";
import Link from "next/link";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function formatKickoff(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(date);
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "مجدولة", LIVE: "مباشر", HALFTIME: "استراحة", FINISHED: "انتهت",
  POSTPONED: "مؤجلة", CANCELLED: "ملغاة",
};

const STATUS_CLASSES: Record<string, string> = {
  SCHEDULED: "badge-muted", LIVE: "badge-live", HALFTIME: "badge-gold",
  FINISHED: "badge-success", POSTPONED: "badge-muted", CANCELLED: "badge-muted",
};

async function MatchesList({ filter }: { filter?: string }) {
  const result = await getMatches(filter);

  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا توجد مباريات حالياً." />;

  const groupedByDate = new Map<string, typeof result.data>();
  for (const match of result.data) {
    const dateKey = formatDate(match.kickoffAt);
    const group = groupedByDate.get(dateKey) ?? [];
    group.push(match);
    groupedByDate.set(dateKey, group);
  }

  return (
    <div className="space-y-8">
      {Array.from(groupedByDate.entries()).map(([dateLabel, matches]) => (
        <div key={dateLabel}>
          <h3 className="mb-4 font-display text-sm font-bold text-text-dimmer">{dateLabel}</h3>
          <div className="space-y-2">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="card-hover flex items-center justify-between p-4 sm:p-5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TeamBadge team={match.homeTeam} size="sm" />
                  <div className="min-w-0">
                    <span className="font-body text-sm font-bold text-text truncate block">{match.homeTeam.name}</span>
                    <div className="font-utility text-[9px] tracking-wider text-text-dimmer uppercase">HOME</div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1.5 px-4 sm:px-6 flex-shrink-0">
                  <div className="font-num text-lg sm:text-xl font-bold text-text">
                    {match.homeScore}
                    <span className="mx-1.5 font-utility text-sm text-gold">-</span>
                    {match.awayScore}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={STATUS_CLASSES[match.status] ?? "badge-muted"}>
                      {STATUS_LABELS[match.status] ?? match.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-left min-w-0">
                    <span className="font-body text-sm font-bold text-text truncate block">{match.awayTeam.name}</span>
                    <div className="font-utility text-[9px] tracking-wider text-text-dimmer uppercase">AWAY</div>
                  </div>
                  <TeamBadge team={match.awayTeam} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface MatchesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const { status } = await searchParams;

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="المباريات" tag="MATCHES" bordered={false} />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <MatchesList filter={status} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
