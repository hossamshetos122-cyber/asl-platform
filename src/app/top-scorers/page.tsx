import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTopAssisters, getTopScorers } from "@/lib/stats";
import { SectionHeader } from "@/components/ui/section-header";
import { PageHero } from "@/components/ui/page-hero";
import { ErrorState } from "@/components/ui/error-state";
import { ScorerPodium } from "@/components/top-scorers/scorer-podium";

export const dynamic = "force-dynamic";

async function FullTopScorers() {
  const result = await getTopScorers(undefined, 50);
  if (result.status === "error") return <ErrorState message={result.message} />;

  return <ScorerPodium list={result.status === "empty" ? [] : result.data} metric="goals" resource="هدف" empty="لا يوجد هدافون مسجّلون بعد." />;
}

async function FullTopAssisters() {
  const result = await getTopAssisters(undefined, 50);
  if (result.status === "error") return <ErrorState message={result.message} />;

  return <ScorerPodium list={result.status === "empty" ? [] : result.data} metric="assists" resource="أسيست" empty="لا يوجد صنّاع أهداف مسجّلون بعد." />;
}

export default async function TopScorersPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <PageHero title="ترتيب الهدافين" tag="TOP SCORERS" description="أفضل الهدافين وصنّاع الأهداف في الدوري هذا الموسم." />
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl border border-line bg-surface" />}>
          <FullTopScorers />
        </Suspense>
        <div className="mt-10">
          <SectionHeader title="أفضل صنّاع الأهداف" tag="TOP ASSISTS" bordered={false} />
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl border border-line bg-surface" />}>
            <FullTopAssisters />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
