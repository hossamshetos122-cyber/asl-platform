import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFeaturedTournamentId, getStandings } from "@/lib/stats";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageDisplay } from "@/components/ui/image-display";
import Link from "next/link";

async function FullStandings() {
  const tournamentResult = await getFeaturedTournamentId();
  if (tournamentResult.status === "error") return <ErrorState message={tournamentResult.message} />;
  if (tournamentResult.status === "empty") return <EmptyState message="لا توجد بطولة جارية حاليًا." />;

  const result = await getStandings(tournamentResult.data, 50);
  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لم يتم لعب مباريات كافية لعرض الترتيب بعد." />;

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-line bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line-strong bg-surface-elevated/40">
                <th className="px-3 py-2.5 text-right font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase w-10">#</th>
                <th className="px-3 py-2.5 text-right font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">الفريق</th>
                <th className="px-2.5 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">لعب</th>
                <th className="px-2.5 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">فوز</th>
                <th className="px-2.5 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">تعادل</th>
                <th className="px-2.5 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">خسارة</th>
                <th className="px-2.5 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">له</th>
                <th className="px-2.5 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">عليه</th>
                <th className="px-2.5 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">الفرق</th>
                <th className="px-3 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-emerald-500 uppercase">نقاط</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((row) => {
                const gd = row.goalsFor - row.goalsAgainst;
                return (
                  <tr key={row.team.id} className={`border-b border-line/40 transition-colors hover:bg-surface-elevated/30 ${row.rank <= 3 ? "bg-emerald-500/[0.05]" : ""}`}>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded font-num text-[10px] font-bold ${row.rank === 1 ? "bg-emerald-500 text-bg" : row.rank <= 3 ? "border border-emerald-500/40 text-emerald-500" : "text-text-dimmer"}`}>{row.rank}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/teams/${row.team.id}`} className="flex items-center gap-2 group py-1.5 -my-1.5">
                        <ImageDisplay src={row.team.crestUrl} alt={row.team.name} type="team-logo" size="xs" shortCode={row.team.shortCode} />
                        <span className="font-body text-[12px] font-bold text-text group-hover:text-accent transition-colors truncate">{row.team.name}</span>
                      </Link>
                    </td>
                    <td className="px-2.5 py-2.5 text-center font-num text-[12px] text-text-dim">{row.played}</td>
                    <td className="px-2.5 py-2.5 text-center font-num text-[12px] font-bold text-emerald-400">{row.won}</td>
                    <td className="px-2.5 py-2.5 text-center font-num text-[12px] text-text-dimmer">{row.drawn}</td>
                    <td className="px-2.5 py-2.5 text-center font-num text-[12px] text-live/60">{row.lost}</td>
                    <td className="px-2.5 py-2.5 text-center font-num text-[12px] text-text-dim">{row.goalsFor}</td>
                    <td className="px-2.5 py-2.5 text-center font-num text-[12px] text-text-dim">{row.goalsAgainst}</td>
                    <td className="px-2.5 py-2.5 text-center">
                      <span className={`font-num text-[12px] font-bold ${gd > 0 ? "text-emerald-400" : gd < 0 ? "text-live/70" : "text-text-dim"}`}>
                        {gd > 0 ? "+" : ""}{gd}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-emerald-500/10 px-1.5 font-num text-[12px] font-bold text-emerald-500">{row.points}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {result.data.map((row) => {
          const gd = row.goalsFor - row.goalsAgainst;
          return (
            <Link key={row.team.id} href={`/teams/${row.team.id}`} className="block rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded font-num text-[11px] font-bold ${row.rank === 1 ? "bg-emerald-500 text-bg" : row.rank <= 3 ? "border border-emerald-500/40 text-emerald-500" : "text-text-dimmer"}`}>{row.rank}</span>
                <ImageDisplay src={row.team.crestUrl} alt={row.team.name} type="team-logo" size="sm" shortCode={row.team.shortCode} />
                <div className="flex-1 min-w-0">
                  <div className="font-body text-[13px] font-bold text-text truncate">{row.team.name}</div>
                  <div className="font-utility text-[8px] tracking-wider text-text-dimmer uppercase">{row.played} مباراة</div>
                </div>
                <div className="text-left">
                  <div className="inline-flex h-7 min-w-[28px] items-center justify-center rounded bg-emerald-500/10 px-2 font-num text-sm font-bold text-emerald-500">{row.points}</div>
                  <div className="mt-0.5 text-center font-num text-[10px] text-text-dimmer">
                    {row.won}ف {row.drawn}ت {row.lost}خ
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-line/40 pt-2 font-num text-[11px]">
                <span className="text-text-dimmer">{row.goalsFor} هـ / {row.goalsAgainst} ع</span>
                <span className={`font-bold ${gd > 0 ? "text-emerald-400" : gd < 0 ? "text-live/70" : "text-text-dim"}`}>
                  فرق {gd > 0 ? "+" : ""}{gd}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
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
