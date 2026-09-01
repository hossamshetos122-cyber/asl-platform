"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  autoRatePlayer,
  deleteTeamOfTheWeek,
  saveTeamOfTheWeek,
} from "@/lib/actions/team-of-week";
import { DEFAULT_FORMATION, FORMATIONS, getFormationSlots } from "@/lib/formations";
import { LINEUP_SIZE } from "@/lib/team-of-week";
import { TOTWCard } from "@/components/ui/totw-card";
import { ImageDisplay } from "@/components/ui/image-display";
import type { TOTWCandidateVM } from "@/lib/types";

interface SlotState {
  playerId: string | null;
  rating: number | null;
  captain: boolean;
}

interface LatestWeekProps {
  id: string;
  weekLabel: string;
  weekStart: Date | null;
  weekEnd: Date | null;
  formation: string;
  tournamentId: string;
  slots: { playerId: string; positionSlot: string; captain: boolean }[];
}

interface HistoryEntryProps {
  id: string;
  weekLabel: string;
  formation: string;
  createdAt: Date;
  slotCount: number;
}

interface TeamOfWeekFormProps {
  tournaments: { id: string; name: string; status: string }[];
  featuredTournamentId: string | null;
  candidates: TOTWCandidateVM[];
  formations: string[];
  latestWeek: LatestWeekProps | null;
  history: HistoryEntryProps[];
}

const EMPTY_SLOT: SlotState = { playerId: null, rating: null, captain: false };

