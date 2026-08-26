import Image from "next/image";
import type { TeamSummaryVM } from "@/lib/types";

interface TeamBadgeProps {
  team: TeamSummaryVM;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP: Record<NonNullable<TeamBadgeProps["size"]>, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function TeamBadge({ team, size = "md" }: TeamBadgeProps) {
  const sizeClasses = SIZE_MAP[size];

  if (team.crestUrl) {
    const pixelSize = size === "lg" ? 56 : size === "md" ? 40 : 28;
    return (
      <div className={`flex-shrink-0 flex items-center justify-center rounded-lg ${sizeClasses}`}>
        <Image
          src={team.crestUrl}
          alt={`شعار ${team.name}`}
          width={pixelSize}
          height={pixelSize}
          className="object-contain rounded-lg"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-lg border border-line bg-bg-raised2 font-utility font-bold text-gold ${sizeClasses}`}
      aria-hidden="true"
    >
      {team.shortCode}
    </div>
  );
}
