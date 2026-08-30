"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ImageDisplay } from "@/components/ui/image-display";

interface PlayerListItem {
  id: string;
  name: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
  position: string;
  team: { id: string; name: string; crestUrl: string | null } | null;
  goals: number;
}

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: "حارس مرمى",
  DEFENDER: "مدافع",
  MIDFIELDER: "لاعب وسط",
  FORWARD: "مهاجم",
};

const POSITION_OPTIONS = [
  { value: "GOALKEEPER", label: "حارس مرمى" },
  { value: "DEFENDER", label: "مدافع" },
  { value: "MIDFIELDER", label: "لاعب وسط" },
  { value: "FORWARD", label: "مهاجم" },
];

interface RoleStyle {
  hex: string;
  hexDim: string;
  soft: string;
  label: string;
}

const ROLE_STYLES: Record<string, RoleStyle> = {
  GOALKEEPER: {
    hex: "#4AA8FF",
    hexDim: "rgba(74,168,255,0.16)",
    soft: "rgba(74,168,255,0.12)",
    label: "حارس مرمى",
  },
  DEFENDER: {
    hex: "#00FF87",
    hexDim: "rgba(0,255,135,0.16)",
    soft: "rgba(0,255,135,0.12)",
    label: "مدافع",
  },
  MIDFIELDER: {
    hex: "#FFB23E",
    hexDim: "rgba(255,178,62,0.18)",
    soft: "rgba(255,178,62,0.12)",
    label: "لاعب وسط",
  },
  FORWARD: {
    hex: "#FF2E77",
    hexDim: "rgba(255,46,119,0.16)",
    soft: "rgba(255,46,119,0.12)",
    label: "مهاجم",
  },
};

const ROLE_DEFAULT: RoleStyle = {
  hex: "#963CFF",
  hexDim: "rgba(150,60,255,0.16)",
  soft: "rgba(150,60,255,0.12)",
  label: "لاعب",
};

function roleStyle(position: string): RoleStyle {
  return ROLE_STYLES[position] ?? ROLE_DEFAULT;
}

