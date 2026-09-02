"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, popIn } from "@/lib/motion-variants";
import { ImageDisplay } from "@/components/ui/image-display";
import { getRatingTier, type RatingTierKey } from "@/lib/ratings";
import type { TeamOfTheWeekSlotVM, TeamOfTheWeekVM } from "@/lib/types";

function datesLabel(weekStart: Date | null, weekEnd: Date | null): string | null {
  if (!weekStart || !weekEnd) return null;
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  return `من ${fmt(weekStart)} إلى ${fmt(weekEnd)}`;
}

interface TierStyle {
  border: string;
  strip: string;
  badge: string;
  ring: string;
  glow: string;
}

const TIER_STYLES: Record<RatingTierKey, TierStyle> = {
  green: {
    border: "border-success/70",
    strip: "from-success via-emerald-400 to-success",
    badge: "bg-success text-[#04241a]",
    ring: "ring-success/60",
    glow: "shadow-[0_0_16px_rgba(0,214,143,0.28)]",
  },
  diamond: {
    border: "border-cyan/70",
    strip: "from-cyan via-[#7EE7FF] to-cyan",
    badge: "bg-cyan text-[#062a38]",
    ring: "ring-cyan/60",
    glow: "shadow-[0_0_16px_rgba(46,214,245,0.28)]",
  },
  gold: {
    border: "border-[#F5C518]/70",
    strip: "from-[#FFD166] via-[#F5C518] to-[#FFD166]",
    badge: "bg-[#F5C518] text-[#1d1400]",
    ring: "ring-[#F5C518]/60",
    glow: "shadow-[0_0_16px_rgba(245,197,24,0.25)]",
  },
  silver: {
    border: "border-[#c7d0e0]/60",
    strip: "from-[#8b97ad] via-[#c7d0e0] to-[#8b97ad]",
    badge: "bg-[#c7d0e0] text-[#1a2233]",
    ring: "ring-[#c7d0e0]/50",
    glow: "",
  },
  base: {
    border: "border-line-strong",
    strip: "from-[#3a4a6b] via-[#5b6883] to-[#3a4a6b]",
    badge: "bg-line-strong text-text",
    ring: "ring-line-strong",
    glow: "",
  },
};

/** True from the `sm` breakpoint up (SSR-safe: starts as mobile sizing). */
function useDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return desktop;
}

/**
 * Broadcast-style player card: real headshot above a semi-transparent name
 * plate, with a small club crest near the head, jersey number, captain badge
 * and a rating chip. `depth` (0 = close to viewer, 1 = far) drives the size.
 */
