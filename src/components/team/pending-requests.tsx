"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondTeamJoin } from "@/lib/actions/players";
import { formatRelativeTime } from "@/lib/dates";
import type { PendingRequestVM } from "@/lib/types";

export function PendingRequestsPanel({ teamId, requests }: { teamId: string; requests: PendingRequestVM[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (requests.length === 0) return null;

  const respond = (id: string, approve: boolean) => {
    setError(null);
    setPendingId(id);
    setBusy(true);
    startTransition(async () => {
      const res = await respondTeamJoin(teamId, id, approve);
      setPendingId(null);
      setBusy(false);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error ?? "حدث خطأ");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h2 className="flex items-center gap-2 font-display text-base font-black text-text">
          طلبات الانضمام
          <span className="rounded-full bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 font-body text-[10px] font-bold text-amber-300">{requests.length}</span>
        </h2>
      </div>
      <div className="divide-y divide-line">
        {requests.map((req) => (
          <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-text-dimmer" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8h-1m4 0h-1M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><circle cx="8.5" cy="7" r="4" />
              </svg>
              <div>
                <p className="font-body text-[13px] font-bold text-text">{req.name}</p>
                <p className="font-utility text-[9px] tracking-wider text-text-dimmer uppercase">{formatRelativeTime(req.requestedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => respond(req.id, true)}
                className="rounded-lg bg-green-600/90 px-3 py-1.5 font-body text-[11px] font-bold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
              >
                {pendingId === req.id ? "جارٍ..." : "موافقة"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => respond(req.id, false)}
                className="rounded-lg border border-live/30 bg-live/10 px-3 py-1.5 font-body text-[11px] font-bold text-live transition-colors hover:bg-live/20 disabled:opacity-50"
              >
                رفض
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <div className="border-t border-line px-4 py-2 font-body text-[11px] text-live">{error}</div>}
    </div>
  );
}