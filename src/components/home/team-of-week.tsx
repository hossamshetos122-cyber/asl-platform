import { getTeamOfTheWeek } from "@/lib/data/team-of-week";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImageDisplay } from "@/components/ui/image-display";
import { getRatingTier, type RatingTierKey } from "@/lib/ratings";
import type { TeamOfTheWeekSlotVM } from "@/lib/types";

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
    border: "border-accent/70",
    strip: "from-accent to-accent-bright",
    badge: "bg-accent text-[#1d1400]",
    ring: "ring-accent/60",
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
    <div className="flex w-[72px] flex-col items-center sm:w-[106px]">
      <div
        style={{ clipPath: SHIELD_CLIP }}
        className={`relative flex h-[100px] w-full flex-col items-center overflow-hidden border bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-black/25 ${tier.border} ${tier.glow} sm:h-[150px]`}
      >
        <div className={`h-1.5 w-full bg-gradient-to-r ${tier.strip}`} />

        <div className="absolute top-1.5 left-1 flex flex-col items-start gap-0.5 sm:top-2 sm:left-1.5">
          {slot.captain && (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent font-display text-[8px] font-black text-[#1d1400] sm:h-4 sm:w-4 sm:text-[9px]">
              C
            </span>
          )}
          {player.jerseyNumber !== null && (
            <span className="font-num leading-none text-[8px] font-black text-white/55 sm:text-[9px]" dir="ltr">
              {player.jerseyNumber}
            </span>
          )}
        </div>

        <div className="absolute top-1.5 right-1 sm:top-2 sm:right-1.5">
          <ImageDisplay
            src={player.team.crestUrl}
            alt={player.team.name}
            type="avatar"
            size="xs"
            shortCode={player.team.shortName}
            className="!h-4 !w-4 sm:!h-6 sm:!w-6"
          />
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden pt-1">
          <div
            className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-bg/80 sm:h-[60px] sm:w-[60px] sm:p-0.5 ${tier.border}`}
          >
            <ImageDisplay
              src={player.photoUrl}
              alt={player.name}
              type="avatar"
              size="md"
              shortCode={player.name}
              className="!h-8 !w-8 sm:!h-12 sm:!w-12"
            />
          </div>
        </div>

        <div
          className={`-mt-0.5 mb-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black/25 font-num text-[11px] leading-none font-black shadow-lg sm:mb-2 sm:h-9 sm:w-9 sm:text-[15px] ${tier.badge}`}
        >
          {player.rating}
        </div>
      </div>

      <p className="mt-1 w-full text-center font-body leading-snug text-[10px] font-bold text-text sm:mt-1.5 sm:text-[11px]">{player.name}</p>
      <p className="mt-0.5 w-full text-center font-utility text-[8px] tracking-[0.12em] text-white/40 uppercase sm:tracking-[0.15em]">{slot.label}</p>
    </div>
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
        <div data-team-of-week className="overflow-hidden rounded-3xl border border-line bg-surface">
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

          <div className="bg-[linear-gradient(180deg,#181334_0%,#101B36_50%,#0A0F1E_100%)] px-3 py-4 sm:p-7">
            <div className="relative">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-[4%] inset-y-0 border-x border-white/10" />
                <div className="absolute inset-x-[4%] top-1/2 -translate-y-1/2 border-t border-white/10" />
                <div className="absolute top-[6%] left-1/2 h-[13%] w-[46%] -translate-x-1/2 border border-white/10" />
                <div className="absolute bottom-[6%] left-1/2 h-[13%] w-[46%] -translate-x-1/2 border border-white/10" />
                <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
                <div className="absolute top-[13%] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/15" />
                <div className="absolute bottom-[13%] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/15" />
                <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,rgba(46,123,255,0.12),transparent_70%)]" />
              </div>

              <div className="relative flex flex-col gap-4 sm:gap-7">
                {[...result.data.slots]
                  .reduce<{ band: number; slots: TeamOfTheWeekSlotVM[] }[]>((bands, slot) => {
                    const existing = bands.find((b) => b.band === slot.band);
                    if (existing) existing.slots.push(slot);
                    else bands.push({ band: slot.band, slots: [slot] });
                    return bands;
                  }, [])
                  .sort((a, b) => a.band - b.band)
                  .map((band) => (
                    <div key={band.band} className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2.5 sm:gap-x-4 sm:gap-y-3">
                      {band.slots.map((slot) => (
                        <ShieldCard key={slot.positionSlot} slot={slot} />
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}