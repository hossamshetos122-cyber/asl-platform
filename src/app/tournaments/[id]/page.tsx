import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTournamentById } from "@/lib/data/tournaments";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TeamBadge } from "@/components/ui/team-badge";

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "قادم", ONGOING: "جاري", COMPLETED: "منتهي", CANCELLED: "ملغى",
};

const STATUS_CLASSES: Record<string, string> = {
  UPCOMING: "badge-muted", ONGOING: "badge-gold", COMPLETED: "badge-success", CANCELLED: "badge-muted",
};

const FORMAT_LABELS: Record<string, string> = {
  LEAGUE: "دوري", KNOCKOUT: "كأس", GROUPS_KNOCKOUT: "קבוציות + إقصائي",
  CUP: "كأس", CHAMPIONS_LEAGUE: "دوري الأبطال",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

interface TournamentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { id } = await params;
  const result = await getTournamentById(id);

  if (result.status === "error" || result.status === "empty") notFound();

  const tournament = result.data;

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <Link href="/tournaments" className="mb-6 inline-flex items-center gap-1 font-body text-sm text-gold hover:text-gold-bright transition-colors">
          <svg className="h-3 w-3 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 6h8M7 3l3 3-3 3" />
          </svg>
          العودة للبطولات
        </Link>

        {/* Tournament Header */}
        <div className="card p-6 sm:p-8 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={STATUS_CLASSES[tournament.status] ?? "badge-muted"}>
              {STATUS_LABELS[tournament.status] ?? tournament.status}
            </span>
            <span className="badge-muted">{FORMAT_LABELS[tournament.format] ?? tournament.format}</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-black text-text mb-3">{tournament.name}</h1>

          <div className="flex flex-wrap items-center gap-4 font-body text-sm text-text-dim">
            <span>بدأ {formatDate(tournament.startDate)}</span>
            {tournament.endDate && <span>ينتهي {formatDate(tournament.endDate)}</span>}
            <span>{tournament.teams.length} فريق مشارك</span>
          </div>
        </div>

        {/* Teams */}
        {tournament.teams.length > 0 && (
          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 section-title text-lg">الفرق المشاركة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {tournament.teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="flex items-center gap-3 rounded-lg border border-line px-4 py-3 transition-colors hover:bg-bg-raised2/50 hover:border-line-gold"
                >
                  <TeamBadge team={team} size="sm" />
                  <div className="min-w-0">
                    <div className="font-body text-sm font-bold text-text truncate">{team.name}</div>
                    <div className="font-utility text-[10px] tracking-wider text-text-dimmer">{team.shortCode}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