function toDateInput(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function currentWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function fmtShort(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

function defaultWeekLabel() {
  const { start, end } = currentWeekRange();
  return `فريق الأسبوع ${fmtShort(start)} – ${fmtShort(end)}`;
}

function buildInitialSlots(
  formation: string,
  latestWeek: LatestWeekProps | null,
  candidates: TOTWCandidateVM[]
): Record<string, SlotState> {
  const slots: Record<string, SlotState> = {};
  const candidateMap = new Map(candidates.map((c) => [c.playerId, c]));
  for (const def of getFormationSlots(formation)) {
    slots[def.key] = { ...EMPTY_SLOT };
  }
  if (latestWeek && latestWeek.formation === formation) {
    for (const s of latestWeek.slots) {
      if (s.positionSlot in slots) {
        slots[s.positionSlot] = {
          playerId: s.playerId,
          rating: candidateMap.get(s.playerId)?.rating ?? null,
          captain: s.captain,
        };
      }
    }
  }
  return slots;
}

export function TeamOfWeekForm({
  tournaments,
  featuredTournamentId,
  candidates,
  formations,
  latestWeek,
  history,
}: TeamOfWeekFormProps) {
  const router = useRouter();
  const initial = latestWeek ? `${latestWeek.tournamentId}` : featuredTournamentId ?? tournaments[0]?.id ?? "";

  const [tournamentId, setTournamentId] = useState(initial);
  const [weekLabel, setWeekLabel] = useState(latestWeek?.weekLabel ?? defaultWeekLabel());
  const initialRange = latestWeek
    ? { start: latestWeek.weekStart, end: latestWeek.weekEnd }
    : currentWeekRange();
  const [weekStart, setWeekStart] = useState(toDateInput(initialRange.start));
  const [weekEnd, setWeekEnd] = useState(toDateInput(initialRange.end));
  const [formation, setFormation] = useState(latestWeek?.formation ?? DEFAULT_FORMATION);
  const [slots, setSlots] = useState<Record<string, SlotState>>(() =>
    buildInitialSlots(latestWeek?.formation ?? DEFAULT_FORMATION, latestWeek, candidates)
  );
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [autoLoading, setAutoLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const formationBands = useMemo(
    () => [...FORMATIONS.find((f) => f.key === formation)!.bands].sort((a, b) => b.band - a.band),
    [formation]
  );
  const formationSlotDefs = useMemo(() => getFormationSlots(formation), [formation]);

  const candidateMap = useMemo(() => new Map(candidates.map((c) => [c.playerId, c])), [candidates]);
  const teamNames = useMemo(
    () => [...new Map(candidates.map((c) => [c.teamId, c.teamName])).values()].sort(),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return candidates.filter((c) => {
      if (teamFilter && c.teamId !== teamFilter) return false;
      if (query && !c.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [candidates, search, teamFilter]);

  function openPicker(slotKey: string) {
    setPickerSlot(slotKey);
    setSearch("");
    setTeamFilter("");
  }

  function assignPlayer(slotKey: string, playerId: string) {
    setSlots((prev) => {
      const next: Record<string, SlotState> = {};
      for (const key of Object.keys(prev)) {
        const val = prev[key] ?? EMPTY_SLOT;
        next[key] = val.playerId === playerId ? { ...val, playerId: null, rating: null, captain: false } : { ...val };
      }
      next[slotKey] = {
        playerId,
        rating: candidateMap.get(playerId)?.rating ?? null,
        captain: false,
      };
      return next;
    });
    setPickerSlot(null);
  }

  function setRating(slotKey: string, raw: string) {
    const parsed = Number(raw);
    const rating =
      raw === "" || Number.isNaN(parsed) ? null : Math.max(0, Math.min(100, Math.round(parsed)));
    setSlots((prev) => ({ ...prev, [slotKey]: { ...(prev[slotKey] ?? EMPTY_SLOT), rating } }));
  }

  function toggleCaptain(slotKey: string) {
    setSlots((prev) => {
      const isCaptain = (prev[slotKey] ?? EMPTY_SLOT).captain;
      const next: Record<string, SlotState> = {};
      for (const key of Object.keys(prev)) {
        const base = prev[key] ?? EMPTY_SLOT;
        next[key] = key === slotKey ? { ...base, captain: !isCaptain } : { ...base, captain: false };
      }
      return next;
    });
  }

  function removePlayer(slotKey: string) {
    setSlots((prev) => ({ ...prev, [slotKey]: { playerId: null, rating: null, captain: false } }));
  }

  function handleFormationChange(next: string) {
    setFormation(next);
    setSlots((prev) => {
      const nextSlots: Record<string, SlotState> = {};
      for (const def of getFormationSlots(next)) {
        nextSlots[def.key] = prev[def.key] ?? { ...EMPTY_SLOT };
      }
      return nextSlots;
    });
    setMessage({ ok: true, text: "اتبدلت التشكيلة — الخانات اللي مركزها موجود فضل محفوظ." });
  }

  function handleAutoRate(slotKey: string, playerId: string) {
    setAutoLoading(slotKey);
    startTransition(async () => {
      const res = await autoRatePlayer(playerId);
      setAutoLoading(null);
      if (res.ok) {
        setSlots((prev) => ({ ...prev, [slotKey]: { ...(prev[slotKey] ?? EMPTY_SLOT), rating: res.rating } }));
        setMessage({ ok: true, text: `اتحسب التقييم تلقائيًا: ${res.rating}` });
      } else {
        setMessage({ ok: false, text: res.error ?? "تعذّر حساب التقييم." });
      }
    });
  }

  function handleSave() {
    setMessage(null);
    const slotAt = (key: string) => slots[key] ?? EMPTY_SLOT;
    const emptyKey = formationSlotDefs.find((def) => !slotAt(def.key).playerId);
    if (emptyKey) {
      setMessage({ ok: false, text: `خانة "${emptyKey.label}" بدون لاعب — كمّل قبل ما تحفظ.` });
      return;
    }
    const chosen = new Set(formationSlotDefs.map((def) => slotAt(def.key).playerId));
    if (chosen.size !== LINEUP_SIZE) {
      setMessage({ ok: false, text: "لا يجوز تكرار نفس اللاعب في التشكيلة." });
      return;
    }
    if (!tournamentId) {
      setMessage({ ok: false, text: "اختر البطولة." });
      return;
    }

    startTransition(async () => {
      const res = await saveTeamOfTheWeek({
        tournamentId,
        weekLabel,
        weekStart: weekStart || null,
        weekEnd: weekEnd || null,
        formation,
        slots: formationSlotDefs.map((def) => ({
          playerId: slotAt(def.key).playerId!,
          positionSlot: def.key,
          captain: slotAt(def.key).captain,
        })),
        ratings: formationSlotDefs
          .filter((def) => slotAt(def.key).rating !== null)
          .map((def) => ({ playerId: slotAt(def.key).playerId!, rating: slotAt(def.key).rating })),
      });
      if (res.ok) {
        setMessage({ ok: true, text: "تم حفظ فريق الأسبوع بنجاح." });
        router.refresh();
      } else {
        setMessage({ ok: false, text: res.error ?? "حدث خطأ." });
      }
    });
  }

  function handleDeleteHistory(id: string) {
    if (!window.confirm("متأكد إنك تمسح فريق الأسبوع ده؟")) return;
    startTransition(async () => {
      const res = await deleteTeamOfTheWeek(id);
      if (res.ok) {
        if (id === latestWeek?.id) {
          setSlots(buildInitialSlots(formation, null, candidates));
        }
        setMessage({ ok: true, text: "تم حذف فريق الأسبوع." });
        router.refresh();
      } else {
        setMessage({ ok: false, text: res.error ?? "حدث خطأ." });
      }
    });
  }

  const pickerSlotDef = pickerSlot ? formationSlotDefs.find((d) => d.key === pickerSlot) : null;

  return (
    <div className="space-y-5">
      {message && (
        <div
          className={`rounded-lg border px-4 py-2 font-body text-[12px] ${
            message.ok ? "border-success/30 bg-success/10 text-success" : "border-live/30 bg-live/10 text-live"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface">
        <div className="grid grid-cols-1 gap-4 border-b border-line p-5 lg:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">البطولة</label>
            <select
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            >
              {tournaments.length === 0 && <option value="">لا توجد بطولات</option>}
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.status === "ONGOING" ? "— جارية" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">التشكيلة</label>
            <select
              value={formation}
              onChange={(e) => handleFormationChange(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm font-bold text-accent-bright outline-none transition-colors focus:border-accent"
            >
              {formations.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم الأسبوع</label>
            <input
              type="text"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">من</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">إلى</label>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-[#123a29] via-[#0c2b1f] to-[#081f16] p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-2">
              <span className="font-utility text-[10px] tracking-[0.25em] text-success uppercase">{formation}</span>
              <span className="h-px flex-1 bg-white/10" />
              <span className="font-utility text-[9px] tracking-[0.2em] text-white/40 uppercase">TOTW XI</span>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-x-[8%] top-1/2 hidden h-24 w-24 -translate-y-1/2 rounded-full border border-white/10 sm:block" />
              <div className="pointer-events-none absolute inset-x-[5%] top-0 bottom-0 hidden border-y border-white/10 sm:block" />

              <div className="relative space-y-4 sm:space-y-5">
                {formationBands.map((band) => (
                  <div key={band.band} className="flex flex-wrap items-start justify-center gap-2 sm:gap-3">
                    {band.slots.map((def) => {
                      const slot = slots[def.key] ?? EMPTY_SLOT;
                      const player = slot.playerId ? candidateMap.get(slot.playerId) : undefined;
                      return (
                        <div key={def.key} className="flex w-[104px] flex-col items-center sm:w-[112px]">
                          {player ? (
                            <button
                              type="button"
                              onClick={() => openPicker(def.key)}
                              className="w-full text-left"
                              title="اضغط لتغيير اللاعب"
                            >
                              <TOTWCard
                                name={player.name}
                                photoUrl={player.photoUrl}
                                jerseyNumber={player.jerseyNumber}
                                rating={slot.rating ?? player.rating ?? 0}
                                crestUrl={player.crestUrl}
                                shortName={player.shortName}
                                teamName={player.teamName}
                                captain={slot.captain}
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openPicker(def.key)}
                              className="flex h-[128px] w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-white/20 bg-white/5 text-white/50 transition-colors hover:border-accent/50 hover:bg-accent/10 hover:text-accent-bright"
                            >
                              <span className="font-num text-xl leading-none font-black">+</span>
                              <span className="font-body text-[9px] font-bold">{def.label}</span>
                            </button>
                          )}

                          <p className="mt-1 font-utility text-[8px] tracking-[0.15em] text-white/40 uppercase">
                            {def.label}
                          </p>

                          {player && (
                            <div className="mt-1 w-full space-y-1">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={slot.rating ?? ""}
                                  placeholder="ـ"
                                  onChange={(e) => setRating(def.key, e.target.value)}
                                  className="h-11 w-12 rounded border border-line bg-bg px-1 text-center font-num text-[12px] font-black text-text outline-none transition-colors focus:border-accent"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAutoRate(def.key, player.playerId)}
                                  disabled={autoLoading === def.key}
                                  className="min-h-11 flex-1 rounded border border-accent/30 bg-accent/10 px-1 font-body text-[10px] font-black text-accent-bright transition-colors hover:bg-accent/20"
                                >
                                  {autoLoading === def.key ? "..." : "تلقائي"}
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleCaptain(def.key)}
                                  className={`h-11 w-11 rounded font-display text-[11px] font-black transition-colors ${
                                    slot.captain ? "bg-accent text-white" : "border border-line bg-surface-elevated text-text-dimmer hover:text-text"
                                  }`}
                                  title="كابتن"
                                >
                                  C
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removePlayer(def.key)}
                                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-live/30 bg-live/10 font-num text-sm font-black text-live transition-colors hover:bg-live/20"
                                  title="مسح"
                                >
                                  ×
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openPicker(def.key)}
                                  className="min-h-11 w-full rounded border border-line bg-surface-elevated font-body text-[11px] font-bold text-text-dim transition-colors hover:text-text"
                                >
                                  تبديل
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button onClick={handleSave} disabled={isPending} className="btn-primary">
              {isPending ? "جارٍ الحفظ..." : "حفظ فريق الأسبوع"}
            </button>
            <span className="font-body text-[11px] text-text-dimmer">
              {formationSlotDefs.filter((d) => slots[d.key]?.playerId).length} / {LINEUP_SIZE} لاعب
            </span>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-display text-sm font-black text-text">سجل الأسابيع</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-right">
              <thead>
                <tr className="border-b border-line font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">
                  <th className="px-2 py-2">الأسبوع</th>
                  <th className="px-2 py-2">التشكيلة</th>
                  <th className="px-2 py-2">اللاعبون</th>
                  <th className="px-2 py-2">تاريخ الحفظ</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {history.map((h) => (
                  <tr key={h.id} className="transition-colors hover:bg-surface-elevated/50">
                    <td className="px-2 py-2 font-body text-[12px] font-bold text-text">
                      {h.weekLabel}
                      {h.id === latestWeek?.id && (
                        <span className="mr-2 text-[9px] font-black text-accent-bright">الحالي</span>
                      )}
                    </td>
                    <td className="px-2 py-2 font-num text-[12px] font-black text-accent-bright" dir="ltr">{h.formation}</td>
                    <td className="px-2 py-2 font-num text-[12px] text-text-dim">{h.slotCount}</td>
                    <td className="px-2 py-2 font-num text-[11px] text-text-dimmer">
                      {h.createdAt.toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => handleDeleteHistory(h.id)}
                        disabled={isPending}
                        className="rounded-lg border border-live/30 px-2.5 font-body text-[10px] font-bold text-live transition-colors hover:bg-live/10 min-h-11"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pickerSlotDef && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPickerSlot(null)}
        >
          <div
            className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-deep"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h3 className="font-display text-sm font-black text-text">اختر لاعب</h3>
                <p className="mt-0.5 font-body text-[11px] text-text-dimmer">
                  {pickerSlotDef.label} — {formation}
                </p>
              </div>
              <button
                onClick={() => setPickerSlot(null)}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-line font-num text-sm text-text-dim transition-colors hover:text-text"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
              <input
                type="text"
                placeholder="ابحث بالاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full flex-1 rounded-lg border border-line bg-bg px-3 py-2 font-body text-sm text-text outline-none transition-colors focus:border-accent"
              />
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-body text-sm text-text outline-none transition-colors focus:border-accent sm:w-52"
              >
                <option value="">كل الفرق</option>
                {teamNames.map((name) => (
                  <option key={name} value={candidates.find((c) => c.teamName === name)?.teamId}>{name}</option>
                ))}
              </select>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto p-4 sm:grid-cols-2">
              {filteredCandidates.length === 0 && (
                <p className="col-span-full py-6 text-center font-body text-sm text-text-dim">لا يوجد لاعبين مطابقين.</p>
              )}
              {filteredCandidates.map((c) => {
                const taken = formationSlotDefs.some(
                  (d) => d.key !== pickerSlot && slots[d.key]?.playerId === c.playerId
                );
                return (
                  <button
                    key={c.playerId}
                    onClick={() => pickerSlot && assignPlayer(pickerSlot, c.playerId)}
                    disabled={taken}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 text-right transition-colors ${
                      taken
                        ? "cursor-not-allowed border-line bg-bg opacity-40"
                        : "border-line bg-bg hover:border-accent/40 hover:bg-surface-elevated"
                    }`}
                  >
                    <ImageDisplay src={c.photoUrl} alt={c.name} type="player" size="sm" shortCode={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-[12px] font-bold text-text">{c.name}</p>
                      <p className="truncate font-body text-[10px] text-text-dim">
                        {c.teamName}
                        {c.jerseyNumber ? ` — #${c.jerseyNumber}` : ""}
                      </p>
                    </div>
                    <span className="rounded-md bg-surface-elevated px-1.5 py-0.5 font-num text-[12px] font-black text-accent-bright">
                      {c.rating ?? "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}