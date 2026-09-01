"use client";

import { useState } from "react";
import Link from "next/link";
import type { SuspendedPlayerRow } from "@/lib/discipline";
import { formatMatchDateTime } from "@/lib/dates";
import { SearchInput } from "@/components/ui/search-input";
import { normalizeArabic } from "@/lib/search";

const REASON_LABELS: Record<string, string> = {
  RED: "بطاقة حمراء (إيقاف مباراة)",
  SECOND_YELLOW: "كارتان صفراوان في مباراتين (إيقاف مباراة)",
};

export function SuspensionsTable({ rows }: { rows: SuspendedPlayerRow[] }) {
  const [search, setSearch] = useState("");

  const query = normalizeArabic(search.trim());
  const filtered = query
    ? rows.filter((row) => {
        const player = normalizeArabic(row.playerName);
        const team = normalizeArabic(row.teamName);
        return player.includes(query) || team.includes(query);
      })
    : rows;

  const hasResults = filtered.length > 0;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-6 py-10 text-center">
        <p className="font-body text-sm font-bold text-emerald-500">لا يوجد لاعبون موقوفون حالياً.</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="ابحث باسم اللاعب أو الفريق..."
          label="بحث في الموقوفين"
        />
      </div>
      {!hasResults ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <p className="font-body text-sm font-bold text-text-dim">لا توجد نتائج مطابقة لبحثك.</p>
          <p className="mt-1 font-body text-[12px] text-text-dimmer">جرّب كتابة اسم لاعب أو فريق آخر.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-line bg-surface-elevated/50">
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اللاعب</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الفريق</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">السبب</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الكروت</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المباراة القادمة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {filtered.map((row) => (
                <tr key={row.playerId} className="transition-colors hover:bg-surface-elevated/50">
                  <td className="px-4 py-3">
                    <Link href={`/players/${row.playerId}`} className="font-body text-[13px] font-bold text-text transition-colors hover:text-accent">
                      {row.playerName}
                    </Link>
                    {row.jerseyNumber != null && (
                      <span className="mr-1.5 inline-flex h-5 items-center rounded-sm bg-surface-elevated px-1.5 font-num text-[10px] font-bold text-emerald-500">{row.jerseyNumber}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/teams/${row.teamId}`} className="font-body text-[12px] font-bold text-accent transition-colors hover:text-accent-bright">{row.teamName}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 font-body text-[11px] font-bold ${row.reason === "RED" ? "bg-red-500/15 text-red-400" : "bg-yellow-400/15 text-yellow-300"}`}>
                      {REASON_LABELS[row.reason] ?? row.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-num text-[11px] font-bold">
                      <span className="inline-flex h-5 min-w-7 items-center justify-center gap-1 rounded border border-yellow-400/35 bg-yellow-400/10 px-1 text-yellow-300">{row.yellows}</span>
                      <span className="inline-flex h-5 min-w-7 items-center justify-center gap-1 rounded border border-red-500/35 bg-red-500/10 px-1 text-red-400">{row.reds}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.nextFixtureId ? (
                      <Link href={`/matches/${row.nextFixtureId}`} className="font-body text-[12px] font-bold text-accent transition-colors hover:text-accent-bright">
                        {row.nextFixtureKickoffAt ? formatMatchDateTime(row.nextFixtureKickoffAt) : ""}
                      </Link>
                    ) : (
                      <span className="font-body text-[12px] text-text-dim">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
