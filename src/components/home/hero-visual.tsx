"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp, popIn } from "@/lib/motion-variants";
import type { HomeStatsVM } from "@/lib/types";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ar-EG").format(value);
}

function StatIcon({ type }: { type: "team" | "goal" | "tournament" | "player" }) {
  const common = {
    className: "h-4 w-4 sm:h-5 sm:w-5",
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "team":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M10 1.5 16.5 4v5c0 4.2-2.8 7.6-6.5 9.5C6.3 16.6 3.5 13.2 3.5 9V4L10 1.5Z" />
          <path d="M7 10.2 8.9 12 13 7.8" />
        </svg>
      );
    case "goal":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" />
          <path d="M10 2.5 12.6 5.4 11 9.5l-2.2.1-.8 3.9 2.7-3M7.2 5.6 5 4.3m5.6-1.3L9.6 1" />
        </svg>
      );
    case "tournament":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 15.5h8M7 4.5H5.5A2.5 2.5 0 0 0 3 7c0 1.6 1.2 2.9 2.8 3A5 5 0 0 0 10 12.5 5 5 0 0 0 14.2 10c1.6-.1 2.8-1.4 2.8-3a2.5 2.5 0 0 0-2.5-2.5H13M7 4.5v1.5M13 4.5v1.5" />
          <path d="M10 12.5V16m0 0c0 .8-.7 1.5-1.6 1.5M10 16c0 .8.7 1.5 1.6 1.5" />
        </svg>
      );
    case "player":
    default:
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="8" cy="5.5" r="3.5" />
          <path d="M4 17.5v-.3c0-2.2 1.8-4 4-4s4 1.8 4 4v.3H4Z" />
          <path d="M14.5 3.8a2.8 2.8 0 0 1 0 3.4m.6 3.6c1.7.5 2.9 2 2.9 3.8v.3" />
        </svg>
      );
  }
}

export function HeroVisual({ season, stats }: { season: string; stats: HomeStatsVM }) {
  const statItems: { id: string; label: string; value: number; icon: "team" | "goal" | "tournament" | "player" }[] = [
    { id: "teams", label: "فريق", value: stats.registeredTeams, icon: "team" },
    { id: "goals", label: "هدف", value: stats.goalsThisSeason, icon: "goal" },
    { id: "tournaments", label: "بطولة", value: stats.activeTournaments, icon: "tournament" },
    { id: "players", label: "لاعب", value: stats.registeredPlayers, icon: "player" },
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
            <stop offset="0" stopColor="rgba(255,212,0,0.14)" />
            <stop offset="1" stopColor="rgba(255,212,0,0)" />
          </linearGradient>
          <pattern id="crowd" width="12" height="9" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="12" height="9" fill="rgba(3,14,32,0.55)" />
            <circle cx="3" cy="4" r="1.7" fill="rgba(255,255,255,0.07)" />
            <circle cx="9" cy="4" r="1.7" fill="rgba(255,255,255,0.05)" />
          </pattern>
        </defs>

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

        <rect x="0" y="398" width="1440" height="22" fill="url(#crowd)" />
        <line x1="0" y1="398" x2="1440" y2="398" stroke="rgba(255,255,255,0.20)" strokeWidth="2" />
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg to-transparent" />

      {/* Content */}
      <div className="page-container relative z-10 pt-12 sm:pt-16 lg:pt-20 pb-14 sm:pb-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          viewport={{ once: true }}
        >
          {/* Season tag */}
          <motion.div variants={fadeUp()} className="mb-5 sm:mb-6 flex justify-center lg:justify-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <span className="font-utility text-[10px] tracking-[0.18em] text-accent-bright uppercase">الموسم {season}</span>
            </span>
          </motion.div>

          <div className="flex flex-col items-center text-center lg:flex-row lg:text-right lg:items-start gap-8 lg:gap-14">
            {/* Desktop Logo */}
            <motion.div variants={popIn()} className="flex-shrink-0 hidden lg:block">
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
            </motion.div>

            {/* Text */}
            <div className="flex-1 max-w-2xl">
              {/* Mobile logo */}
              <motion.div variants={popIn(0.1)} className="mb-5 flex justify-center lg:hidden">
                <Image
                  src="/images/league-logo.jpg"
                  alt="شعار دوري نجوم الإسكندرية"
                  width={1280}
                  height={698}
                  className="h-20 w-20 rounded-full object-cover border-2 border-white/20 shadow-deep"
                  priority
                />
              </motion.div>

              <motion.h1 variants={fadeUp(0.1)} className="mb-4 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-black leading-[1.1] text-text tracking-tight">
                دوري نجوم{" "}
                <span className="text-gradient-hero">
                  الإسكندرية
                </span>
              </motion.h1>

              <motion.p variants={fadeUp(0.18)} className="mb-7 max-w-lg font-body text-base sm:text-lg leading-relaxed text-text-dim mx-auto lg:mx-0">
                حيث يلتقي الشغف بالنجومية.. بطولات هاوية تُدار بحرفية المحترفين، سجّل فريقك وتابع الحماس لحظة بلحظة.
              </motion.p>

              <motion.div variants={fadeUp(0.26)} className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link href="/teams/new" className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-body text-sm font-black text-[#0b1220] transition-all hover:bg-accent-bright hover:shadow-glow active:scale-[0.98]">
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v12M2 8h12" />
                  </svg>
                  انضم إلى الدوري
                </Link>
                <Link href="/standings" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[0.04] px-6 py-3 font-body text-sm font-bold text-text transition-all hover:border-accent/60 hover:bg-white/[0.08]">
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="12" height="10" rx="1.5" />
                    <path d="M2 8h12M8 8v5M5 5.5h.01M11 5.5h.01" />
                  </svg>
                  عرض جدول الترتيب
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Stats */}
          <motion.div variants={staggerContainer} className="mt-12 sm:mt-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {statItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={popIn()}
                  whileHover={{ y: -3, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-4 sm:px-6 py-4 sm:py-5 text-center backdrop-blur-sm transition-colors hover:border-accent/50 hover:bg-white/[0.06] hover:shadow-glow">
                    <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent transition-transform group-hover:scale-110 sm:h-9 sm:w-9">
                      <StatIcon type={item.icon} />
                    </div>
                    <div className="font-num text-3xl sm:text-4xl lg:text-[44px] font-black text-accent leading-none mb-1.5 tabular-nums">
                      {formatNumber(item.value)}
                    </div>
                    <div className="font-utility text-[10px] tracking-[0.18em] text-text-dim uppercase">{item.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}