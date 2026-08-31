"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  status: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
};

const LIVE_STATUSES = new Set(["LIVE", "HALFTIME"]);
const POLL_MS = 8000;

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "مجدولة",
  LIVE: "مباشر الآن",
  HALFTIME: "الشوط الأول انتهى",
  FINISHED: "انتهت",
  POSTPONED: "مؤجلة",
  CANCELLED: "ملغاة",
};

/**
 * Client-driven live chip. Polls /api/live every few seconds and updates
 * the score / minute / status in place without a page reload. The initial
 * value is rendered server-side, so the markup stays identical to the
 * static version for the first paint.
 */
export function LiveMatchUI({
  matchId,
  initial,
  role,
  variant = "banner",
}: {
  matchId: string;
  initial: Snapshot;
  role: "pill" | "score";
  variant?: "banner" | "hero";
}) {
  const [snap, setSnap] = useState(initial);

  useEffect(() => {
    let disposed = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/live?id=${encodeURIComponent(matchId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: Snapshot = await res.json();
        if (!disposed) setSnap(data);
      } catch {
        // Keep the last known state on transient errors.
      }
    };
    const interval = setInterval(tick, POLL_MS);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [matchId]);

  if (role === "score") {
    return (
      <>
        <div className="font-num text-4xl sm:text-5xl lg:text-6xl font-bold text-text score-live tabular-nums">
          {snap.homeScore}
          <span className="mx-1.5 sm:mx-2 text-xl sm:text-2xl text-text-dimmer">-</span>
          {snap.awayScore}
        </div>
        {snap.minute !== null && LIVE_STATUSES.has(snap.status) && (
          <div className="rounded bg-surface-elevated px-2.5 py-0.5 font-num text-[11px] font-bold text-text-dim border border-line">
            {snap.minute}&#39;
          </div>
        )}
      </>
    );
  }

  const live = LIVE_STATUSES.has(snap.status);
  const isLive = snap.status === "LIVE";

  if (variant === "hero") {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-body text-[10px] font-bold ${
          isLive ? "badge-live" : snap.status === "HALFTIME" ? "badge-accent" : "badge-muted"
        }`}
      >
        {isLive && <span className="ml-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-live inline-block" />}
        {STATUS_LABELS[snap.status] ?? "مباشر"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-utility text-[10px] tracking-[0.15em] uppercase ${
        live ? "border-live/25 bg-live/8 text-live" : "border-line bg-surface-elevated/40 text-text-dimmer"
      }`}
    >
      {live && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
        </span>
      )}
      <span className={isLive ? "live-word" : ""}>{STATUS_LABELS[snap.status] ?? "مباشر الآن"}</span>
    </span>
  );
}