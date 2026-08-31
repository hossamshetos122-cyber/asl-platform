import { ImageDisplay } from "@/components/ui/image-display";
import { getRatingTier, type RatingTierKey } from "@/lib/ratings";

interface TierStyle {
  border: string;
  strip: string;
  badge: string;
  glow: string;
}

const TIER_STYLES: Record<RatingTierKey, TierStyle> = {
  green: {
    border: "border-success/70",
    strip: "from-success to-emerald-400",
    badge: "bg-success text-[#04241a]",
    glow: "shadow-pulse-green",
  },
  diamond: {
    border: "border-cyan/70",
    strip: "from-cyan to-[#7EE7FF]",
    badge: "bg-cyan text-[#062a38]",
    glow: "shadow-[0_0_16px_rgba(46,214,245,0.35)]",
  },
  gold: {
    border: "border-[#F5C518]/70",
    strip: "from-[#FFD166] to-[#F5C518]",
    badge: "bg-[#F5C518] text-[#1d1400]",
    glow: "shadow-[0_0_16px_rgba(245,197,24,0.30)]",
  },
  silver: {
    border: "border-[#c7d0e0]/60",
    strip: "from-[#8b97ad] to-[#c7d0e0]",
    badge: "bg-[#c7d0e0] text-[#1a2233]",
    glow: "",
  },
  base: {
    border: "border-line-strong",
    strip: "from-[#3a4a6b] to-[#5b6883]",
    badge: "bg-line-strong text-text",
    glow: "",
  },
};

interface TOTWCardProps {
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  rating: number;
  crestUrl: string | null;
  shortName: string;
  teamName: string;
  captain?: boolean;
  className?: string;
}

/** FIFA-style player card color-graded by rating, used on the pitch. */
export function TOTWCard({
  name,
  photoUrl,
  jerseyNumber,
  rating,
  crestUrl,
  shortName,
  teamName,
  captain = false,
  className = "",
}: TOTWCardProps) {
  const tier = TIER_STYLES[getRatingTier(rating)];

  return (
    <div
      className={`relative flex w-full max-w-[130px] flex-col overflow-hidden rounded-lg border bg-surface ${tier.border} ${tier.glow} ${className}`}
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${tier.strip}`} />
      <div className="p-2 text-center">
        <div className="mx-auto flex w-fit items-center justify-center overflow-hidden rounded-full bg-bg p-0.5">
          <ImageDisplay src={photoUrl} alt={name} type="player" size="sm" shortCode={name} className="rounded-full" />
        </div>
      </div>
      <div className="px-1.5 pb-2 text-center">
        <p className="truncate font-body text-[10px] font-bold text-text">{name}</p>
        <div className="mt-1 flex items-center justify-center gap-1">
          <ImageDisplay src={crestUrl} alt={teamName} type="team-logo" size="xs" shortCode={shortName} />
          <span className="truncate font-body text-[9px] font-bold text-text-dim">{shortName}</span>
        </div>
      </div>
      <div className={`absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full font-num text-[12px] leading-none font-black ${tier.badge}`}>
        {rating}
      </div>
      <div className="absolute right-1 top-1 flex flex-col items-end gap-0.5">
        {captain && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent font-display text-[9px] font-black text-white">
            C
          </span>
        )}
        {jerseyNumber !== null && (
          <span className="font-num text-[9px] font-black text-text-dimmer">{jerseyNumber}</span>
        )}
      </div>
    </div>
  );
}