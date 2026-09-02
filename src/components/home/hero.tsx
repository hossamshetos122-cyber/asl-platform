import { HeroVisual } from "@/components/home/hero-visual";
import { getHomeStats } from "@/lib/stats";
import { getDisplaySeasonLabel } from "@/lib/season";
import type { HomeStatsVM } from "@/lib/types";

const FALLBACK_STATS: HomeStatsVM = {
  registeredTeams: 0,
  goalsThisSeason: 0,
  activeTournaments: 0,
  registeredPlayers: 0,
};

export async function Hero() {
  const [statsResult, seasonLabel] = await Promise.all([
    getHomeStats(),
    getDisplaySeasonLabel(),
  ]);
  const stats = statsResult.status === "success" ? statsResult.data : FALLBACK_STATS;

  return <HeroVisual season={seasonLabel} stats={stats} />;
}