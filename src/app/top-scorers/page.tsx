import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFeaturedTournamentId, getTopScorers } from "@/lib/data/home";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

async function FullTopScorers() {
  const tournamentResult = await getFeaturedTournamentId();
  if (tournamentResult.status === "error") return <ErrorState message={tournamentResult.message} />;
  if (tournamentResult.status === "empty") return <EmptyState message="لا توجد بطولة جارية حاليًا." />;

  const result = await getTopScorers(tournamentResult.data, 50);
  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا يوجد هدافون مسجّلون بعد هذا الموسم." />;

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-raised">
            <th className="table-header text-center w-16">#</th>
            <th className="table-header text-right">اللاعب</th>
            <th className="table-header text-right">الفريق</th>
            <th className="table-header text-center w-20">الأهداف</th>
          </tr>
        </thead>
        <tbody>
          {result.data.map((scorer) => (
            <tr key={scorer.playerId} className="transition-colors hover:bg-bg-raised/50">
              <td className="table-cell text-center">
                {scorer.photoUrl ? (
                  <Image src={scorer.photoUrl} alt={scorer.playerName} width={32} height={32} className="h-8 w-8 rounded-full object-cover mx-auto" />
                ) : (
                  <span className={scorer.rank === 1 ? "rank-badge-1" : scorer.rank <= 3 ? "rank-badge-top" : "rank-badge-normal"}>
                    {scorer.rank}
                  </span>
                )}
              </td>
              <td className="table-cell font-bold text-text">
                <Link href={`/players/${scorer.playerId}`} className="hover:text-gold transition-colors">
                  {scorer.playerName}
                </Link>
              </td>
              <td className="table-cell">{scorer.teamName}</td>
              <td className="table-cell text-center">
                <span className="font-num text-lg font-bold text-gold">{scorer.goals}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TopScorersPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="ترتيب الهدافين" tag="TOP SCORERS" bordered={false} />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <FullTopScorers />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
