"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "", label: "كل الحالات" },
  { value: "LIVE", label: "مباشر" },
  { value: "HALFTIME", label: "استراحة" },
  { value: "FINISHED", label: "انتهت" },
  { value: "SCHEDULED", label: "مجدولة" },
  { value: "POSTPONED", label: "مؤجلة" },
  { value: "CANCELLED", label: "ملغاة" },
] as const;

export function MatchFilters({ teams }: { teams: { id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const team = searchParams.get("team") ?? "";
  const status = searchParams.get("status") ?? "";

  function apply(nextTeam: string, nextStatus: string) {
    const params = new URLSearchParams();
    if (nextTeam) params.set("team", nextTeam);
    if (nextStatus) params.set("status", nextStatus);
    const qs = params.toString();
    router.push(qs ? `/matches?${qs}` : "/matches");
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-3">
      <span className="font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">تصفية</span>
      <select
        value={team}
        onChange={(e) => apply(e.target.value, status)}
        className="rounded-lg border border-line bg-bg px-3 py-2 font-body text-[12px] text-text outline-none transition-colors focus:border-accent"
      >
        <option value="">كل الفرق</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <select
        value={status}
        onChange={(e) => apply(team, e.target.value)}
        className="rounded-lg border border-line bg-bg px-3 py-2 font-body text-[12px] text-text outline-none transition-colors focus:border-accent"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {(team || status) && (
        <button
          onClick={() => apply("", "")}
          className="flex items-center gap-1 rounded-lg border border-line px-3 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:border-live/40 hover:text-live"
        >
          مسح الفلاتر
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      )}
      <span className="ms-auto font-body text-[11px] text-text-dimmer">
        يتم التصفية بدون إعادة تحميل الصفحة
      </span>
    </div>
  );
}