/**
 * Site / brand configuration.
 *
 * Loads the single SiteConfig row (id = "default") from the database and
 * returns a fully-resolved config object. If the row is missing (e.g. brand
 * new install before seeding, or during a cold Vercel build), it falls back
 * to sensible ALEXANDRIA defaults so the app always renders.
 *
 * The same object shape is used by:
 *   - layout.tsx  → injected as CSS variables on <body> (runtime color theme)
 *   - nav / footer / hero / auth screens → league name + logo
 *   - admin/settings → the editable form
 */

import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SiteConfig = {
  leagueName: string;
  leagueNameEn: string;
  cityName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  leagueName:
    process.env.NEXT_PUBLIC_LEAGUE_NAME || "دوري نجوم الإسكندرية للهواة",
  leagueNameEn:
    process.env.NEXT_PUBLIC_LEAGUE_NAME_EN || "Alexandria Amateur League",
  cityName: process.env.NEXT_PUBLIC_CITY_NAME || "الإسكندرية",
  logoUrl: process.env.NEXT_PUBLIC_LEAGUE_LOGO || "/images/league-logo.jpg",
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#0A0A0A",
  accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || "#E8B23A",
};

/** Cache tag for the site config so `revalidateTag` can bust it on save. */
export const SITE_CONFIG_TAG = "site-config";

async function fetchSiteConfigFromDb(): Promise<SiteConfig> {
  try {
    const row = await prisma.siteConfig.findUnique({ where: { id: "default" } });
    if (row) {
      return {
        leagueName: row.leagueName,
        leagueNameEn: row.leagueNameEn,
        cityName: row.cityName,
        logoUrl: row.logoUrl,
        primaryColor: row.primaryColor,
        accentColor: row.accentColor,
      };
    }
  } catch (error) {
    // DB unavailable (cold build / seed not run) — fall through to defaults.
    console.error("[site-config] fell back to defaults:", error);
  }
  return DEFAULT_SITE_CONFIG;
}

/**
 * Cached getter. The DB is queried at most once per 1 hour (or until the
 * settings page saves, which revalidates the tag), so navigating around the
 * admin doesn't hit the database on every page change.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  return unstable_cache(
    fetchSiteConfigFromDb,
    ["site-config"],
    { tags: [SITE_CONFIG_TAG], revalidate: 30 },
  )();
}

/** Bust the cached config after a settings save. */
export async function invalidateSiteConfig() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(SITE_CONFIG_TAG);
}

/** Resolved CSS variables that map 1:1 to the Tailwind theme tokens.
 *  `--bg-rgb`/`--accent-rgb` carry the RGB channel triplets so Tailwind's
 *  `rgb(var(--x) / <alpha-value>)` opacity modifiers keep working, while the
 *  plain `--bg`/`--accent` hex values are used by gradients in globals.css. */
export function siteCssVars(cfg: SiteConfig): React.CSSProperties {
  const bg = cfg.primaryColor;
  const accent = cfg.accentColor;

  const vars: Record<string, string> = {
    "--bg": bg,
    "--bg-rgb": hexToRgb(bg),
    "--accent": accent,
    "--accent-rgb": hexToRgb(accent),

    // Derived background family — neutral charcoal scale above the near-black
    // base (blended toward white), so the whole chrome reads premium/monochrome.
    "--bg-deep": shade(bg, 0.78),
    "--bg-deep-rgb": hexToRgb(shade(bg, 0.78)),
    "--surface": blend(bg, "#ffffff", 0.045),
    "--surface-rgb": hexToRgb(blend(bg, "#ffffff", 0.045)),
    "--surface-elevated": blend(bg, "#ffffff", 0.075),
    "--surface-elevated-rgb": hexToRgb(blend(bg, "#ffffff", 0.075)),
    "--surface-raised2": blend(bg, "#ffffff", 0.11),
    "--surface-raised2-rgb": hexToRgb(blend(bg, "#ffffff", 0.11)),
    "--purple": blend(bg, "#ffffff", 0.03),
    "--purple-rgb": hexToRgb(blend(bg, "#ffffff", 0.03)),
    "--purple-dim": shade(bg, 0.95),
    "--purple-dim-rgb": hexToRgb(shade(bg, 0.95)),
    "--navy": blend(bg, "#ffffff", 0.06),
    "--navy-rgb": hexToRgb(blend(bg, "#ffffff", 0.06)),
    "--navy-light": blend(bg, "#ffffff", 0.14),
    "--navy-light-rgb": hexToRgb(blend(bg, "#ffffff", 0.14)),

    // Derived accent family
    "--accent-bright": blend(accent, "#ffffff", 0.45),
    "--accent-bright-rgb": hexToRgb(blend(accent, "#ffffff", 0.45)),
    "--accent-dim": shade(accent, 0.7),
    "--accent-dim-rgb": hexToRgb(shade(accent, 0.7)),
    "--accent-faint": accent,
    "--accent-faint-rgb": hexToRgb(accent),
    "--line-accent": accent,
    "--line-accent-rgb": hexToRgb(accent),
  };

  return vars as React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Small hex color helpers (deterministic, no runtime CSS color-mix needed to
// keep every derived shade computable from the two user-picked colors).
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m || !m[1]) return "10 31 60";
  const v = parseInt(m[1], 16);
  return `${(v >> 16) & 255} ${(v >> 8) & 255} ${v & 255}`;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex(r: number, g: number, b: number): string {
  const c = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function toRgbNums(hex: string): [number, number, number] {
  const parts = hexToRgb(hex).split(" ").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/** Mix `hex` toward `target` by `t` (0..1). */
function blend(hex: string, target: string, t: number): string {
  const [r1, g1, b1] = toRgbNums(hex);
  const [r2, g2, b2] = toRgbNums(target);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Darken `hex` by factor `keep` (0..1, e.g. 0.78 keeps 78% brightness). */
function shade(hex: string, keep: number): string {
  const [r, g, b] = toRgbNums(hex);
  return toHex(r * keep, g * keep, b * keep);
}