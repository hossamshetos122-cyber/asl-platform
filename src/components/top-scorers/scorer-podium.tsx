"use client";

import Link from "next/link";
import type { TopScorerVM } from "@/lib/types";
import { ImageDisplay } from "@/components/ui/image-display";
import { motion, staggerContainer, popIn } from "@/components/ui/motion";

type Metric = "goals" | "assists";

const PEDESTAL_STYLES: Record<number, { bar: string; ring: string; avatar: string; name: string; value: string; chip: string; label: string }> = {
  1: {
    bar: "h-36 bg-gradient-to-t from-amber-500/25 to-amber-400/10 border-amber-400/50",
    ring: "border-amber-400/70 shadow-glow",
    avatar: "h-24 w-24 sm:h-28 sm:w-28",
    name: "text-text text-[15px] sm:text-lg",
    value: "text-amber-400",
    chip: "bg-amber-400/15 text-amber-400",
    label: "الوصيف الأول",
  },
  2: {
    bar: "h-28 bg-gradient-to-t from-slate-300/20 to-slate-300/5 border-slate-300/40",
    ring: "border-slate-300/50",
    avatar: "h-20 w-20 sm:h-24 sm:w-24",
    name: "text-text text-[13px] sm:text-base",
    value: "text-slate-300",
    chip: "bg-slate-300/15 text-slate-300",
    label: "الوصيف الثاني",
  },
  3: {
    bar: "h-24 bg-gradient-to-t from-orange-500/20 to-orange-500/5 border-orange-500/40",
    ring: "border-orange-400/50",
    avatar: "h-16 w-16 sm:h-20 sm:w-20",
    name: "text-text text-[12px] sm:text-sm",
    value: "text-orange-300",
    chip: "bg-orange-400/15 text-orange-400",
    label: "المركز الثالث",
  },
};

function PodiumCard({ item, metric, resource }: { item: TopScorerVM; metric: Metric; resource: string }) {
  const s: NonNullable<(typeof PEDESTAL_STYLES)[number]> = PEDESTAL_STYLES[item.rank]!;
  const value = metric === "goals" ? item.goals : item.assists;
  const isChamp = item.rank === 1;

  return (
    <motion.div variants={popIn()} className="flex flex-col items-center" style={{ order: item.rank === 1 ? 2 : item.rank === 2 ? 3 : 1 }}>
      {isChamp && (
        <div className="mb-1 font-utility text-[9px] tracking-[0.2em] text-amber-400 uppercase">
          <svg className="mx-auto mb-0.5 h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 1.6 12 6l4.7.4-3.6 3.1 1.1 4.6L10 11.7l-4.2 2.4 1.1-4.6L3.3 6.4 8 6l2-4.4Z" />
          </svg>
          الملك
        </div>
      )}
      <div className={`relative ${s.avatar}`}>
        <div className={`absolute inset-0 rounded-full blur-lg ${isChamp ? "bg-amber-400/25" : "bg-white/5"}`} />
        <Link href={`/players/${item.playerId}`} className="relative block h-full w-full">
          <ImageDisplay
            src={item.photoUrl}
            alt={item.playerName}
            type="player"
            className={`h-full w-full rounded-full object-cover ${s.ring} ${isChamp ? "border-2 shadow-glow" : "border border-white/20"}`}
          />
        </Link>
      </div>
      <div className={`mt-3 font-body font-black ${s.name} text-center leading-tight`}>{item.playerName}</div>
      <div className="mt-0.5 text-center font-utility text-[9px] tracking-wider text-text-dimmer uppercase">{item.teamName}</div>
      <div className={`mt-2 inline-flex min-w-[44px] items-center justify-center rounded-lg px-2.5 py-1 font-num text-2xl font-black ${s.chip}`}>{value}</div>
      <div className={`mt-1.5 w-full rounded-t-lg border-x ${s.bar}`}>
        <div className="flex items-center justify-center gap-2 px-2 pt-1.5 pb-1">
          <span className="font-utility text-[8px] tracking-[0.18em] text-text-dimmer uppercase">{resource}</span>
          <span className="font-num text-[10px] font-bold text-text-dimmer">+{metric === "goals" ? item.assists : item.goals} أسيست</span>
        </div>
      </div>
    </motion.div>
  );
}

export function ScorerPodium({ list, metric, resource, empty }: { list: TopScorerVM[]; metric: Metric; resource: string; empty: string }) {
  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface px-6 py-14 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface-elevated/40 text-text-dimmer">
          <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 15.5h8M7 4.5H5.5A2.5 2.5 0 0 0 3 7c0 1.6 1.2 2.9 2.8 3A5 5 0 0 0 10 12.5 5 5 0 0 0 14.2 10c1.6-.1 2.8-1.4 2.8-3a2.5 2.5 0 0 0-2.5-2.5H13M7 4.5v1.5M13 4.5v1.5" />
          </svg>
        </div>
        <p className="font-body text-sm text-text-dimmer">{empty}</p>
      </div>
    );
  }

  const podium = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div>
      {/* Podium */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        viewport={{ once: true }}
        className="flex items-end justify-center gap-3 sm:gap-6 rounded-xl border border-line bg-surface px-3 py-8 sm:px-8"
      >
        {podium.map((item) => <PodiumCard key={item.playerId} item={item} metric={metric} resource={resource} />)}
      </motion.div>

      {/* Rest */}
      {rest.length > 0 && (
        <div className="mt-4 rounded-xl border border-line bg-surface overflow-hidden">
          <div className="divide-y divide-line/40">
            {rest.map((scorer, i) => (
              <div key={scorer.playerId} className={`flex items-center gap-3 px-4 py-3 ${i % 2 === 1 ? "bg-white/[0.02]" : ""}`}>
                <span className="w-6 flex-shrink-0 text-center font-num text-[11px] font-bold text-text-dimmer">{String(scorer.rank).padStart(2, "0")}</span>
                <Link href={`/players/${scorer.playerId}`} className="flex min-w-0 flex-1 items-center gap-3 group">
                  <div className="h-9 w-9 flex-shrink-0">
                    <ImageDisplay src={scorer.photoUrl} alt={scorer.playerName} type="player" className="h-9 w-9 rounded-full object-cover border border-white/15" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-body text-[13px] font-bold text-text group-hover:text-accent transition-colors truncate">{scorer.playerName}</div>
                    <div className="font-utility text-[8px] tracking-wider text-text-dimmer uppercase truncate">{scorer.teamName}</div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline font-num text-[10px] text-text-dimmer">{metric === "goals" ? scorer.assists : scorer.goals}+{metric === "goals" ? scorer.goals : scorer.assists}</span>
                  <span className={`inline-flex h-6 min-w-[28px] items-center justify-center rounded px-1.5 font-num text-[12px] font-bold ${metric === "goals" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-400/10 text-amber-400"}`}>
                    {metric === "goals" ? scorer.goals : scorer.assists}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}