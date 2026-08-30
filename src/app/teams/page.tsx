import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTeams } from "@/lib/data/teams";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImageDisplay } from "@/components/ui/image-display";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function TeamList() {
  const result = await getTeams();

  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا توجد فرق مسجّلة بعد." />;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
      {result.data.map((team) => (
        <Link
          key={team.id}
          href={`/teams/${team.id}`}
          className="group rounded-xl border border-line bg-surface p-4 premier-card animate-fade-up"
        >
          <div className="flex items-center gap-3">
            <ImageDisplay src={team.crestUrl} alt={`شعار ${team.name}`} type="team-logo" size="lg" shortCode={team.shortCode} />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm font-black text-text group-hover:text-accent transition-colors truncate">{team.name}</h3>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="rounded bg-surface-elevated px-1.5 py-0.5 font-utility text-[8px] tracking-wider text-text-dimmer uppercase">{team.shortCode}</span>
                {team.city && <span className="font-body text-[10px] text-text-dimmer">{team.city}</span>}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function TeamsPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="الفرق" tag="TEAMS" bordered={false} />
        <TeamList />
      </main>
      <Footer />
    </>
  );
}
