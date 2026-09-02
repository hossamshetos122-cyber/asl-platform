import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTournaments } from "@/lib/data/tournaments";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TournamentsBrowser } from "./tournaments-browser";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function TournamentBrowserProvider() {
  const result = await getTournaments();

  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا توجد بطولات مسجّلة بعد." />;

  return <TournamentsBrowser tournaments={result.data} />;
}

export default async function TournamentsPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <PageHero title="البطولات" tag="COMPETITIONS" description="استعرض البطولات والمسابقات التي ينظمها دوري نجوم الإسكندرية للهواة." />
        <Suspense fallback={<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-line bg-surface" />
          ))}
        </div>}>
          <TournamentBrowserProvider />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
