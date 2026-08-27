import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTournamentById } from "@/lib/data/tournaments";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ImageDisplay } from "@/components/ui/image-display";

const STATUS_LABELS: Record<string, string> = { UPCOMING: "قادم", ONGOING: "جاري", COMPLETED: "منتهي", CANCELLED: "ملغى" };
const STATUS_CLASSES: Record<string, string> = { UPCOMING: "badge-muted", ONGOING: "badge-gold", COMPLETED: "badge-success", CANCELLED: "badge-muted" };
const FORMAT_LABELS: Record<string, string> = { LEAGUE: "دوري", KNOCKOUT: "كأس", GROUPS_KNOCKOUT: "مجموعات + إقصائي", CUP: "كأس", CHAMPIONS_LEAGUE: "دوري الأبطال" };

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

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-elevated/40 to-surface" />
        <div className="page-container relative py-6 sm:py-10">
          <Link href="/tournaments" className="mb-5 inline-flex items-center gap-1.5 font-body text-sm font-bold text-gold hover:text-gold-bright transition-colors">
            <svg className="h-3.5 w-3.5 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M7 3l3 3-3 3" /></svg>
            العودة للبطولات
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={STATUS_CLASSES[tournament.status] ?? "badge-muted"}>{STATUS_LABELS[tournament.status] ?? tournament.status}</span>
            <span className="rounded bg-surface-elevated border border-line px-2 py-0.5 font-utility text-[9px] tracking-wider text-text-dimmer uppercase">{FORMAT_LABELS[tournament.format] ?? tournament.format}</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-black text-text mb-2.5">{tournament.name}</h1>

          <div className="flex flex-wrap items-center gap-3 font-body text-[13px] text-text-dim">
            <span>بدأ {formatDate(tournament.startDate)}</span>
            {tournament.endDate && <span>ينتهي {formatDate(tournament.endDate)}</span>}
            <span className="font-num font-bold text-gold">{tournament.teams.length} فريق مشارك</span>
          </div>
        </div>
      </section>

      <main className="page-container page-padding">
        {tournament.teams.length > 0 && (
          <div className="rounded-xl border border-line bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <h2 className="font-display text-base font-black text-text">الفرق المشاركة</h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {tournament.teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`} className="group flex items-center gap-2.5 rounded-lg border border-line/40 px-3 py-2.5 transition-all hover:bg-surface-elevated hover:border-line">
                  <ImageDisplay src={team.crestUrl} alt={`شعار ${team.name}`} type="team-logo" size="sm" shortCode={team.shortCode} />
                  <div className="min-w-0">
                    <div className="font-body text-[12px] font-bold text-text truncate group-hover:text-gold transition-colors">{team.name}</div>
                    <div className="font-utility text-[8px] tracking-wider text-text-dimmer uppercase">{team.shortCode}</div>
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
