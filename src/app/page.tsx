import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import { LiveMatchBanner } from "@/components/home/live-match-banner";
import { UpcomingMatches } from "@/components/home/upcoming-matches";
import { LatestResults } from "@/components/home/latest-results";
import { TeamOfWeek } from "@/components/home/team-of-week";
import { StandingsTable } from "@/components/home/standings-table";
import { TopScorers } from "@/components/home/top-scorers";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getFeaturedTournamentId } from "@/lib/stats";

export const dynamic = "force-dynamic";

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

export default async function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <LiveMatchBanner />
      <UpcomingMatches />
      <LatestResults />
      <TeamOfWeek />
      <section className="page-container editorial-section">
        <FeaturedTournamentPanels />
      </section>
      <Footer />
    </>
  );
}
