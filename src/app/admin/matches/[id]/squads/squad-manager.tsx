"use client";

import { useState, useTransition } from "react";
import { ImageDisplay } from "@/components/ui/image-display";
import { setTeamSquad, setTeamLineup, confirmTeamSquad } from "@/lib/actions/matches";
import type { MatchSquadAdminVM, TeamRosterPlayerVM } from "@/lib/data/matches";

const POSITION_LABELS: Record<string, string> = { GOALKEEPER: "حارس مرمى", DEFENDER: "مدافع", MIDFIELDER: "لاعب وسط", FORWARD: "مهاجم" };
const STATUS_LABELS: Record<string, string> = { PENDING: "قيد الانتظار", CONFIRMED: "مؤكدة", ABSENT: "غائبة" };
const STATUS_COLORS: Record<string, string> = { PENDING: "badge-muted", CONFIRMED: "badge-success", ABSENT: "badge-live" };

interface SquadManagerProps {
  matchId: string;
  side: "home" | "away";
  team: { id: string; name: string; crestUrl: string | null };
  initialSquad: MatchSquadAdminVM | null;
  roster: TeamRosterPlayerVM[];
}

export function SquadManager({ matchId, side, team, initialSquad, roster }: SquadManagerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSquad?.players.map((p) => p.playerId) ?? []));
  const [starterIds, setStarterIds] = useState<Set<string>>(() => new Set(initialSquad?.players.filter((p) => p.isStarter).map((p) => p.playerId) ?? []));
  const [status, setStatus] = useState<string>(initialSquad?.status ?? "PENDING");
  const [squadId, setSquadId] = useState<string | null>(initialSquad?.squadId ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const starters = starterIds.size;
  const squadSize = selectedIds.size;
  const subs = squadSize - starters;
  const isXIComplete = starters === 11;

  function togglePlayer(playerId: string) {
    setError(null); setSaved(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) { next.delete(playerId); setStarterIds((p) => { const ns = new Set(p); ns.delete(playerId); return ns; }); }
      else { if (next.size >= 20) { setError("وصلت الحد الأقصى 20 لاعبًا."); return prev; } next.add(playerId); }
      return next;
    });
  }

  function toggleStarter(playerId: string) {
    setError(null); setSaved(false);
    setStarterIds((prev) => { const next = new Set(prev); if (next.has(playerId)) next.delete(playerId); else { if (next.size >= 11) { setError("وصلت الحد الأقصى 11 لاعبًا أساسيًا."); return prev; } next.add(playerId); } return next; });
  }

  function selectAll() { setError(null); setSaved(false); const ids = roster.map((p) => p.id); if (ids.length > 20) { setError("لا يمكن اختيار أكثر من 20 لاعبًا."); return; } setSelectedIds(new Set(ids)); }
  function clearAll() { setSelectedIds(new Set()); setStarterIds(new Set()); setError(null); setSaved(false); }

  async function handleSave() {
    setError(null); setSaved(false);
    const playerIds = [...selectedIds];
    const result = await setTeamSquad(matchId, team.id, playerIds);
    if (!result.ok) { setError(result.error ?? "خطأ غير معروف."); return; }
    const currentSquadId = result.squadId ?? squadId;
    if (currentSquadId) setSquadId(currentSquadId);
    const lineupResult = await setTeamLineup(currentSquadId ?? "", [...starterIds]);
    if (!lineupResult.ok && currentSquadId) { setError(lineupResult.error ?? "خطأ في حفظ التشكيلة."); return; }
    setSaved(true);
  }

  async function handleConfirm(newStatus: "CONFIRMED" | "PENDING" | "ABSENT") {
    setError(null); setSaved(false);
    let currentSquadId = squadId;
    if (!currentSquadId) { const result = await setTeamSquad(matchId, team.id, [...selectedIds]); if (!result.ok) { setError(result.error ?? "خطأ غير معروف."); return; } currentSquadId = result.squadId ?? null; if (currentSquadId) setSquadId(currentSquadId); }
    if (!currentSquadId) { setError("يجب حفظ القائمة أولاً."); return; }
    const confirmResult = await confirmTeamSquad(currentSquadId, newStatus);
    if (!confirmResult.ok) { setError(confirmResult.error ?? "خطأ في التأكيد."); return; }
    setStatus(newStatus); setSaved(true);
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImageDisplay src={team.crestUrl} alt={team.name} type="team-logo" size="sm" shortCode={team.name.slice(0, 3)} />
          <h2 className="font-display text-lg font-black text-text">{team.name}</h2>
        </div>
        <span className={STATUS_COLORS[status] ?? "badge-muted"}>{STATUS_LABELS[status] ?? status}</span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-line bg-surface-elevated/50 p-3">
          <div className="font-num text-xl font-bold text-accent">{squadSize}<span className="text-xs text-text-dim">/20</span></div>
          <div className="font-utility text-[9px] tracking-wider text-text-dimmer uppercase">قائمة المباراة</div>
        </div>
        <div className="rounded-lg border border-line bg-surface-elevated/50 p-3">
          <div className={`font-num text-xl font-bold ${isXIComplete ? "text-emerald-400" : "text-amber-400"}`}>{starters}<span className="text-xs text-text-dim">/11</span></div>
          <div className="font-utility text-[9px] tracking-wider text-text-dimmer uppercase">الأساسيون</div>
        </div>
        <div className="rounded-lg border border-line bg-surface-elevated/50 p-3">
          <div className="font-num text-xl font-bold text-blue-400">{subs}<span className="text-xs text-text-dim">/9</span></div>
          <div className="font-utility text-[9px] tracking-wider text-text-dimmer uppercase">البدلاء</div>
        </div>
      </div>

      {!isXIComplete && squadSize > 0 && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center font-body text-xs text-amber-400">
          التشكيلة الأساسية غير مكتملة ({starters}/11)
        </div>
      )}

      {error && <div className="mb-3 rounded-lg border border-live/30 bg-live/10 px-3 py-2 text-center font-body text-xs text-live">{error}</div>}
      {saved && <div className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-center font-body text-xs text-emerald-400">تم الحفظ بنجاح</div>}

      <div className="mb-3 flex items-center gap-2">
        <button onClick={selectAll} className="btn-secondary text-xs px-3 py-1.5">تحديد الكل</button>
        <button onClick={clearAll} className="btn-secondary text-xs px-3 py-1.5">مسح الكل</button>
      </div>

      <div className="mb-4 max-h-80 overflow-y-auto rounded-lg border border-line">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-surface-elevated">
            <tr className="border-b border-line">
              <th className="px-3 py-2 font-utility text-[9px] tracking-wider text-text-dimmer uppercase">#</th>
              <th className="px-3 py-2 font-utility text-[9px] tracking-wider text-text-dimmer uppercase">اللاعب</th>
              <th className="px-3 py-2 font-utility text-[9px] tracking-wider text-text-dimmer uppercase">المركز</th>
              <th className="px-3 py-2 text-center font-utility text-[9px] tracking-wider text-text-dimmer uppercase">قائمة</th>
              <th className="px-3 py-2 text-center font-utility text-[9px] tracking-wider text-text-dimmer uppercase">أساسي</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((player, idx) => {
              const inSquad = selectedIds.has(player.id);
              const isStarter = starterIds.has(player.id);
              return (
                <tr key={player.id} className={`border-b border-line/50 ${inSquad ? "bg-accent/[0.03]" : ""} hover:bg-surface-elevated/50 transition-colors`}>
                  <td className="px-3 py-2 font-num text-text-dim">{player.jerseyNumber ?? idx + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ImageDisplay src={player.photoUrl} alt={player.name} type="player" size="xs" />
                      <span className="font-body text-text">{player.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-body text-text-dim">{POSITION_LABELS[player.position] ?? player.position}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => togglePlayer(player.id)} className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${inSquad ? "border-accent bg-accent text-[#0b1220]" : "border-line bg-transparent text-text-dim hover:border-accent/50"}`}>
                      {inSquad && <svg className="h-4 w-4" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2.5 6l2.5 2.5 4.5-5" /></svg>}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => inSquad && toggleStarter(player.id)} disabled={!inSquad} className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${isStarter ? "border-emerald-400 bg-emerald-400 text-bg" : inSquad ? "border-line bg-transparent text-text-dim hover:border-emerald-400/50" : "border-line/30 bg-transparent text-text-dimmer cursor-not-allowed"}`}>
                      {isStarter && <svg className="h-4 w-4" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2.5 6l2.5 2.5 4.5-5" /></svg>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => handleSave()} disabled={isPending} className="btn-primary px-4 py-2 text-sm">
          {isPending ? "جارٍ الحفظ..." : "حفظ القائمة"}
        </button>
        <button onClick={() => handleConfirm("CONFIRMED")} disabled={isPending || status === "CONFIRMED"} className="rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2 font-body text-sm font-bold text-white transition-colors disabled:opacity-50">
          تأكيد الحضور
        </button>
        <button onClick={() => handleConfirm("PENDING")} disabled={isPending || status === "PENDING"} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">
          قيد الانتظار
        </button>
        <button onClick={() => handleConfirm("ABSENT")} disabled={isPending || status === "ABSENT"} className="btn-secondary px-4 py-2 text-sm text-live border-live/30 hover:bg-live/10 disabled:opacity-50">
          غياب
        </button>
      </div>
    </div>
  );
}