function PlayerCard({ player }: { player: PlayerListItem }) {
  const role = roleStyle(player.position);
  return (
    <Link
      href={`/players/${player.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-surface premier-card animate-fade-up transition-colors"
      style={{ borderColor: role.hexDim }}
    >
      {/* Photo band */}
      <div className="relative h-28 sm:h-32 overflow-hidden" style={{ background: `radial-gradient(130% 160% at 50% -20%, ${role.soft}, rgba(42,13,72,0) 65%), linear-gradient(180deg, ${role.hexDim}, #1E0734 78%)` }}>
        {player.jerseyNumber != null && (
          <span className="pointer-events-none absolute left-1 -bottom-2 select-none font-num text-[68px] font-black leading-none text-white/5" dir="ltr">
            {player.jerseyNumber}
          </span>
        )}
        {player.team?.crestUrl && (
          <div className="absolute right-2 top-2">
            <ImageDisplay src={player.team.crestUrl} alt={`شعار ${player.team.name}`} type="team-logo" size="xs" shortCode={player.team.name.substring(0, 2)} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center pb-1.5">
          <div className="rounded-full p-[3px]" style={{ background: `linear-gradient(135deg, ${role.hex}, rgba(255,255,255,0.15) 55%, ${role.hex})`, boxShadow: `0 6px 20px ${role.hex}22` }}>
            <ImageDisplay
              src={player.photoUrl}
              alt={`صورة ${player.name}`}
              type="avatar"
              size="lg"
              className="rounded-full bg-surface-elevated"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="font-display text-[13px] sm:text-sm font-black text-text group-hover:text-accent-bright transition-colors truncate">
            {player.name}
          </h3>
          {player.jerseyNumber != null && (
            <span className="inline-flex h-5 flex-shrink-0 items-center rounded px-1.5 font-num text-[11px] font-black" style={{ backgroundColor: role.soft, color: role.hex }}>
              {player.jerseyNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded px-1.5 py-0.5 font-utility text-[9px] font-bold tracking-wide uppercase" style={{ backgroundColor: role.soft, color: role.hex }}>
            {role.label}
          </span>
          <span className="inline-flex h-5 items-center gap-1 rounded bg-emerald-500/10 px-1.5 font-num text-[11px] font-black text-emerald-500" title="الأهداف">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            {player.goals}
          </span>
        </div>

        {player.team ? (
          <div className="mt-auto flex items-center gap-1.5 pt-0.5 text-text-dim">
            <ImageDisplay src={player.team.crestUrl} alt={`شعار ${player.team.name}`} type="team-logo" size="xs" shortCode={player.team.name.substring(0, 2)} />
            <span className="truncate font-body text-[11px]">{player.team.name}</span>
          </div>
        ) : (
          <p className="mt-auto font-body text-[11px] text-text-faint">بدون فريق</p>
        )}
      </div>
    </Link>
  );
}

export function PlayersBrowser({ players }: { players: PlayerListItem[] }) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("");
  const [team, setTeam] = useState("");
  const [sort, setSort] = useState<"name" | "goals">("name");

  const teamOptions = useMemo(() => {
    const map = new Map<string, NonNullable<PlayerListItem["team"]>>();
    players.forEach((p) => {
      if (p.team && !map.has(p.team.id)) map.set(p.team.id, p.team);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [players]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = players.filter((p) => {
      if (position && p.position !== position) return false;
      if (team && (!p.team || p.team.id !== team)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.team && p.team.name.toLowerCase().includes(q))
      );
    });
    return [...list].sort((a, b) =>
      sort === "goals"
        ? b.goals - a.goals || a.name.localeCompare(b.name, "ar")
        : a.name.localeCompare(b.name, "ar")
    );
  }, [players, query, position, team, sort]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 flex flex-col gap-2.5">
        <div className="relative">
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dimmer"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن لاعب أو فريق..."
            className="w-full rounded-lg border border-line bg-bg py-2 pl-4 pr-9 font-body text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          <label className="block">
            <span className="mb-1 block font-utility text-[10px] font-bold uppercase tracking-wide text-text-dimmer">الفريق</span>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              aria-label="تصفية حسب الفريق"
              className="w-full cursor-pointer rounded-lg border border-line bg-bg px-3 py-2 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            >
              <option value="">كل الفرق</option>
              {teamOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-utility text-[10px] font-bold uppercase tracking-wide text-text-dimmer">الترتيب</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "name" | "goals")}
              aria-label="ترتيب اللاعبين"
              className="w-full cursor-pointer rounded-lg border border-line bg-bg px-3 py-2 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            >
              <option value="name">الاسم أبجديًا</option>
              <option value="goals">الأكثر أهدافًا</option>
            </select>
          </label>
          <div className="hidden items-end sm:flex">
            <span className="w-full rounded-lg border border-dashed border-line px-3 py-2 font-body text-[12px] font-bold text-text-dim">
              {team === ""
                ? "كل الفرق"
                : teamOptions.find((t) => t.id === team)?.name ?? "كل الفرق"}
              {" · "}
              {sort === "goals" ? "الأكثر أهدافًا" : "الاسم أبجديًا"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setPosition("")}
            className={`rounded-lg border px-3 py-2 font-body text-[12px] font-bold transition-colors ${
              position === ""
                ? "border-accent-bright/60 bg-accent/10 text-accent-bright"
                : "border-line text-text-dim hover:text-text"
            }`}
          >
            الكل
          </button>
          {POSITION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPosition(position === opt.value ? "" : opt.value)}
              className={`rounded-lg border px-3 py-2 font-body text-[12px] font-bold transition-colors ${
                position === opt.value
                  ? "border-accent-bright/60 bg-accent/10 text-accent-bright"
                  : "border-line text-text-dim hover:text-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 font-body text-xs text-text-dimmer">عدد اللاعبين: {filtered.length}</p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <p className="font-body text-sm text-text-dim">لا توجد نتائج مطابقة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
          {filtered.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}