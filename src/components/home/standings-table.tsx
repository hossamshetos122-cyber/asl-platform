import Image from "next/image";
import Link from "next/link";
import { getStandings } from "@/lib/data/home";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

interface StandingsTableProps {
  tournamentId: string;
}

const COLUMNS = [
  { key: "played", label: "لعب" },
  { key: "won", label: "فوز" },
  { key: "drawn", label: "تعادل" },
  { key: "lost", label: "خسارة" },
  { key: "goalsFor", label: "له" },
  { key: "goalsAgainst", label: "عليه" },
  { key: "points", label: "نقاط" },
] as const;

export async function StandingsTable({ tournamentId }: StandingsTableProps) {
  const result = await getStandings(tournamentId, 5);

  return (
    <div className="bg-bg-raised/50 p-5 sm:p-6 rounded-xl">
      <SectionHeader title="ترتيب الدوري" tag="TABLE" href="/standings" bordered={false} />

      {result.status === "error" && <ErrorState message={result.message} />}
      {result.status === "empty" && <EmptyState message="لم يتم لعب مباريات كافية لعرض الترتيب بعد." />}

      {result.status === "success" && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header text-right">الفريق</th>
                {COLUMNS.map((col) => (
                  <th key={col.key} className="table-header text-center">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.map((row) => (
                <tr key={row.team.id} className="transition-colors hover:bg-bg-raised2/50">
                  <td className="table-cell">
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
      )}
    </div>
  );
}
