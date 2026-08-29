/**
 * Football seasons in Egypt run from September to June.
 * Returns the current season's year range consistently for the whole app,
 * e.g. "2025/2026" during the 2025/2026 season.
 */
export function getCurrentSeasonLabel(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-based; September = 8
  const startYear = month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}/${startYear + 1}`;
}

export function getCurrentCopyrightYear(): number {
  return new Date().getFullYear();
}