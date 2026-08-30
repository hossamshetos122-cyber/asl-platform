import Link from "next/link";
import { getStandings } from "@/lib/stats";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImageDisplay } from "@/components/ui/image-display";

interface StandingsTableProps {
  tournamentId: string;
}

export async function StandingsTable({ tournamentId }: StandingsTableProps) {
  const result = await getStandings(tournamentId, 8);

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="px-4 pt-4 pb-0">
        <SectionHeader title="جدول الترتيب" tag="TABLE" href="/standings" bordered={false} />
      </div>

      {result.status === "error" && <div className="px-4 pb-4"><ErrorState message={result.message} /></div>}
      {result.status === "empty" && <div className="px-4 pb-4"><EmptyState message="لم يتم لعب مباريات كافية لعرض الترتيب بعد." /></div>}

      {result.status === "success" && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line-strong bg-surface-elevated/40">
                <th className="px-3 py-2 text-right font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase w-8">#</th>
                <th className="px-3 py-2 text-right font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">الفريق</th>
                <th className="px-2 py-2 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">لعب</th>
                <th className="px-2 py-2 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">فوز</th>
                <th className="px-2 py-2 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase hidden sm:table-cell">تعادل</th>
                <th className="px-2 py-2 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase hidden sm:table-cell">خسارة</th>
                <th className="px-3 py-2 text-center font-utility text-[9px] tracking-[0.12em] text-accent uppercase">نقاط</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((row) => (
                <tr key={row.team.id} className={`border-b border-line/40 transition-colors hover:bg-surface-elevated/30 ${row.rank <= 3 ? "bg-emerald-500/[0.05]" : ""}`}>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded font-num text-[10px] font-bold ${
                      row.rank === 1 ? "bg-emerald-500 text-bg" : row.rank <= 3 ? "border border-emerald-500/40 text-emerald-500" : "text-text-dimmer"
                    }`}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/teams/${row.team.id}`} className="flex items-center gap-2 group py-1.5 -my-1.5">
                      <ImageDisplay src={row.team.crestUrl} alt={row.team.name} type="team-logo" size="xs" shortCode={row.team.shortCode} />
                      <span className="font-body text-[12px] font-bold text-text group-hover:text-accent transition-colors truncate">{row.team.name}</span>
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-center font-num text-[12px] text-text-dim">{row.played}</td>
                  <td className="px-2 py-2.5 text-center font-num text-[12px] font-bold text-emerald-400">{row.won}</td>
                  <td className="px-2 py-2.5 text-center font-num text-[12px] text-text-dimmer hidden sm:table-cell">{row.drawn}</td>
                  <td className="px-2 py-2.5 text-center font-num text-[12px] text-live/60 hidden sm:table-cell">{row.lost}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-emerald-500/10 px-1.5 font-num text-[12px] font-bold text-emerald-500">
                      {row.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
