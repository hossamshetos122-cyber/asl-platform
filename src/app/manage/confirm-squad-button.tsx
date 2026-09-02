"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmTeamSquad } from "@/lib/actions/matches";

export function ConfirmSquadButton({ squadId, status, label }: {
  squadId: string;
  status: "CONFIRMED" | "PENDING" | "ABSENT";
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const result = await confirmTeamSquad(squadId, status);
            if (!result.ok) setError(result.error || "حدث خطأ");
            else router.refresh();
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "حدث خطأ");
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-lg bg-accent px-3 py-1.5 font-body text-[11px] font-bold text-[#0b1220] transition-colors hover:bg-accent-bright disabled:opacity-50"
      >
        {busy ? "جارٍ..." : label}
      </button>
      {error && <span className="font-body text-[10px] text-live">{error}</span>}
    </div>
  );
}