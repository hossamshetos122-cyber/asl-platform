import Link from "next/link";
import Image from "next/image";
import { getHomeStats } from "@/lib/data/home";
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
    <section className="relative overflow-hidden bg-bg-deep">
      {/* Background */}
      <div className="hero-bg absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/60 via-bg-deep/80 to-bg-deep" />

      {/* Content */}
      <div className="page-container relative z-10 pt-10 sm:pt-14 lg:pt-18 pb-10 sm:pb-14">
        {/* Season tag */}
        <div className="mb-5 sm:mb-6 flex justify-center lg:justify-start animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3.5 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
            <span className="font-utility text-[10px] tracking-[0.18em] text-gold uppercase">الموسم 2024 / 2025</span>
          </span>
        </div>

        <div className="flex flex-col items-center text-center lg:flex-row lg:text-right lg:items-start gap-8 lg:gap-14">
          {/* Desktop Logo */}
          <div className="flex-shrink-0 hidden lg:block animate-fade-in">
            <Image
              src="/images/league-logo.jpg"
              alt="شعار دوري نجوم الإسكندرية"
              width={1280}
              height={698}
              className="h-32 w-32 xl:h-40 xl:w-40 rounded-full object-cover border-2 border-gold/20 shadow-glow-lg"
              priority
            />
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
                className="h-18 w-18 rounded-full object-cover border-2 border-gold/20 shadow-glow"
                priority
              />
            </div>

            <h1 className="mb-4 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-black leading-[1.1] text-text tracking-tight animate-fade-up">
              <span className="block">دوري نجوم</span>
              <span className="block text-gold">الإسكندرية</span>
            </h1>

            <p className="mb-7 max-w-lg font-body text-base sm:text-lg leading-relaxed text-text-dim mx-auto lg:mx-0 animate-fade-up">
              المنصة الرسمية لإدارة وتنظيم بطولات كرة القدم للهواة في الإسكندرية. سجّل فريقك وتابع كل تفاصيل مبارياتك.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start animate-fade-up">
              <Link href="/teams/new" className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-body text-sm font-extrabold text-bg transition-all hover:bg-gold-bright hover:shadow-glow active:scale-[0.98]">
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
                سجّل فريقك الآن
              </Link>
              <Link href="/tournaments" className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-6 py-3 font-body text-sm font-bold text-text transition-all hover:border-line-gold hover:bg-surface-elevated">
                استكشف البطولات
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 sm:mt-14 animate-fade-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line-strong rounded-xl overflow-hidden">
            {statItems.map((item) => (
              <div key={item.label} className="bg-surface/80 px-4 sm:px-6 py-4 sm:py-6 text-center">
                <div className="font-num text-2xl sm:text-3xl lg:text-4xl font-bold text-gold mb-0.5">
                  {formatNumber(item.value)}
                </div>
                <div className="font-utility text-[9px] sm:text-[10px] tracking-[0.15em] text-text-dimmer uppercase">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
