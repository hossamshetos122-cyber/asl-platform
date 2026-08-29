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

export function PlayersBrowser({ players }: { players: PlayerListItem[] }) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => {
      if (position && p.position !== position) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.team && p.team.name.toLowerCase().includes(q))
      );
    });
  }, [players, query, position]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
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
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setPosition("")}
            className={`rounded-lg border px-3 py-1.5 font-body text-[11px] font-bold transition-colors ${
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
              className={`rounded-lg border px-3 py-1.5 font-body text-[11px] font-bold transition-colors ${
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="group rounded-xl border border-line bg-surface p-4 premier-card hover:border-accent/40"
            >
              <div className="flex items-center gap-3">
                <ImageDisplay src={player.photoUrl} alt={`صورة ${player.name}`} type="player" size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-black text-text group-hover:text-accent transition-colors truncate">
                    {player.name}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {player.jerseyNumber != null && (
                      <span className="inline-flex h-5 items-center rounded bg-emerald-500/15 px-1.5 font-num text-[11px] font-black text-emerald-500">
                        {player.jerseyNumber}
                      </span>
                    )}
                    <span className="rounded bg-surface-elevated px-1.5 py-0.5 font-utility text-[8px] tracking-wider text-text-dimmer uppercase">
                      {POSITION_LABELS[player.position] ?? player.position}
                    </span>
                  </div>
                  {player.team ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-text-dim">
                      <ImageDisplay src={player.team.crestUrl} alt={`شعار ${player.team.name}`} type="team-logo" size="xs" shortCode={player.team.name.substring(0, 2)} />
                      <span className="truncate font-body text-[11px]">{player.team.name}</span>
                    </div>
                  ) : (
                    <p className="mt-1.5 font-body text-[11px] text-text-faint">بدون فريق</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}