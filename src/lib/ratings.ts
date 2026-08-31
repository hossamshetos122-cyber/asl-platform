export type RatingTierKey = "green" | "diamond" | "gold" | "silver" | "base";

/**
 * Auto rating (0-100) from match stats — goals, assists and clean sheets
 * for goalkeepers. The admin can always override the stored value, so this
 * is only the "تلقائي" source.
 */
export function computePlayerRating(input: {
  goals: number;
  assists: number;
  cleanSheets: number;
  isGoalkeeper: boolean;
}): number {
  let rating = 58 + input.goals * 4 + input.assists * 2;
  if (input.isGoalkeeper) rating += input.cleanSheets * 6;
  return Math.max(30, Math.min(100, Math.round(rating)));
}

const TIER_LABELS: Record<RatingTierKey, string> = {
  green: "ألترا",
  diamond: "ألماس",
  gold: "ذهبي",
  silver: "فضي",
  base: "أساسي",
};

/** FIFA-style card tier by rating value. */
export function getRatingTier(rating: number): RatingTierKey {
  if (rating >= 95) return "green";
  if (rating >= 90) return "diamond";
  if (rating >= 80) return "gold";
  if (rating >= 70) return "silver";
  return "base";
}

export function getRatingTierLabel(tier: RatingTierKey): string {
  return TIER_LABELS[tier];
}