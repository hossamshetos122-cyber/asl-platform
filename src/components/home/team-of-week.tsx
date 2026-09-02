import { getTeamOfTheWeek } from "@/lib/data/team-of-week";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImageDisplay } from "@/components/ui/image-display";
import { getRatingTier, type RatingTierKey } from "@/lib/ratings";
import type { TeamOfTheWeekSlotVM } from "@/lib/types";
import { motion, staggerContainer, popIn } from "@/components/ui/motion";

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
    strip: "from-success to-emerald-400",
    badge: "bg-success text-[#04241a]",
    ring: "ring-success/60",
    glow: "shadow-[0_0_18px_rgba(0,214,143,0.35)]",
  },
  diamond: {
    border: "border-cyan/70",
    strip: "from-cyan to-[#7EE7FF]",
    badge: "bg-cyan text-[#062a38]",
    ring: "ring-cyan/60",
    glow: "shadow-[0_0_18px_rgba(46,214,245,0.35)]",
  },
  gold: {
    border: "border-[#F5C518]/70",
    strip: "from-[#FFD166] to-[#F5C518]",
    badge: "bg-[#F5C518] text-[#1d1400]",
    ring: "ring-[#F5C518]/60",
    glow: "shadow-[0_0_18px_rgba(245,197,24,0.30)]",
  },
  silver: {
    border: "border-[#c7d0e0]/60",
    strip: "from-[#8b97ad] to-[#c7d0e0]",
    badge: "bg-[#c7d0e0] text-[#1a2233]",
    ring: "ring-[#c7d0e0]/50",
    glow: "",
  },
  base: {
    border: "border-line-strong",
    strip: "from-[#3a4a6b] to-[#5b6883]",
    badge: "bg-line-strong text-text",
    ring: "ring-line-strong",
    glow: "",
  },
};

/** Shield silhouette: cut top corners that taper into a pointed tail on the bottom. */
const SHIELD_CLIP = "polygon(0 12%, 10% 0, 90% 0, 100% 12%, 100% 88%, 50% 100%, 0 88%)";

