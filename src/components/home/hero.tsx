import Link from "next/link";
import Image from "next/image";
import { getHomeStats } from "@/lib/stats";
import { getDisplaySeasonLabel } from "@/lib/season";
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
  const [statsResult, seasonLabel] = await Promise.all([
    getHomeStats(),
    getDisplaySeasonLabel(),
  ]);
  const stats = statsResult.status === "success" ? statsResult.data : FALLBACK_STATS;

  const statItems: { label: string; value: number }[] = [
    { label: "فريق", value: stats.registeredTeams },
    { label: "هدف", value: stats.goalsThisSeason },
    { label: "بطولة", value: stats.activeTournaments },
    { label: "لاعب", value: stats.registeredPlayers },
  ];

  return (
    <section className="relative overflow-hidden hero-bg">
      {/* Decorative orbs */}
      <div className="hero-glow-orb bottom-[-140px] left-[-100px] h-96 w-96 bg-accent/15" />

      {/* Night floodlit stadium (vector, ultra-light) */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] w-full text-white"
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="beamA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="beamB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,138,92,0.12)" />
            <stop offset="1" stopColor="rgba(255,138,92,0)" />
          </linearGradient>
          <pattern id="crowd" width="12" height="9" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="12" height="9" fill="rgba(3,14,32,0.55)" />
            <circle cx="3" cy="4" r="1.7" fill="rgba(255,255,255,0.07)" />
            <circle cx="9" cy="4" r="1.7" fill="rgba(255,255,255,0.05)" />
          </pattern>
        </defs>

        {/* floodlight towers + beams */}
        <polygon points="118,52 620,420 392,420" fill="url(#beamA)" />
        <polygon points="1322,52 820,420 1048,420" fill="url(#beamA)" />
        <polygon points="322,150 180,420 380,420" fill="url(#beamB)" />
        <polygon points="1118,150 1060,420 1260,420" fill="url(#beamB)" />
        <g stroke="rgba(255,255,255,0.14)" strokeWidth="3">
          <line x1="118" y1="58" x2="118" y2="420" />
          <line x1="1322" y1="58" x2="1322" y2="420" />
          <line x1="322" y1="156" x2="322" y2="420" />
          <line x1="1118" y1="156" x2="1118" y2="420" />
        </g>
        <g fill="rgba(255,255,255,0.85)">
          <circle cx="112" cy="52" r="3" />
          <circle cx="118" cy="46" r="3" />
          <circle cx="124" cy="52" r="3" />
          <circle cx="1316" cy="52" r="3" />
          <circle cx="1322" cy="46" r="3" />
          <circle cx="1328" cy="52" r="3" />
          <circle cx="316" cy="150" r="3" />
          <circle cx="322" cy="144" r="3" />
          <circle cx="328" cy="150" r="3" />
          <circle cx="1112" cy="150" r="3" />
          <circle cx="1118" cy="144" r="3" />
          <circle cx="1124" cy="150" r="3" />
        </g>
        <g fill="rgba(255,255,255,0.18)">
          <circle cx="118" cy="50" r="14" />
          <circle cx="1322" cy="50" r="14" />
          <circle cx="322" cy="148" r="10" />
          <circle cx="1118" cy="148" r="10" />
        </g>

        {/* stands band + crowd */}
        <rect x="0" y="398" width="1440" height="22" fill="url(#crowd)" />
        <line x1="0" y1="398" x2="1440" y2="398" stroke="rgba(255,255,255,0.20)" strokeWidth="2" />
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg to-transparent" />

      {/* Content */}
      <div className="page-container relative z-10 pt-10 sm:pt-14 lg:pt-16 pb-12 sm:pb-16">
        {/* Season tag */}
        <div className="mb-5 sm:mb-6 flex justify-center lg:justify-start animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span className="font-utility text-[10px] tracking-[0.18em] text-accent-bright uppercase">الموسم {seasonLabel}</span>
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
              <span className="text-gradient-hero">
                الإسكندرية
              </span>
            </h1>

            <p className="mb-7 max-w-lg font-body text-base sm:text-lg leading-relaxed text-text-dim mx-auto lg:mx-0 animate-fade-up">
              حيث يلتقي الشغف بالنجومية.. بطولات هاوية تُدار بحرفية المحترفين، سجّل فريقك وتابع الحماس لحظة بلحظة.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start animate-fade-up">
              <Link href="/teams/new" className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-body text-sm font-black text-white transition-all hover:bg-accent-bright hover:shadow-glow active:scale-[0.98]">
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
                سجّل فريقك الآن
              </Link>
              <Link href="/tournaments" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[0.04] px-6 py-3 font-body text-sm font-bold text-text transition-all hover:border-accent/60 hover:bg-white/[0.08]">
                استكشف البطولات
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 sm:mt-16 animate-fade-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {statItems.map((item) => (
              <div key={item.label} className="group rounded-xl border border-white/10 bg-white/[0.04] px-4 sm:px-6 py-4 sm:py-5 text-center backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-white/[0.06]">
                <div className="font-num text-3xl sm:text-4xl lg:text-[44px] font-black text-accent leading-none mb-1.5 tabular-nums">
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