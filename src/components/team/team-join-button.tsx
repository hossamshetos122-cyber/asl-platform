"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { requestTeamJoin } from "@/lib/actions/players";

/**
 * Self-service "انضم لهذا الفريق" button. States:
 * - requires login   -> link to /login with redirect back
 * - already ACTIVE   -> hidden (member badge instead)
 * - already PENDING  -> "قيد المراجعة"
 * - otherwise        -> request button
 */
export function TeamJoinButton({
  teamId,
  viewerStatus,
}: {
  teamId: string;
  viewerStatus: "ACTIVE" | "PENDING" | "NONE";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (viewerStatus === "ACTIVE") return null;

  if (viewerStatus === "PENDING" || sent) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 font-body text-[12px] font-bold text-amber-300">
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8h-1m4 0h-1M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><circle cx="8.5" cy="7" r="4" />
        </svg>
        طلبك قيد المراجعة
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await requestTeamJoin(teamId);
            if (res.success) {
              setSent(true);
              router.refresh();
            } else {
              setError(res.error ?? "حدث خطأ");
            }
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 font-body text-[12px] font-extrabold text-white transition-all hover:bg-accent-bright active:scale-[0.98] disabled:opacity-50"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8h-1m4 0h-1M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><circle cx="8.5" cy="7" r="4" />
        </svg>
        {pending ? "جارٍ الإرسال..." : "قدّم طلب انضمام"}
      </button>
      {error && <p className="mt-2 font-body text-[11px] text-live">{error}</p>}
    </div>
  );
}

export function LoginToJoinButton({ redirectTo }: { redirectTo: string }) {
  return (
    <Link
      href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 font-body text-[12px] font-bold text-accent transition-colors hover:bg-accent/20"
    >
      سجّل الدخول للتقديم على الانضمام للفريق
    </Link>
  );
}