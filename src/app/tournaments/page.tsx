import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTournaments } from "@/lib/data/tournaments";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "قادم", ONGOING: "جاري", COMPLETED: "منتهي", CANCELLED: "ملغى",
};

const STATUS_CLASSES: Record<string, string> = {
  UPCOMING: "badge-muted", ONGOING: "badge-gold", COMPLETED: "badge-success", CANCELLED: "badge-muted",
};

const FORMAT_LABELS: Record<string, string> = {
  LEAGUE: "دوري", KNOCKOUT: "كأس", GROUPS_KNOCKOUT: "asyarakتي + إقصائي",
  CUP: "كأس", CHAMPIONS_LEAGUE: "دوري الأبطال",
};

const FORMAT_CLASSES: Record<string, string> = {
  LEAGUE: "badge-gold", KNOCKOUT: "badge-live", GROUPS_KNOCKOUT: "badge-success",
  CUP: "badge-live", CHAMPIONS_LEAGUE: "badge-gold",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

async function TournamentList() {
  const result = await getTournaments();

  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا توجد بطولات مسجّلة بعد." />;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {result.data.map((tournament) => (
        <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="card-hover p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className={FORMAT_CLASSES[tournament.format] ?? "badge-muted"}>
              {FORMAT_LABELS[tournament.format] ?? tournament.format}
            </span>
            <span className={STATUS_CLASSES[tournament.status] ?? "badge-muted"}>
              {STATUS_LABELS[tournament.status] ?? tournament.status}
            </span>
          </div>

          <h3 className="mb-3 font-display text-base sm:text-lg font-extrabold text-text group-hover:text-gold transition-colors leading-tight">
            {tournament.name}
          </h3>

          <div className="flex items-center justify-between font-utility text-[10px] sm:text-xs text-text-dimmer">
            <span>{formatDate(tournament.startDate)}</span>
            <span>{tournament.teamCount} {tournament.teamCount === 1 ? "فريق" : "فرق"}</span>
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