function ShieldCard({ slot }: { slot: TeamOfTheWeekSlotVM }) {
  const player = slot.player;
  const tier = TIER_STYLES[getRatingTier(player.rating)];

  return (
    <motion.div variants={popIn()} className="flex w-[clamp(46px,13.2vw,92px)] flex-col items-center">
      <div
        style={{ clipPath: SHIELD_CLIP }}
        className={`relative flex h-[78px] w-full flex-col items-center overflow-hidden border bg-gradient-to-b from-white/[0.10] via-white/[0.03] to-black/25 ${tier.border} ${tier.glow} sm:h-[132px]`}
      >
        <div className={`h-1.5 w-full bg-gradient-to-r ${tier.strip} sm:h-2`} />

        <div className="absolute top-1 left-1 flex flex-col items-start gap-0.5 sm:top-2 sm:left-1.5">
          {slot.captain && (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent font-display text-[8px] font-black text-[#0b1220] sm:h-4 sm:w-4 sm:text-[9px]">
              C
            </span>
          )}
          {player.jerseyNumber !== null && (
            <span className="font-num leading-none text-[8px] font-black text-white/55 sm:text-[9px]" dir="ltr">
              {player.jerseyNumber}
            </span>
          )}
        </div>

        <div className="absolute top-1 right-0.5 sm:top-2 sm:right-1.5">
          <ImageDisplay
            src={player.team.crestUrl}
            alt={player.team.name}
            type="avatar"
            size="xs"
            shortCode={player.team.shortName}
            className="!h-3 !w-3 sm:!h-5 sm:!w-5"
          />
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden pt-1">
          <div
            className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border bg-bg/80 sm:h-14 sm:w-14 sm:p-0.5 ${tier.border}`}
          >
            <ImageDisplay
              src={player.photoUrl}
              alt={player.name}
              type="avatar"
              size="md"
              shortCode={player.name}
              className="!h-6 !w-6 sm:!h-12 sm:!w-12"
            />
          </div>
        </div>

        <div
          className={`-mt-0.5 mb-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-black/25 font-num text-[10px] leading-none font-black shadow-lg sm:mb-1.5 sm:h-8 sm:w-8 sm:text-[13px] ${tier.badge}`}
        >
          {player.rating}
        </div>
      </div>

      <p className="mt-1 w-full break-words text-center font-body leading-snug text-[8px] font-bold text-[#f2f6ff] sm:text-[11px]">{player.name}</p>
      <p className="mt-0.5 w-full text-center font-utility text-[6.5px] tracking-[0.08em] text-white/45 uppercase sm:text-[8px] sm:tracking-[0.12em]">{slot.label}</p>
    </motion.div>
  );
}

export async function TeamOfWeek() {
  const result = await getTeamOfTheWeek();

  return (
    <section className="page-container editorial-section">
      <SectionHeader title="فريق الأسبوع" tag="TEAM OF THE WEEK" />

      {result.status === "error" && <ErrorState message={result.message} />}
      {result.status === "empty" && <EmptyState message="لم يتم اختيار فريق الأسبوع بعد." />}

      {result.status === "success" && (
        <motion.div
          data-team-of-week
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="overflow-hidden rounded-3xl border border-line bg-surface"
        >
          <div className="border-b border-line bg-gradient-to-l from-[#0d1830] via-[#123B6B] to-[#0d1830] px-4 py-3 sm:px-7 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-black text-text sm:text-xl">{result.data.weekLabel}</h3>
                <p className="mt-0.5 font-body text-[11px] font-medium text-text-dimmer">
                  {result.data.tournamentName}
                  {datesLabel(result.data.weekStart, result.data.weekEnd)
                    ? ` — ${datesLabel(result.data.weekStart, result.data.weekEnd)}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-utility text-[11px] font-black tracking-wider text-accent-bright uppercase">
                {result.data.formation}
              </div>
            </div>
          </div>

          <div className="px-2 py-3 sm:p-7">
            {(() => {
              const bands = [...result.data.slots]
                .reduce<{ band: number; slots: TeamOfTheWeekSlotVM[] }[]>((acc, slot) => {
                  const existing = acc.find((b) => b.band === slot.band);
                  if (existing) existing.slots.push(slot);
                  else acc.push({ band: slot.band, slots: [slot] });
                  return acc;
                }, [])
                .sort((a, b) => a.band - b.band)
                .reverse();

              return (
                <div className="relative mx-auto w-full max-w-[460px]">
                  <div className="relative w-full" style={{ aspectRatio: "3 / 4" }}>
                    {/* grass */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-[14px]"
                      style={{
                        background:
                          "repeating-linear-gradient(90deg,#2E6E35 0,#2E6E35 46px,#2A6530 46px,#2A6530 92px),linear-gradient(180deg,#34793C,#25602C)",
                      }}
                    />
                    {/* floodlight glow */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[14px]"
                      style={{
                        background:
                          "radial-gradient(120% 90% at 50% -5%, rgba(255,255,255,0.14), transparent 55%), radial-gradient(60% 55% at 50% 50%, rgba(255,190,80,0.06), transparent 70%)",
                      }}
                    />
                    {/* field lines */}
                    <div className="pointer-events-none absolute inset-0 z-[1]">
                      <div className="absolute inset-0 rounded-[14px] border-2 border-white/70" style={{ boxShadow: "inset 0 0 46px rgba(0,0,0,0.4)" }} />
                      <div className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-white/70" />
                      <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-white/70" />
                      <div className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70 sm:h-24 sm:w-24" />
                      <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
                      <div className="absolute top-2 left-1/2 h-[18%] w-[44%] -translate-x-1/2 rounded-[5px] border-2 border-white/70 bg-white/[0.04]" />
                      <div className="absolute bottom-2 left-1/2 h-[18%] w-[44%] -translate-x-1/2 rounded-[5px] border-2 border-white/70 bg-white/[0.04]" />
                    </div>

                    {/* positional rows: GK at bottom, attackers at top */}
                    {bands.map((band, i, arr) => (
                      <div
                        key={band.band}
                        className="absolute inset-x-[6px] z-[2] flex -translate-y-1/2 items-center justify-center gap-x-1 sm:gap-x-2.5"
                        style={{ top: `${arr.length === 1 ? 50 : 12 + (i * 76) / (arr.length - 1)}%` }}
                      >
                        {band.slots.map((slot) => (
                          <ShieldCard key={slot.positionSlot} slot={slot} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}
    </section>
  );
}