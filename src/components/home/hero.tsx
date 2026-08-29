import Link from "next/link";
import Image from "next/image";
import { getHomeStats } from "@/lib/data/home";
import { getCurrentSeasonLabel } from "@/lib/season";
import type { HomeStatsVM } from "@/lib/types";

const FALLBACK_STATS: HomeStatsVM = {
  registeredTeams: 0,
  goalsThisSeason: 0,
  activeTournaments: 0,
  registeredPlayers: 0,
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ar-EG").format(value);
}

export async function Hero() {
  const result = await getHomeStats();
  const stats = result.status === "success" ? result.data : FALLBACK_STATS;

  const statItems: { label: string; value: number }[] = [
    { label: "فريق", value: stats.registeredTeams },
    { label: "هدف", value: stats.goalsThisSeason },
    { label: "بطولة", value: stats.activeTournaments },
    { label: "لاعب", value: stats.registeredPlayers },
  ];

  return (
    <section className="relative overflow-hidden hero-bg">
      {/* Decorative orbs */}
      <div className="hero-glow-orb -top-24 right-[-120px] h-80 w-80 bg-accent/25" />
      <div className="hero-glow-orb bottom-[-140px] left-[-100px] h-96 w-96 bg-purple-bright/30" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />

      {/* Content */}
      <div className="page-container relative z-10 pt-10 sm:pt-14 lg:pt-16 pb-12 sm:pb-16">
        {/* Season tag */}
        <div className="mb-5 sm:mb-6 flex justify-center lg:justify-start animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span className="font-utility text-[10px] tracking-[0.18em] text-accent-bright uppercase">الموسم {getCurrentSeasonLabel()}</span>
          </span>
        </div>

        <div className="flex flex-col items-center text-center lg:flex-row lg:text-right lg:items-start gap-8 lg:gap-14">
          {/* Desktop Logo */}
          <div className="flex-shrink-0 hidden lg:block animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-accent/25 blur-2xl" />
              <Image
                src="/images/league-logo.jpg"
                alt="شعار دوري نجوم الإسكندرية"
                width={1280}
                height={698}
                className="relative h-32 w-32 xl:h-40 xl:w-40 rounded-full object-cover border-2 border-white/20 shadow-deep"
                priority
              />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 max-w-2xl">
            {/* Mobile logo */}
            <div className="mb-5 flex justify-center lg:hidden animate-fade-in">
              <Image
                src="/images/league-logo.jpg"
                alt="شعار دوري نجوم الإسكندرية"
                width={1280}
                height={698}
                className="h-20 w-20 rounded-full object-cover border-2 border-white/20 shadow-deep"
                priority
              />
            </div>

            <h1 className="mb-4 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-black leading-[1.1] text-text tracking-tight animate-fade-up">
              دوري نجوم{" "}
              <span className="bg-gradient-to-l from-accent-bright via-accent to-purple-bright bg-clip-text text-transparent">
                الإسكندرية
              </span>
            </h1>

            <p className="mb-7 max-w-lg font-body text-base sm:text-lg leading-relaxed text-text-dim mx-auto lg:mx-0 animate-fade-up">
              حيث يلتقي الشغف بالنجومية.. بطولات هاوية تُدار بحرفية المحترفين، سجّل فريقك وتابع الحماس لحظة بلحظة.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start animate-fade-up">
              <Link href="/teams/new" className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-body text-sm font-extrabold text-white transition-all hover:bg-accent-bright hover:shadow-glow active:scale-[0.98]">
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
                سجّل فريقك الآن
              </Link>
              <Link href="/tournaments" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-6 py-3 font-body text-sm font-bold text-text transition-all hover:border-accent/50 hover:bg-white/[0.08]">
                استكشف البطولات
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 sm:mt-16 animate-fade-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {statItems.map((item) => (
              <div key={item.label} className="group rounded-xl border border-white/10 bg-white/[0.04] px-4 sm:px-6 py-4 sm:py-5 text-center backdrop-blur-sm transition-colors hover:border-emerald-500/40 hover:bg-white/[0.06]">
                <div className="font-num text-3xl sm:text-4xl lg:text-[44px] font-black text-emerald-500 leading-none mb-1.5 tabular-nums">
                  {formatNumber(item.value)}
                </div>
                <div className="font-utility text-[10px] tracking-[0.18em] text-text-dim uppercase">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}