import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getTeamById } from "@/lib/data/teams";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ImageDisplay } from "@/components/ui/image-display";
import { formatYear } from "@/lib/dates";
import { TeamEditForm, TeamDeleteButton } from "./team-owner-actions";
import { PlayerManager, RemovePlayerButton } from "./player-manager";

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: "حارس مرمى", DEFENDER: "مدافع", MIDFIELDER: "لاعب وسط", FORWARD: "مهاجم",
};

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = await params;
  const [result, currentUser] = await Promise.all([getTeamById(id), getCurrentUser()]);

  if (result.status === "error" || result.status === "empty") notFound();

  const team = result.data;
  const isOwner = currentUser && team.ownerId === currentUser.id;
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-elevated/40 to-surface" />
        <div className="page-container relative pt-10 sm:pt-14 pb-6 sm:pb-10">
          <Link href="/teams" className="mb-5 inline-flex items-center gap-1.5 py-2 -my-2 font-body text-sm font-bold text-accent hover:text-accent-bright transition-colors">
            <svg className="h-3.5 w-3.5 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M7 3l3 3-3 3" /></svg>
            العودة للفرق
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7">
            <ImageDisplay src={team.crestUrl} alt={`شعار ${team.name}`} type="team-logo" size="xl" shortCode={team.shortCode} />
            <div className="flex-1 text-center sm:text-right">
              <h1 className="font-display text-2xl sm:text-3xl font-black text-text">{team.name}</h1>
              <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="rounded bg-accent/8 border border-accent/15 px-2 py-0.5 font-utility text-[9px] tracking-[0.12em] text-accent uppercase">{team.shortCode}</span>
                <span className="rounded bg-surface-elevated border border-line px-2 py-0.5 font-body text-[11px] text-text-dim">{team.city}</span>
                {team.foundedAt && (
                  <span className="rounded bg-surface-elevated border border-line px-2 py-0.5 font-body text-[11px] text-text-dim">
                    تأسس {formatYear(team.foundedAt)}
                  </span>
                )}
              </div>
              {team.tournaments.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  {team.tournaments.map((t) => (
                    <Link key={t.id} href={`/tournaments/${t.id}`} className="rounded border border-accent/15 bg-accent/5 px-2 py-0.5 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/10">{t.name}</Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="page-container page-padding">
        {/* Owner Actions */}
        {(isOwner || isAdmin) && (
          <div className="mb-5 rounded-xl border border-accent/15 bg-surface p-4">
            <h3 className="mb-2.5 font-display text-sm font-black text-accent">إدارة الفريق</h3>
            <TeamEditForm teamId={team.id} initialName={team.name} initialShortName={team.shortCode} initialCity={team.city} initialCrestUrl={team.crestUrl} />
            <div className="mt-2"><TeamDeleteButton teamId={team.id} /></div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-line bg-surface p-3.5 text-center">
            <div className="font-num text-xl font-bold text-emerald-500">{team.playerCount}</div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">لاعب</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-3.5 text-center">
            <div className="font-num text-xl font-bold text-text-dim">{team.squadLimit}</div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">الحد الأقصى</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-3.5 text-center">
            <div className="font-num text-xl font-bold text-emerald-400">{team.players.reduce((sum, p) => sum + p.goals, 0)}</div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">هدف الفريق</div>
          </div>
        </div>

        {/* Squad */}
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h2 className="font-display text-base font-black text-text">القائمة</h2>
            <span className={`font-num text-[12px] font-bold ${team.playerCount >= team.squadLimit ? "text-live" : "text-text-dim"}`}>
              {team.playerCount} / {team.squadLimit}
            </span>
          </div>
          <div className="p-4">
            {(isOwner || isAdmin) && <PlayerManager teamId={team.id} currentCount={team.playerCount} maxCount={team.squadLimit} />}
            {team.players.length === 0 ? (
              <p className="font-body text-sm text-text-dimmer py-6 text-center">
                {(isOwner || isAdmin) ? "لا يوجد لاعبون بعد. أضف لاعب للبدء." : "لا يوجد لاعبون مسجّلون في هذا الفريق بعد."}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {team.players.map((player) => (
                  <Link key={player.id} href={`/players/${player.id}`} className="group relative flex items-center gap-2.5 rounded-lg border border-line/40 px-3 py-2.5 transition-all hover:bg-surface-elevated hover:border-line">
                    <ImageDisplay src={player.photoUrl} alt={player.name} type="player" size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="font-body text-[12px] font-bold text-text truncate group-hover:text-accent transition-colors">{player.name}</div>
                      <div className="font-utility text-[8px] tracking-wider text-text-dimmer uppercase">{POSITION_LABELS[player.position] ?? player.position}</div>
                    </div>
                    <div className="flex-shrink-0 text-left">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-surface-elevated font-num text-[10px] font-bold text-emerald-500">{player.jerseyNumber ?? "-"}</div>
                      {(player.goals > 0 || player.yellows > 0 || player.reds > 0) && (
                        <div className="mt-1 flex items-center justify-end gap-1">
                          {player.goals > 0 && <span className="font-num text-[9px] font-bold text-emerald-400">{player.goals} ه</span>}
                          {player.yellows > 0 && (
                            <span className="inline-flex h-4 min-w-6 items-center justify-center rounded-sm border border-yellow-400/35 bg-yellow-400/10 font-num text-[9px] font-bold text-yellow-300">{player.yellows}</span>
                          )}
                          {player.reds > 0 && (
                            <span className="inline-flex h-4 min-w-6 items-center justify-center rounded-sm border border-red-500/35 bg-red-500/10 font-num text-[9px] font-bold text-red-400">{player.reds}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {player.suspendedNext && (
                      <span className="absolute -top-1.5 -left-1.5 rounded bg-red-500 px-1.5 py-0.5 font-utility text-[8px] font-bold tracking-wider text-bg">موقوف</span>
                    )}
                    {(isOwner || isAdmin) && (
                      <div className="flex-shrink-0">
                        <RemovePlayerButton teamId={team.id} playerId={player.id} />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
