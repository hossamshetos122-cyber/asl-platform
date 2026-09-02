import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFeaturedTournamentId, getStandings } from "@/lib/stats";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SortableStandings } from "@/components/standings/sortable-standings";

export const dynamic = "force-dynamic";

async function FullStandings() {
  const tournamentResult = await getFeaturedTournamentId();
  if (tournamentResult.status === "error") return <ErrorState message={tournamentResult.message} />;
  if (tournamentResult.status === "empty") return <EmptyState message="لا توجد بطولة جارية حاليًا." />;

  const result = await getStandings(tournamentResult.data, 50);
  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لم يتم لعب مباريات كافية لعرض الترتيب بعد." />;

  return <SortableStandings rows={result.data} />;
}

export default async function StandingsPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <PageHero title="جدول الترتيب" tag="STANDINGS" description="ترتيب الفرق في البطولة الجارية حسب النقاط والأهداف." />
        <Suspense fallback={<div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-line bg-surface" />
          ))}
        </div>}>
          <FullStandings />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
