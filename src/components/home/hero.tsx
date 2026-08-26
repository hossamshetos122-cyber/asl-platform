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
    { label: "فريق مسجّل", value: stats.registeredTeams },
    { label: "هدف هذا الموسم", value: stats.goalsThisSeason },
    { label: "بطولة نشطة", value: stats.activeTournaments },
    { label: "لاعب مسجّل", value: stats.registeredPlayers },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="hero-bg absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/85 to-bg" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/50 to-transparent" />

      <div className="page-container relative z-10 pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16 lg:pb-20">
        <div className="flex flex-col items-center text-center lg:flex-row lg:text-right lg:items-start gap-8 lg:gap-12">
          <div className="flex-shrink-0">
            <Image
              src="/images/league-logo.jpg"
              alt="شعار دوري نجوم الإسكندرية"
              width={1280}
              height={698}
              className="h-24 w-auto sm:h-32 lg:h-40 object-contain rounded-2xl border-2 border-gold/30 shadow-glow"
              priority
            />
          </div>

          <div className="flex-1 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              <span className="font-utility text-[10px] sm:text-[11px] tracking-[0.15em] text-gold uppercase">الموسم 2024 / 2025</span>
            </div>

            <h1 className="mb-4 font-display text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] font-black leading-[1.15] text-text">
              الملاعب اللي بتلعب فيها
              <br />
              <span className="text-gold">بقت دوري حقيقي.</span>
            </h1>

            <p className="mb-8 max-w-lg font-body text-base sm:text-lg leading-relaxed text-text-dim mx-auto lg:mx-0 lg:mr-0">
              منصة إدارة وتنظيم بطولات كرة القدم للهواة في الإسكندرية. سجّل فريقك،
              العب في دوري منظم، وتابع كل تفاصيل مبارياتك.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link href="/teams/new" className="btn-primary px-8 py-3.5 text-[15px]">
                سجّل فريقك الآن
              </Link>
              <Link href="/tournaments" className="btn-secondary px-8 py-3.5 text-[15px]">
                استكشف البطولات
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line rounded-xl overflow-hidden border border-line">
          {statItems.map((item) => (
            <div key={item.label} className="bg-bg-raised px-4 sm:px-6 py-5 sm:py-6 text-center">
              <div className="stat-number mb-1">{formatNumber(item.value)}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
