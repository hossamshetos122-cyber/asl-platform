import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import { LiveMatchBanner } from "@/components/home/live-match-banner";
import { UpcomingMatches } from "@/components/home/upcoming-matches";
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
    <div className="grid grid-cols-1 gap-4 lg:gap-px lg:grid-cols-[1.4fr_1fr]">
      <StandingsTable tournamentId={tournamentId} />
      <TopScorers tournamentId={tournamentId} />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Navbar />

      <Suspense fallback={<Skeleton className="h-[400px] sm:h-[500px]" />}>
        <Hero />
      </Suspense>

      <Suspense fallback={null}>
        <LiveMatchBanner />
      </Suspense>

      <Suspense
        fallback={
          <div className="page-container page-padding">
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <UpcomingMatches />
      </Suspense>

      <section className="page-container page-padding">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <FeaturedTournamentPanels />
        </Suspense>
      </section>

      <Footer />
    </>
  );
}