function PlayerCard({ slot, cardWidth }: { slot: TeamOfTheWeekSlotVM; cardWidth: number }) {
  const player = slot.player;
  const tier = TIER_STYLES[getRatingTier(player.rating)];

  return (
    <motion.div
      variants={popIn()}
      className="relative flex flex-col items-center"
      style={{ width: `${cardWidth}px`, flexShrink: 0 }}
    >
      <div
        className={`relative w-full overflow-hidden rounded-lg border bg-[#0b0b0b] ${tier.border} ${tier.glow}`}
        style={{ boxShadow: "0 10px 24px -12px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)" }}
      >
        {/* tier strip */}
        <div className={`h-[3px] w-full bg-gradient-to-r ${tier.strip}`} />

        {/* headshot */}
        <div className="relative w-full" style={{ aspectRatio: "3 / 4" }}>
          <ImageDisplay fill type="player" src={player.photoUrl} alt={player.name} shortCode={player.name} />

          {/* bottom fade into name plate */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-[#0b0b0b] to-transparent" />

          {/* club crest near the player's head */}
          <div className="absolute top-1 left-1 flex aspect-square h-[24%] min-h-[14px] max-h-6 items-center justify-center overflow-hidden rounded-md border border-white/25 bg-black/40 p-[2px] shadow-md">
            <ImageDisplay
              type="avatar"
              size="xs"
              src={player.team.crestUrl}
              alt={player.team.name}
              shortCode={player.team.shortName}
              className="!h-full !w-full"
            />
          </div>

          {/* jersey number */}
          {player.jerseyNumber !== null && (
            <span
              className="absolute top-1 right-1 font-num text-[9px] leading-none font-black text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-[11px]"
              dir="ltr"
            >
              {player.jerseyNumber}
            </span>
          )}

          {/* captain badge */}
          {slot.captain && (
            <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent font-display text-[8px] font-black text-[#0b1220] ring-2 ring-black/30 sm:h-[18px] sm:w-[18px] sm:text-[9px]">
              C
            </span>
          )}
        </div>

        {/* semi-transparent name plate */}
        <div className="relative bg-black/55 px-1 pt-[3px] pb-[4px] backdrop-blur-[2px]">
          <div className="absolute inset-x-0 top-[3px] h-px bg-white/10" />
          <p className="truncate text-center font-body text-[8px] leading-tight font-bold text-[#f4f8ff] sm:text-[9.5px]">
            {player.name}
          </p>
          <div className="mt-[3px] flex items-center justify-center gap-[4px]">
            <span
              className={`flex h-[15px] min-w-[24px] items-center justify-center rounded-[4px] px-[3px] font-num text-[9px] leading-none font-black ${tier.badge}`}
            >
              {player.rating}
            </span>
            <span className="truncate font-utility text-[6.5px] tracking-[0.08em] text-white/50 uppercase sm:text-[7.5px]">
              {slot.label}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** A pitched football pitch drawn on a plane tilted with CSS 3D. */
function PitchScene({ bands }: { bands: { band: number; slots: TeamOfTheWeekSlotVM[] }[] }) {
  const desktop = useDesktop();
  const ordered = [...bands].sort((a, b) => a.band - b.band); // GK (near) → attackers (far)
  const rowCount = ordered.length;

  return (
    <div
      className="relative h-[500px] w-full overflow-hidden rounded-[22px] border border-white/10 bg-bg sm:h-[620px]"
      style={{ perspective: "1200px", perspectiveOrigin: "50% -20%" }}
    >
      {/* tilted grass surface (far edge recedes = depth) */}
      <div
        className="absolute -inset-x-[5%] -top-[4%] -bottom-[10%]"
        style={{ transform: "rotateX(27deg)", transformOrigin: "50% 50%" }}
      >
        {/* base turf gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg,#1a5630 0%,#2c7a3c 40%,#3b9145 72%,#2e7a3a 100%)",
          }}
        />
        {/* mow stripes (compress toward the far end thanks to the tilt) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(to bottom,rgba(255,255,255,0.07) 0 14px,rgba(0,0,0,0.05) 14px 28px)",
          }}
        />
        {/* floodlight glow far end */}
        <div
          className="absolute inset-x-0 top-0 h-1/2"
          style={{
            background:
              "radial-gradient(80% 70% at 50% 0%, rgba(255,244,214,0.35), rgba(255,216,120,0.08) 55%, transparent 75%)",
          }}
        />
        {/* touchline + center line + boxes drawn on the plane */}
        <div className="absolute inset-[3.5%] rounded-[10px] border-2 border-white/70 bg-transparent" style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.45)" }} />
        <div className="absolute inset-y-[4.5%] left-1/2 w-px -translate-x-1/2 bg-white/70" />
        <div className="absolute top-1/2 left-1/2 aspect-square w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
        <div className="absolute top-1/2 left-1/2 h-[1.5%] w-[1.5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        {/* far penalty box (smaller) */}
        <div className="absolute -top-[1%] left-1/2 h-[16%] w-[30%] -translate-x-1/2 rounded-[6px] border-2 border-white/70 bg-white/[0.04]" />
        {/* near penalty box (larger) */}
        <div className="absolute -bottom-[1%] left-1/2 h-[18%] w-[44%] -translate-x-1/2 rounded-[8px] border-2 border-white/70 bg-white/[0.04]" />
        {/* far goal frame */}
        <div
          className="absolute top-[0.5%] left-1/2 h-[4.5%] w-[14%] -translate-x-1/2 border-2 border-white/70 border-t-0"
          style={{ boxShadow: "inset 0 2px 3px rgba(0,0,0,0.35)" }}
        />
      </div>

      {/* vignette: focuses the eye on the middle */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 105% at 50% 45%, transparent 45%, rgba(0,6,16,0.12) 62%, rgba(0,4,12,0.62) 100%)",
        }}
      />

      {/* positional rows — GK near (large), attackers far (small) */}
      <div className="absolute inset-0 flex flex-col justify-between px-2 py-[6.5%] sm:px-3 sm:py-[7%]">
        {ordered.map((band, i) => {
          const depth = rowCount <= 1 ? 0 : i / (rowCount - 1);
          // Cards scale down on phones so their stacked height always fits the
          // pitch: 78px base on desktop, 56px on mobile, shrinking with depth.
          const base = desktop ? 78 : 56;
          const cardWidth = Math.max(30, Math.round(base - depth * (desktop ? 28 : 18)));
          return (
            <div key={band.band} className="flex flex-1 items-center justify-center gap-1 sm:gap-2">
              {band.slots.map((slot) => (
                <PlayerCard key={slot.positionSlot} slot={slot} cardWidth={cardWidth} />
              ))}
            </div>
          );
        })}
      </div>

      {/* very subtle global edge darkening on top of the cards */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(130% 130% at 50% 50%, transparent 72%, rgba(0,2,8,0.3) 100%)",
        }}
      />
    </div>
  );
}

export function TeamOfWeekPitch({ data }: { data: TeamOfTheWeekVM }) {
  const bands = data.slots.reduce<{ band: number; slots: TeamOfTheWeekSlotVM[] }[]>((acc, slot) => {
    const existing = acc.find((b) => b.band === slot.band);
    if (existing) existing.slots.push(slot);
    else acc.push({ band: slot.band, slots: [slot] });
    return acc;
  }, []);

  return (
    <div data-team-of-week className="overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="relative border-b border-line bg-gradient-to-l from-surface via-surface-elevated to-surface px-4 py-3 sm:px-7 sm:py-4">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-black text-text sm:text-xl">{data.weekLabel}</h3>
            <p className="mt-0.5 font-body text-[11px] font-medium text-text-dimmer">
              {data.tournamentName}
              {datesLabel(data.weekStart, data.weekEnd)
                ? ` — ${datesLabel(data.weekStart, data.weekEnd)}`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-utility text-[11px] font-black tracking-wider text-accent-bright uppercase">
              {data.formation}
            </span>
            <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-utility text-[9px] tracking-[0.2em] text-white/40 uppercase sm:block">
              TOTW
            </span>
          </div>
        </div>
      </div>

      <div className="px-2 py-4 sm:px-7 sm:py-7">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="relative mx-auto w-full max-w-[620px]"
        >
          <PitchScene bands={bands} />

          {/* manager / head coach */}
          {data.managerName && (
            <motion.div variants={popIn()} className="mt-5 flex justify-center">
              <div className="flex w-fit items-center gap-3 rounded-2xl border border-line bg-gradient-to-b from-surface-elevated to-surface px-4 py-3 shadow-deep">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-accent/25 blur-md" />
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-accent/70 ring-2 ring-black/20 sm:h-16 sm:w-16">
                    <ImageDisplay
                      src={data.managerPhotoUrl}
                      alt={data.managerName}
                      type="avatar"
                      size="lg"
                      shortCode={data.managerName}
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-utility text-[9px] tracking-[0.22em] text-accent-bright uppercase">
                    Manager · المدرب
                  </p>
                  <p className="truncate font-display text-sm font-black text-text sm:text-base">
                    {data.managerName}
                  </p>
                  <p className="font-body text-[10px] text-text-dimmer">{data.tournamentName}</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}