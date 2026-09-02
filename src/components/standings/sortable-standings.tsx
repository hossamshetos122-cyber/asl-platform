"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { StandingRowVM, TeamSummaryVM } from "@/lib/types";
import { ImageDisplay } from "@/components/ui/image-display";
import { motion } from "@/components/ui/motion";

type SortKey = "rank" | "team" | "played" | "won" | "drawn" | "lost" | "goalsFor" | "goalsAgainst" | "goalDiff" | "points";

const COLUMNS: { key: SortKey; label: string; sortable: boolean }[] = [
  { key: "points", label: "نقاط", sortable: true },
  { key: "played", label: "لعب", sortable: true },
  { key: "won", label: "فوز", sortable: true },
  { key: "drawn", label: "تعادل", sortable: true },
  { key: "lost", label: "خسارة", sortable: true },
  { key: "goalsFor", label: "له", sortable: true },
  { key: "goalsAgainst", label: "عليه", sortable: true },
  { key: "goalDiff", label: "الفرق", sortable: true },
];

function getValue(row: StandingRowVM, key: SortKey): number | string {
  switch (key) {
    case "rank":
      return row.rank;
    case "team":
      return row.team.name;
    case "goalDiff":
      return row.goalsFor - row.goalsAgainst;
    case "points":
    case "played":
    case "won":
    case "drawn":
    case "lost":
    case "goalsFor":
    case "goalsAgainst":
      return row[key];
    default:
      return 0;
  }
}

function SortIndicator({ dir }: { dir: "asc" | "desc" | null }) {
  if (!dir) return <span className="opacity-0 transition-opacity group-hover:opacity-40">↕</span>;
  return (
    <span className={`ml-0.5 inline-block text-[7px] leading-none ${dir === "desc" ? "text-accent" : "text-accent-bright/70"}`}>
      {dir === "desc" ? "▼" : "▲"}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-emerald-500 font-num text-[10px] font-bold text-bg shadow-pulse-green">1</span>;
  if (rank <= 3) return <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-emerald-500/40 font-num text-[10px] font-bold text-emerald-500">{rank}</span>;
  return <span className="inline-flex h-6 w-6 items-center justify-center rounded font-num text-[10px] font-bold text-text-dimmer">{rank}</span>;
}

function TeamCell({ team }: { team: TeamSummaryVM }) {
  return (
    <Link href={`/teams/${team.id}`} className="flex items-center gap-2 group py-1.5 -my-1.5">
      <ImageDisplay src={team.crestUrl} alt={team.name} type="team-logo" size="xs" shortCode={team.shortCode} />
      <span className="font-body text-[12px] font-bold text-text group-hover:text-accent transition-colors truncate">{team.name}</span>
    </Link>
  );
}

function StatCell({ row, col }: { row: StandingRowVM; col: { key: SortKey; label: string; sortable: boolean } }) {
  const value =
    col.key === "won" ? (
      <span className="font-num text-[12px] font-bold text-emerald-400">{row.won}</span>
    ) : col.key === "lost" ? (
      <span className="font-num text-[12px] text-live/60">{row.lost}</span>
    ) : col.key === "points" ? (
      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-emerald-500/10 px-1.5 font-num text-[12px] font-bold text-emerald-500">{row.points}</span>
    ) : (() => {
        const gd = row.goalsFor - row.goalsAgainst;
        return (
          <span className={`font-num text-[12px] font-bold ${gd > 0 ? "text-emerald-400" : gd < 0 ? "text-live/70" : "text-text-dim"}`}>
            {gd > 0 ? "+" : ""}{gd}
          </span>
        );
      })();
  return <td className="px-2.5 py-2.5 text-center">{value}</td>;
}

const fadeRow = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

export function SortableStandings({ rows }: { rows: StandingRowVM[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const list = [...rows];
    if (sortKey === "rank") {
      list.sort((a, b) => a.rank - b.rank);
      return list;
    }
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv, "ar") * dir;
      return (Number(av) - Number(bv)) * dir;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  function toggle(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" || key === "team" ? "asc" : "desc");
    }
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-line bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line-strong bg-surface-elevated/40">
                <th className="px-3 py-2.5 text-right w-10">
                  <button type="button" onClick={() => toggle("rank")} className="group inline-flex items-center gap-1 font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase transition-colors hover:text-accent">
                    #<SortIndicator dir={sortKey === "rank" ? sortDir : null} />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-right">
                  <button type="button" onClick={() => toggle("team")} className="group inline-flex items-center gap-1 font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase transition-colors hover:text-accent">
                    الفريق<SortIndicator dir={sortKey === "team" ? sortDir : null} />
                  </button>
                </th>
                {COLUMNS.map((col) => {
                  if (col.key === "points") {
                    return (
                      <th key={col.key} className="px-2.5 py-2.5 text-center">
                        <button type="button" onClick={() => toggle(col.key)} className="group inline-flex items-center gap-1 font-utility text-[9px] tracking-[0.12em] text-emerald-500 uppercase transition-colors hover:text-emerald-300">
                          {col.label}<SortIndicator dir={sortKey === col.key ? sortDir : null} />
                        </button>
                      </th>
                    );
                  }
                  return (
                    <th key={col.key} className="px-2.5 py-2.5 text-center">
                      <button type="button" onClick={() => toggle(col.key)} className="group inline-flex items-center gap-1 font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase transition-colors hover:text-accent">
                        {col.label}<SortIndicator dir={sortKey === col.key ? sortDir : null} />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            >
              {sorted.map((row) => (
                <motion.tr
                  key={row.team.id}
                  variants={fadeRow}
                  className={`border-b border-line/40 transition-colors hover:bg-surface-elevated/30 ${row.rank <= 3 ? "bg-emerald-500/[0.04]" : "even:bg-white/[0.02]"}`}
                >
                  <td className="px-3 py-2.5 text-center">
                    <RankBadge rank={row.rank} />
                  </td>
                  <td className="px-3 py-2.5">
                    <TeamCell team={row.team} />
                  </td>
                  {COLUMNS.map((col) => <StatCell key={col.key} row={row} col={col} />)}
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {sorted.map((row) => {
          const gd = row.goalsFor - row.goalsAgainst;
          return (
            <Link key={row.team.id} href={`/teams/${row.team.id}`} className="block rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center gap-3">
                <RankBadge rank={row.rank} />
                <ImageDisplay src={row.team.crestUrl} alt={row.team.name} type="team-logo" size="sm" shortCode={row.team.shortCode} />
                <div className="flex-1 min-w-0">
                  <div className="font-body text-[13px] font-bold text-text truncate">{row.team.name}</div>
                  <div className="font-utility text-[8px] tracking-wider text-text-dimmer uppercase">{row.played} مباراة</div>
                </div>
                <div className="text-left">
                  <div className="inline-flex h-7 min-w-[28px] items-center justify-center rounded bg-emerald-500/10 px-2 font-num text-sm font-bold text-emerald-500">{row.points}</div>
                  <div className="mt-0.5 text-center font-num text-[10px] text-text-dimmer">
                    {row.won}ف {row.drawn}ت {row.lost}خ
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-line/40 pt-2 font-num text-[11px]">
                <span className="text-text-dimmer">{row.goalsFor} هـ / {row.goalsAgainst} ع</span>
                <span className={`font-bold ${gd > 0 ? "text-emerald-400" : gd < 0 ? "text-live/70" : "text-text-dim"}`}>
                  فرق {gd > 0 ? "+" : ""}{gd}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-3 text-center font-body text-[11px] text-text-dimmer">
        اضغط على أي عمود لترتيب الجدول
      </p>
    </div>
  );
}