import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTeams } from "@/lib/data/teams";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/ui/team-badge";
import Link from "next/link";

async function TeamList() {
  const result = await getTeams();

  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا توجد فرق مسجّلة بعد." />;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {result.data.map((team) => (
        <Link key={team.id} href={`/teams/${team.id}`} className="card-hover flex items-center gap-4 p-5">
          <TeamBadge team={team} size="lg" />
          <div>
            <h3 className="mb-1 font-display text-base sm:text-lg font-extrabold text-text group-hover:text-gold transition-colors">
              {team.name}
            </h3>
            <span className="font-utility text-[10px] tracking-wider text-text-dimmer uppercase">{team.shortCode}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function TeamsPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="الفرق" tag="TEAMS" bordered={false} />
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <TeamList />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
