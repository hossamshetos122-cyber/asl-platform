import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import { getMatches } from "@/lib/data/matches";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImageDisplay } from "@/components/ui/image-display";
import { MatchFilters } from "./match-filters";
import Link from "next/link";
import { formatCalendarDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return formatCalendarDate(date);
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "مجدولة", LIVE: "مباشر", HALFTIME: "استراحة", FINISHED: "انتهت",
  POSTPONED: "مؤجلة", CANCELLED: "ملغاة",
};

const STATUS_CLASSES: Record<string, string> = {
  SCHEDULED: "badge-muted", LIVE: "badge-live", HALFTIME: "badge-accent",
  FINISHED: "badge-success", POSTPONED: "badge-muted", CANCELLED: "badge-muted",
};

async function MatchesList({ filter, teamId }: { filter?: string; teamId?: string }) {
  const result = await getMatches(filter, teamId);

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
    <div className="space-y-6">
      {Array.from(groupedByDate.entries()).map(([dateLabel, matches]) => (
        <div key={dateLabel}>
          <div className="mb-2.5 flex items-center gap-2.5">
            <h3 className="font-utility text-[10px] tracking-[0.18em] text-text-dimmer uppercase">{dateLabel}</h3>
            <div className="flex-1 h-px bg-line" />
          </div>
          <div className="space-y-2">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="group flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3.5 premier-card"
              >
                {/* Home */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end">
                  <span className="font-body text-[12px] sm:text-[13px] font-bold text-text truncate group-hover:text-accent transition-colors">{match.homeTeam.name}</span>
                  <ImageDisplay src={match.homeTeam.crestUrl} alt={match.homeTeam.name} type="team-logo" size="sm" shortCode={match.homeTeam.shortCode} />
                </div>

                {/* Score/Status */}
                <div className="flex flex-col items-center gap-1 px-3 sm:px-5 flex-shrink-0 min-w-[72px]">
                  <div className="font-num text-base sm:text-lg font-bold text-text tabular-nums">
                    {match.homeScore}<span className="mx-1 text-text-dimmer">-</span>{match.awayScore}
                  </div>
                  <span className={STATUS_CLASSES[match.status] ?? "badge-muted"}>{STATUS_LABELS[match.status] ?? match.status}</span>
                  {match.venue && (
                    <span className="flex items-center gap-1 font-body text-[9px] text-text-dimmer">
                      <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 22V10l9-6 9 6v12M6 22v-4h12v4" />
                      </svg>
                      <span className="max-w-[120px] truncate">{match.venue}</span>
                    </span>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <ImageDisplay src={match.awayTeam.crestUrl} alt={match.awayTeam.name} type="team-logo" size="sm" shortCode={match.awayTeam.shortCode} />
                  <span className="font-body text-[12px] sm:text-[13px] font-bold text-text truncate group-hover:text-accent transition-colors">{match.awayTeam.name}</span>
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
  searchParams: Promise<{ status?: string; team?: string }>;
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const { status, team } = await searchParams;

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <PageHero title="المباريات" tag="MATCHES" description="جميع مباريات الدوري — الجولات، النتائج، والمواعيد." />
        <div className="mb-6">
          <MatchFilters teams={teams} />
        </div>
        <Suspense fallback={<MatchFilterSkeleton />}>
          <MatchesList filter={status} teamId={team} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

function MatchFilterSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-line" />
          <div className="h-16 animate-pulse rounded-xl border border-line bg-surface" />
        </div>
      ))}
    </div>
  );
}
