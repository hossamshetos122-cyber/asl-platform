import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchAdminDetail, getTeamActiveRoster } from "@/lib/data/matches";
import { SquadManager } from "./squad-manager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchSquadsPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getMatchAdminDetail(id);
  if (result.status !== "success") notFound();
  const match = result.data;

  const [homeRoster, awayRoster] = await Promise.all([
    getTeamActiveRoster(match.homeTeam.id),
    getTeamActiveRoster(match.awayTeam.id),
  ]);

  return (
    <div>
      <Link
        href="/admin/matches"
        className="mb-4 inline-flex items-center gap-1 font-body text-sm text-gold hover:text-gold-bright transition-colors"
      >
        <svg className="h-3 w-3 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 6h8M7 3l3 3-3 3" />
        </svg>
        العودة للمباريات
      </Link>

      <h1 className="mb-2 font-display text-2xl font-black text-text">قوائم المباراة</h1>
      <p className="mb-6 font-body text-sm text-text-dim">
        {match.homeTeam.name} vs {match.awayTeam.name} — {match.status}
      </p>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SquadManager
          matchId={match.id}
          side="home"
          team={match.homeTeam}
          initialSquad={match.homeSquad}
          roster={homeRoster}
        />
        <SquadManager
          matchId={match.id}
          side="away"
          team={match.awayTeam}
          initialSquad={match.awaySquad}
          roster={awayRoster}
        />
      </div>
    </div>
  );
}
