import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import { LiveMatchBanner } from "@/components/home/live-match-banner";
import { UpcomingMatches } from "@/components/home/upcoming-matches";
import { LatestResults } from "@/components/home/latest-results";
import { StandingsTable } from "@/components/home/standings-table";
import { TopScorers } from "@/components/home/top-scorers";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeaturedTournamentId } from "@/lib/data/home";

async function FeaturedTournamentPanels() {
  const tournamentResult = await getFeaturedTournamentId();

  if (tournamentResult.status === "error") return <ErrorState message={tournamentResult.message} />;
  if (tournamentResult.status === "empty") return <EmptyState message="لا توجد بطولة جارية حاليًا." />;

  const tournamentId = tournamentResult.data;

  return (
    <div className="grid grid-cols-1 gap-5 lg:gap-6 lg:grid-cols-[1.3fr_1fr]">
      <StandingsTable tournamentId={tournamentId} />
      <TopScorers tournamentId={tournamentId} />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<Skeleton className="h-[480px] sm:h-[560px] bg-bg-deep" />}>
        <Hero />
      </Suspense>
      <Suspense fallback={null}>
        <LiveMatchBanner />
      </Suspense>
      <Suspense fallback={<div className="page-container editorial-section"><Skeleton className="h-64 w-full" /></div>}>
        <UpcomingMatches />
      </Suspense>
      <Suspense fallback={<div className="page-container editorial-section"><Skeleton className="h-64 w-full" /></div>}>
        <LatestResults />
      </Suspense>
      <section className="page-container editorial-section">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <FeaturedTournamentPanels />
        </Suspense>
      </section>
      <Footer />
    </>
  );
}
