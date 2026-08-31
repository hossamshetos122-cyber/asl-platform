import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFeaturedTournamentId, getTopAssisters, getTopScorers } from "@/lib/stats";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImageDisplay } from "@/components/ui/image-display";

export const dynamic = "force-dynamic";

async function FullTopScorers() {
  const tournamentResult = await getFeaturedTournamentId();
  if (tournamentResult.status === "error") return <ErrorState message={tournamentResult.message} />;
  if (tournamentResult.status === "empty") return <EmptyState message="لا توجد بطولة جارية حاليًا." />;

  const result = await getTopScorers(tournamentResult.data, 50);
  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا يوجد هدافون مسجّلون بعد هذا الموسم." />;

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line-strong bg-surface-elevated/40">
              <th className="px-3 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase w-10">#</th>
              <th className="px-3 py-2.5 text-right font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">اللاعب</th>
              <th className="px-3 py-2.5 text-right font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase hidden sm:table-cell">الفريق</th>
              <th className="px-3 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-emerald-500 uppercase">الأهداف</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((scorer) => (
              <tr key={scorer.playerId} className="border-b border-line/40 transition-colors hover:bg-surface-elevated/30">
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded font-num text-[10px] font-bold ${scorer.rank === 1 ? "bg-emerald-500 text-bg" : scorer.rank <= 3 ? "border border-emerald-500/40 text-emerald-500" : "text-text-dimmer"}`}>
                    {String(scorer.rank).padStart(2, "0")}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/players/${scorer.playerId}`} className="flex items-center gap-2 group py-1.5 -my-1.5">
                    <ImageDisplay src={scorer.photoUrl} alt={scorer.playerName} type="player" size="sm" />
                    <div>
                      <span className="font-body text-[12px] font-bold text-text group-hover:text-accent transition-colors block">{scorer.playerName}</span>
                      <span className="font-utility text-[8px] tracking-wider text-text-dimmer uppercase sm:hidden">{scorer.teamName}</span>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2.5 font-body text-[12px] text-text-dim hidden sm:table-cell">{scorer.teamName}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-emerald-500/10 px-1.5 font-num text-[12px] font-bold text-emerald-500">{scorer.goals}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function FullTopAssisters() {
  const tournamentResult = await getFeaturedTournamentId();
  if (tournamentResult.status === "error") return <ErrorState message={tournamentResult.message} />;
  if (tournamentResult.status === "empty") return <EmptyState message="لا توجد بطولة جارية حاليًا." />;

  const result = await getTopAssisters(tournamentResult.data, 50);
  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا يوجد صنّاع أهداف مسجّلون بعد هذا الموسم." />;

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line-strong bg-surface-elevated/40">
              <th className="px-3 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase w-10">#</th>
              <th className="px-3 py-2.5 text-right font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">اللاعب</th>
              <th className="px-3 py-2.5 text-right font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase hidden sm:table-cell">الفريق</th>
              <th className="px-3 py-2.5 text-center font-utility text-[9px] tracking-[0.12em] text-amber-400 uppercase">الأسيست</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((assister) => (
              <tr key={assister.playerId} className="border-b border-line/40 transition-colors hover:bg-surface-elevated/30">
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded font-num text-[10px] font-bold ${assister.rank === 1 ? "bg-amber-400 text-bg" : assister.rank <= 3 ? "border border-amber-400/40 text-amber-400" : "text-text-dimmer"}`}>
                    {String(assister.rank).padStart(2, "0")}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/players/${assister.playerId}`} className="flex items-center gap-2 group py-1.5 -my-1.5">
                    <ImageDisplay src={assister.photoUrl} alt={assister.playerName} type="player" size="sm" />
                    <div>
                      <span className="font-body text-[12px] font-bold text-text group-hover:text-accent transition-colors block">{assister.playerName}</span>
                      <span className="font-utility text-[8px] tracking-wider text-text-dimmer uppercase sm:hidden">{assister.teamName}</span>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2.5 font-body text-[12px] text-text-dim hidden sm:table-cell">{assister.teamName}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-amber-400/10 px-1.5 font-num text-[12px] font-bold text-amber-400">{assister.assists}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function TopScorersPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="ترتيب الهدافين" tag="TOP SCORERS" bordered={false} />
        <FullTopScorers />
        <div className="mt-10">
          <SectionHeader title="أفضل صنّاع الأهداف" tag="TOP ASSISTS" bordered={false} />
          <FullTopAssisters />
        </div>
      </main>
      <Footer />
    </>
  );
}
