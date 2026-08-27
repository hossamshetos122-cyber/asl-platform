import { ImageDisplay } from "@/components/ui/image-display";
import type { TeamSummaryVM } from "@/lib/types";

interface TeamBadgeProps {
  team: TeamSummaryVM;
  size?: "sm" | "md" | "lg";
}

export function TeamBadge({ team, size = "md" }: TeamBadgeProps) {
  return (
    <ImageDisplay
      src={team.crestUrl}
      alt={`شعار ${team.name}`}
      type="team-logo"
      size={size}
      shortCode={team.shortCode}
    />
  );
}
