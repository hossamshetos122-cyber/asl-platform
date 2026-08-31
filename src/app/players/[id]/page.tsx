import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ImageDisplay } from "@/components/ui/image-display";
import { getPlayerById } from "@/lib/data/players";
import { formatLongDate, formatMatchDateTime } from "@/lib/dates";
import Link from "next/link";
import { notFound } from "next/navigation";

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: "حارس مرمى", DEFENDER: "مدافع", MIDFIELDER: "لاعب وسط", FORWARD: "مهاجم",
};

const POSITION_STYLES: Record<string, { hex: string; soft: string; dim: string }> = {
  GOALKEEPER: { hex: "#4AA8FF", soft: "rgba(74,168,255,0.12)", dim: "rgba(74,168,255,0.16)" },
  DEFENDER: { hex: "#00FF87", soft: "rgba(0,255,135,0.12)", dim: "rgba(0,255,135,0.16)" },
  MIDFIELDER: { hex: "#FFB23E", soft: "rgba(255,178,62,0.12)", dim: "rgba(255,178,62,0.18)" },
  FORWARD: { hex: "#FF5740", soft: "rgba(255,87,64,0.12)", dim: "rgba(255,87,64,0.16)" },
};

const POSITION_DEFAULT = { hex: "#2E7BFF", soft: "rgba(46,123,255,0.12)", dim: "rgba(46,123,255,0.18)" };

