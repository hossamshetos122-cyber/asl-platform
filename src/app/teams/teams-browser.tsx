"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ImageDisplay } from "@/components/ui/image-display";

type TeamVM = {
  id: string;
  name: string;
  shortCode: string;
  city?: string;
  crestUrl: string | null;
};

export function TeamsBrowser({ teams }: { teams: TeamVM[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.shortCode.toLowerCase().includes(q) ||
      (t.city ?? "").toLowerCase().includes(q),
    );
  }, [teams, query]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-3">
        <svg className="h-4 w-4 flex-shrink-0 text-text-dimmer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن فريق بالاسم أو المدينة..."
          className="w-full bg-transparent font-body text-[13px] text-text placeholder:text-text-dimmer outline-none"
        />
        <span className="flex-shrink-0 font-num text-[11px] font-bold text-text-dimmer">{filtered.length} / {teams.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <p className="font-body text-sm text-text-dim">لا توجد نتائج مطابقة لبحثك.</p>
          <button onClick={() => setQuery("")} className="mt-3 font-body text-[12px] font-bold text-accent hover:text-accent-bright">
            مسح البحث
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
          {filtered.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="group rounded-xl border border-line bg-surface p-4 premier-card animate-fade-up"
            >
              <div className="flex items-center gap-3">
                <ImageDisplay src={team.crestUrl} alt={`شعار ${team.name}`} type="team-logo" size="lg" shortCode={team.shortCode} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-black text-text group-hover:text-accent transition-colors truncate">{team.name}</h3>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded bg-surface-elevated px-1.5 py-0.5 font-utility text-[8px] tracking-wider text-text-dimmer uppercase">{team.shortCode}</span>
                    {team.city && <span className="font-body text-[10px] text-text-dimmer">{team.city}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}