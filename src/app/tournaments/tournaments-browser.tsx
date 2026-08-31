"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatLongDate } from "@/lib/dates";

const STATUS_LABELS: Record<string, string> = { UPCOMING: "قادم", ONGOING: "جاري", COMPLETED: "منتهي", CANCELLED: "ملغى" };
const STATUS_CLASSES: Record<string, string> = { UPCOMING: "badge-muted", ONGOING: "badge-accent", COMPLETED: "badge-success", CANCELLED: "badge-muted" };
const FORMAT_LABELS: Record<string, string> = { LEAGUE: "دوري", KNOCKOUT: "كأس", GROUPS_KNOCKOUT: "مجموعات + إقصائي", CUP: "كأس", CHAMPIONS_LEAGUE: "دوري الأبطال" };

type TournamentVM = {
  id: string;
  name: string;
  format: string;
  status: string;
  startDate: Date | string;
  teamCount: number;
};

export function TournamentsBrowser({ tournaments }: { tournaments: TournamentVM[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tournaments.filter((t) => {
      const matchesQuery = !q || t.name.toLowerCase().includes(q);
      const matchesStatus = !status || t.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [tournaments, query, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-3">
        <svg className="h-4 w-4 flex-shrink-0 text-text-dimmer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن بطولة بالاسم..."
          className="min-w-0 flex-1 bg-transparent font-body text-[13px] text-text placeholder:text-text-dimmer outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-line bg-bg px-3 py-2 font-body text-[12px] text-text outline-none focus:border-accent"
        >
          <option value="">كل الحالات</option>
          <option value="ONGOING">جاري</option>
          <option value="UPCOMING">قادم</option>
          <option value="COMPLETED">منتهي</option>
          <option value="CANCELLED">ملغى</option>
        </select>
        <span className="flex-shrink-0 font-num text-[11px] font-bold text-text-dimmer">{filtered.length} / {tournaments.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <p className="font-body text-sm text-text-dim">لا توجد بطولات مطابقة للبحث.</p>
          <button onClick={() => { setQuery(""); setStatus(""); }} className="mt-3 font-body text-[12px] font-bold text-accent hover:text-accent-bright">
            مسح البحث
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tournament) => (
            <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="group rounded-xl border border-line bg-surface p-4 sm:p-5 premier-card">
              <div className="mb-3 flex items-center gap-1.5">
                <span className={STATUS_CLASSES[tournament.status] ?? "badge-muted"}>{STATUS_LABELS[tournament.status] ?? tournament.status}</span>
                <span className="rounded bg-surface-elevated border border-line px-1.5 py-0.5 font-utility text-[8px] tracking-wider text-text-dimmer uppercase">{FORMAT_LABELS[tournament.format] ?? tournament.format}</span>
              </div>
              <h3 className="mb-2.5 font-display text-sm sm:text-base font-black text-text group-hover:text-accent transition-colors leading-tight">{tournament.name}</h3>
              <div className="flex items-center justify-between font-body text-[11px] text-text-dimmer">
                <span>{formatLongDate(new Date(tournament.startDate))}</span>
                <span className="font-num font-bold text-emerald-500">{tournament.teamCount} فريق</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}