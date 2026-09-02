import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTeams } from "@/lib/data/teams";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TeamsBrowser } from "./teams-browser";

export const dynamic = "force-dynamic";

async function TeamBrowserProvider() {
  const result = await getTeams();

  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا توجد فرق مسجّلة بعد." />;

  return <TeamsBrowser teams={result.data} />;
}

export default async function TeamsPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <PageHero title="الفرق" tag="TEAMS" description="تصفّح فرق الدوري وتعرف على تشكيلات كل نادٍ." />
        <Suspense fallback={<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-surface" />
          ))}
        </div>}>
          <TeamBrowserProvider />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
