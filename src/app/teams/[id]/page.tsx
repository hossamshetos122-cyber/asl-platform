import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTeamById } from "@/lib/data/teams";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: "حارس مرمى", DEFENDER: "مدافع", MIDFIELDER: "لاعب وسط", FORWARD: "مهاجم",
};

const POSITION_SHORT: Record<string, string> = {
  GOALKEEPER: "GK", DEFENDER: "DF", MIDFIELDER: "MF", FORWARD: "FW",
};

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = await params;
  const result = await getTeamById(id);

  if (result.status === "error" || result.status === "empty") notFound();

  const team = result.data;

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <Link href="/teams" className="mb-6 inline-flex items-center gap-1 font-body text-sm text-gold hover:text-gold-bright transition-colors">
          <svg className="h-3 w-3 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 6h8M7 3l3 3-3 3" />
          </svg>
          العودة للفرق
        </Link>

        {/* Team Header */}
        <div className="card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Team Logo */}
            <div className="flex-shrink-0">
              {team.crestUrl ? (
                <Image
                  src={team.crestUrl}
                  alt={`شعار ${team.name}`}
                  width={120}
                  height={120}
                  className="h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-2xl border border-line"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center rounded-2xl border border-line bg-bg-raised2 font-display text-2xl sm:text-3xl font-bold text-gold">
                  {team.shortCode}
                </div>
              )}
            </div>
            <div className="text-center sm:text-right flex-1">
              <h1 className="font-display text-2xl sm:text-3xl font-black text-text">{team.name}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="badge-muted">{team.shortCode}</span>
                <span className="badge-muted">{team.city}</span>
                {team.foundedAt && (
                  <span className="badge-muted">
                    تأسس {new Intl.DateTimeFormat("ar-EG", { year: "numeric" }).format(team.foundedAt)}
                  </span>
                )}
              </div>
              {/* Tournaments */}
              {team.tournaments.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {team.tournaments.map((t) => (
                    <Link key={t.id} href={`/tournaments/${t.id}`} className="badge-gold hover:bg-gold/30 transition-colors">
                      {t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4 text-center">
            <div className="font-num text-2xl font-bold text-gold">{team.playerCount}</div>
            <div className="font-utility text-[10px] tracking-wider text-text-dimmer mt-1">لاعب مسجّل</div>
          </div>
          <div className="card p-4 text-center">
            <div className="font-num text-2xl font-bold text-gold">{team.squadLimit}</div>
            <div className="font-utility text-[10px] tracking-wider text-text-dimmer mt-1">الحد الأقصى</div>
          </div>
          <div className="card p-4 text-center">
            <div className="font-num text-2xl font-bold text-text">{team.players.reduce((sum, p) => sum + p.goals, 0)}</div>
            <div className="font-utility text-[10px] tracking-wider text-text-dimmer mt-1">هدف الفريق</div>
          </div>
        </div>

        {/* Squad */}
        <div className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title text-lg">
              القائمة
            </h2>
            <span className={`font-num text-sm font-bold ${team.playerCount >= team.squadLimit ? "text-live" : "text-text-dim"}`}>
              {team.playerCount} / {team.squadLimit}
            </span>
          </div>

          {team.players.length === 0 ? (
            <p className="font-body text-sm text-text-dimmer">لا يوجد لاعبون مسجّلون في هذا الفريق بعد.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {team.players.map((player) => (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="flex items-center gap-3 rounded-lg border border-line px-4 py-3 transition-colors hover:bg-bg-raised2/50 group"
                >
                  {player.photoUrl ? (
                    <Image
                      src={player.photoUrl}
                      alt={player.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-raised2 flex-shrink-0">
                      <svg className="h-5 w-5 text-text-dimmer" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-body text-sm font-bold text-text truncate group-hover:text-gold transition-colors">{player.name}</div>
                    <div className="font-utility text-[10px] tracking-wider text-text-dimmer">
                      {POSITION_LABELS[player.position] ?? player.position}
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-bg-raised2 font-num text-xs font-bold text-gold">
                      {player.jerseyNumber ?? "-"}
                    </div>
                    {player.goals > 0 && (
                      <div className="mt-1 text-center font-num text-[10px] font-bold text-gold">{player.goals} ه</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