interface PlayerProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { id } = await params;
  const result = await getPlayerById(id);

  if (result.status === "error" || result.status === "empty") notFound();

  const player = result.data;
  const role = POSITION_STYLES[player.position] ?? POSITION_DEFAULT;

  return (
    <>
      <Navbar />

      {/* Hero — player card */}
      <section className="relative overflow-hidden bg-surface border-b border-line">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(120% 160% at 85% -10%, ${role.soft}, rgba(10,38,71,0) 60%), linear-gradient(180deg, ${role.dim}, #0A2647 80%)` }}
        />
        <div className="page-container relative pt-10 sm:pt-14 pb-6 sm:pb-10 animate-fade-up">
          <Link href="/teams" className="mb-5 inline-flex items-center gap-1.5 py-2 -my-2 font-body text-sm font-bold text-accent hover:text-accent-bright transition-colors">
            <svg className="h-3.5 w-3.5 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M7 3l3 3-3 3" /></svg>
            العودة للفرق
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7">
            <div className="relative flex-shrink-0">
              {player.jerseyNumber != null && (
                <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 select-none font-num text-6xl font-black leading-none text-white/5" dir="ltr">
                  {player.jerseyNumber}
                </span>
              )}
              <div
                className="rounded-full p-[4px]"
                style={{ background: `linear-gradient(135deg, ${role.hex}, ${role.hex}55)`, boxShadow: `0 10px 28px ${role.hex}33` }}
              >
                <ImageDisplay src={player.photoUrl} alt={player.name} type="avatar" size="xl" className="rounded-full bg-surface-elevated" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-2">
                {player.jerseyNumber != null && (
                  <span className="inline-flex h-7 items-center rounded bg-emerald-500 px-2 font-num text-sm font-black text-bg">{player.jerseyNumber}</span>
                )}
                <span
                  className="rounded border px-2 py-0.5 font-body text-[11px] font-bold"
                  style={{ borderColor: role.dim, color: role.hex, backgroundColor: role.soft }}
                >
                  {POSITION_LABELS[player.position] ?? player.position}
                </span>
                {player.suspendedNext ? (
                  <span className="rounded bg-red-500/15 border border-red-500/35 px-2 py-0.5 font-body text-[11px] font-bold text-red-400">
                    موقوف عن المباراة القادمة
                  </span>
                ) : (
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 font-body text-[11px] font-bold text-emerald-500">
                    متاح
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-text">{player.name}</h1>
              {player.suspendedNext && (
                <div className="mt-2.5 inline-flex flex-wrap items-center justify-center sm:justify-start gap-1.5 rounded-lg border border-red-500/25 bg-red-500/5 px-3 py-1.5">
                  <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="6" width="6" height="6" rx="1" /><path d="M6.5 6V4.5a1.5 1.5 0 0 1 3 0V6" />
                  </svg>
                  <span className="font-body text-[11px] font-bold text-red-300">
                    {player.suspendedReason === "RED" ? "بطاقة حمراء" : "الإنذار الثاني"} — يغيب عن مباراة
                    <Link href={player.nextFixture ? `/matches/${player.nextFixture.id}` : "#"} className="text-red-200 underline underline-offset-2 hover:text-red-100 transition-colors">
                      <span className="mx-1 font-num">{player.nextFixture ? formatMatchDateTime(player.nextFixture.kickoffAt) : "الفريق القادمة"}</span>
                    </Link>
                    {player.nextFixture?.venue && (
                      <span className="mx-1 font-num">— {player.nextFixture.venue}</span>
                    )}
                  </span>
                </div>
              )}
              {player.team && (
                <Link href={`/teams/${player.team.id}`} className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-line bg-surface-elevated px-3 py-1.5 font-body text-[12px] font-bold text-text-dim transition-colors hover:border-line-accent hover:text-accent">
                  <ImageDisplay src={player.team.crestUrl} alt={`شعار ${player.team.name}`} type="team-logo" size="xs" shortCode={player.team.name.substring(0, 2)} />
                  {player.team.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="page-container page-padding">
        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5 stagger-children">
          <div className="animate-fade-up rounded-xl border border-line bg-surface p-4 text-center">
            <div className="font-num text-2xl font-bold text-emerald-500">{player.goals}</div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">هدف</div>
          </div>
          <div className="animate-fade-up rounded-xl border border-line bg-surface p-4 text-center">
            <div className="font-num text-2xl font-bold text-amber-400">{player.assists}</div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">أسيست</div>
          </div>
          <div className="animate-fade-up rounded-xl border border-line bg-surface p-4 text-center">
            <div className="font-num text-2xl font-bold text-text">{player.matchesPlayed}</div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">مباراة</div>
          </div>
          <div className="animate-fade-up rounded-xl border border-line bg-surface p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex h-6 min-w-8 items-center justify-center gap-1 rounded-md border border-yellow-400/35 bg-yellow-400/10 px-1 font-num text-[13px] font-bold text-yellow-300">
                <span className="inline-block h-2 w-2 rounded-[2px] bg-yellow-400" />
                {player.yellows}
              </span>
              <span className="inline-flex h-6 min-w-8 items-center justify-center gap-1 rounded-md border border-red-500/35 bg-red-500/10 px-1 font-num text-[13px] font-bold text-red-400">
                <span className="inline-block h-2 w-2 rounded-[2px] bg-red-500" />
                {player.reds}
              </span>
            </div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">الكروت</div>
          </div>
          <div className="animate-fade-up rounded-xl border border-line bg-surface p-4 text-center">
            <div className="font-num text-sm font-bold leading-tight" style={{ color: role.hex }}>{POSITION_LABELS[player.position] ?? player.position}</div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">المركز</div>
          </div>
        </div>

        {/* Info */}
        <div className="animate-fade-in rounded-xl border border-line bg-surface p-4 sm:p-5">
          <h2 className="mb-3 font-display text-base font-black text-text">المعلومات</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {player.dateOfBirth && (
              <div>
                <dt className="font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">تاريخ الميلاد</dt>
                <dd className="mt-1 font-body text-[13px] text-text">{formatLongDate(player.dateOfBirth)}</dd>
              </div>
            )}
            {player.team && (
              <div>
                <dt className="font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">الفريق الحالي</dt>
                <dd className="mt-1 font-body text-[13px]"><Link href={`/teams/${player.team.id}`} className="text-accent hover:text-accent-bright transition-colors font-bold">{player.team.name}</Link></dd>
              </div>
            )}
          </dl>
        </div>
      </main>
      <Footer />
    </>
  );
}