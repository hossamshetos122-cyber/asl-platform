import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTournaments } from "@/lib/data/tournaments";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatLongDate } from "@/lib/dates";

const STATUS_LABELS: Record<string, string> = { UPCOMING: "قادم", ONGOING: "جاري", COMPLETED: "منتهي", CANCELLED: "ملغى" };
const STATUS_CLASSES: Record<string, string> = { UPCOMING: "badge-muted", ONGOING: "badge-accent", COMPLETED: "badge-success", CANCELLED: "badge-muted" };
const FORMAT_LABELS: Record<string, string> = { LEAGUE: "دوري", KNOCKOUT: "كأس", GROUPS_KNOCKOUT: "مجموعات + إقصائي", CUP: "كأس", CHAMPIONS_LEAGUE: "دوري الأبطال" };

function formatDate(date: Date): string {
  return formatLongDate(date);
}

async function TournamentList() {
  const result = await getTournaments();

  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا توجد بطولات مسجّلة بعد." />;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {result.data.map((tournament) => (
        <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="group rounded-xl border border-line bg-surface p-4 sm:p-5 premier-card">
          <div className="mb-3 flex items-center gap-1.5">
            <span className={STATUS_CLASSES[tournament.status] ?? "badge-muted"}>{STATUS_LABELS[tournament.status] ?? tournament.status}</span>
            <span className="rounded bg-surface-elevated border border-line px-1.5 py-0.5 font-utility text-[8px] tracking-wider text-text-dimmer uppercase">{FORMAT_LABELS[tournament.format] ?? tournament.format}</span>
          </div>
          <h3 className="mb-2.5 font-display text-sm sm:text-base font-black text-text group-hover:text-accent transition-colors leading-tight">{tournament.name}</h3>
          <div className="flex items-center justify-between font-body text-[11px] text-text-dimmer">
            <span>{formatDate(tournament.startDate)}</span>
            <span className="font-num font-bold text-emerald-500">{tournament.teamCount} فريق</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="البطولات" tag="COMPETITIONS" bordered={false} />
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <TournamentList />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
