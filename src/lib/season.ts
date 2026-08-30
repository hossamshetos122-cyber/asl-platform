import { getFeaturedSeasonLabel } from "@/lib/stats";

/**
 * Clock-based fallback: football seasons in Egypt run from September to June.
 * Returns the current season's year range, e.g. "2025/2026" during the
 * 2025/2026 season.
 */
export function getCurrentSeasonLabel(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-based; September = 8
  const startYear = month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}/${startYear + 1}`;
}

/**
 * The season label the whole app should display: the DB season attached to
 * the featured (active) tournament's finished matches — consistent with the
 * match lists and standings. Falls back to the clock-based label when there
 * is no featured tournament / season data yet.
 */
export async function getDisplaySeasonLabel(): Promise<string> {
  const featuredLabel = await getFeaturedSeasonLabel();
  return featuredLabel ?? getCurrentSeasonLabel();
}

export function getCurrentCopyrightYear(): number {
  return new Date().getFullYear();
}