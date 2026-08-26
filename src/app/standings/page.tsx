import { Suspense } from "react";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFeaturedTournamentId, getStandings } from "@/lib/data/home";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const COLUMNS = [
  { key: "played", label: "لعب" },
  { key: "won", label: "فوز" },
  { key: "drawn", label: "تعادل" },
  { key: "lost", label: "خسارة" },
  { key: "goalsFor", label: "له" },
  { key: "goalsAgainst", label: "عليه" },
  { key: "goalDiff", label: "الفرق" },
  { key: "points", label: "نقاط" },
] as const;

async function FullStandings() {
  const tournamentResult = await getFeaturedTournamentId();
  if (tournamentResult.status === "error") return <ErrorState message={tournamentResult.message} />;
  if (tournamentResult.status === "empty") return <EmptyState message="لا توجد بطولة جارية حاليًا." />;

  const result = await getStandings(tournamentResult.data, 50);
  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لم يتم لعب مباريات كافية لعرض الترتيب بعد." />;

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-raised">
            <th className="table-header text-right pl-4">الفريق</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="table-header text-center">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.data.map((row) => (
            <tr key={row.team.id} className="transition-colors hover:bg-bg-raised/50">
              <td className="table-cell pl-4">
                <div className="flex items-center gap-2.5">
                  {row.team.crestUrl ? (
                    <Image src={row.team.crestUrl} alt={row.team.name} width={24} height={24} className="h-6 w-6 rounded object-contain" />
                  ) : (
                    <span className={row.rank === 1 ? "rank-badge-1" : row.rank <= 3 ? "rank-badge-top" : "rank-badge-normal"}>
                      {row.rank}
                    </span>
                  )}
                  <Link href={`/teams/${row.team.id}`} className="font-bold text-text hover:text-gold transition-colors">
                    {row.team.name}
                  </Link>
                </div>
              </td>
              {COLUMNS.map((col) => (
                <td key={col.key} className="table-cell text-center">
                  {col.key === "points" ? (
                    <span className="font-num text-base font-bold text-gold">{row[col.key]}</span>
                  ) : col.key === "goalDiff" ? (
                    <span className={row.goalsFor - row.goalsAgainst > 0 ? "text-green-400" : row.goalsFor - row.goalsAgainst < 0 ? "text-live" : "text-text-dim"}>
                      {row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}{row.goalsFor - row.goalsAgainst}
                    </span>
                  ) : (
                    row[col.key]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StandingsPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="جدول الترتيب" tag="STANDINGS" bordered={false} />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <FullStandings />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
