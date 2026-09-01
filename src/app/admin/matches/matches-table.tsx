"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createMatch, setMatchResult, setMatchResultWithGoals, updateMatchSchedule, deleteMatch } from "@/lib/actions/matches";
import { formatMatchDateTime } from "@/lib/dates";
import { ImageUpload } from "@/components/ui/image-upload";
import { SearchInput } from "@/components/ui/search-input";
import { normalizeArabic } from "@/lib/search";

export interface GoalPlayerOption {
  id: string;
  name: string;
  jerseyNumber: number | null;
}

export type EventType = "GOAL" | "ASSIST" | "YELLOW_CARD" | "RED_CARD";

export interface EventLite {
  playerId: string;
  teamId: string;
  type: EventType;
}

interface MatchRow {
  id: string;
  status: string;
  kickoffAt: string;
  venue: string | null;
  venueImageUrl: string | null;
  round: string | null;
  homeScore: number;
  awayScore: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { name: string; shortName: string };
  awayTeam: { name: string; shortName: string };
  tournament: { name: string; id: string };
}

interface TeamOption { id: string; name: string; }
interface TournamentOption { id: string; name: string; }

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "جارِ الحفظ..." : "حفظ"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} onClick={(e) => { if (!confirm("هل أنت متأكد من حذف المباراة؟")) e.preventDefault(); }} className="btn-danger-outline">
      {pending ? "..." : "حذف"}
    </button>
  );
}

const STATUS_LABELS: Record<string, string> = { SCHEDULED: "مجدولة", LIVE: "مباشر", HALFTIME: "استراحة", FINISHED: "انتهت", POSTPONED: "مؤجلة", CANCELLED: "ملغاة" };
const STATUS_COLORS: Record<string, string> = { SCHEDULED: "badge-muted", LIVE: "badge-live", HALFTIME: "badge-live", FINISHED: "badge-success", POSTPONED: "badge-muted", CANCELLED: "badge-live" };

const SCHEDULE_STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "مجدولة" },
  { value: "POSTPONED", label: "مؤجلة" },
  { value: "CANCELLED", label: "ملغاة" },
] as const;

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const isOverdueMatch = (m: { status: string; kickoffAt: string }) =>
  (m.status === "SCHEDULED" || m.status === "POSTPONED") &&
  new Date(m.kickoffAt).getTime() < Date.now();

function InlineCreateForm({ teams, tournaments, referees }: { teams: TeamOption[]; tournaments: TournamentOption[]; referees: { id: string; fullName: string }[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venueImage, setVenueImage] = useState<string | null>(null);

  if (!isAdding) {
    return (
      <button onClick={() => setIsAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-5 py-2.5 font-body text-[12px] font-bold text-accent transition-all hover:bg-accent/20">
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
        إضافة مباراة
      </button>
    );
  }

  return (
    <form action={async (formData) => {
      setError(null);
      try {
        formData.set("venueImageUrl", venueImage || "");
        await createMatch(formData);
        setIsAdding(false);
        window.location.reload();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "حدث خطأ");
      }
    }} className="rounded-xl border border-accent/20 bg-surface p-5">
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">البطولة</label>
          <select name="tournamentId" required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent">
            <option value="">اختر البطولة</option>
            {tournaments.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الفريق المضيف</label>
          <select name="homeTeamId" required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent">
            <option value="">اختر الفريق</option>
            {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الفريق الضيف</label>
          <select name="awayTeamId" required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent">
            <option value="">اختر الفريق</option>
            {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">تاريخ ووقت البداية</label>
          <input type="datetime-local" name="kickoffAt" required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent" />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الملعب <span className="text-live">*</span></label>
          <input name="venue" required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent" placeholder="استاد الإسكندرية" />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <ImageUpload name="venueImageUrl" purpose="general" label="صورة الملعب (اختياري)" value={venueImage} onChange={setVenueImage} />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الجولة</label>
          <input name="round" className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent" placeholder="الأسبوع 1" />
        </div>
        {referees.length > 0 && (
          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الحكم (اختياري)</label>
            <select name="refereeId" className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent">
              <option value="">بدون إسناد</option>
              {referees.map((r) => (<option key={r.id} value={r.id}>{r.fullName}</option>))}
            </select>
          </div>
        )}
      </div>
      {error && <div className="mb-4 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">{error}</div>}
      <div className="flex items-center gap-3">
        <SubmitButton />
        <button type="button" onClick={() => { setIsAdding(false); setError(null); }} className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text">إلغاء</button>
      </div>
    </form>
  );
}

function playerLabel(p: GoalPlayerOption): string {
  return p.jerseyNumber !== null ? `${p.name} — ${p.jerseyNumber}` : p.name;
}

function PlayerPickerSheet({ title, options, onSelect, onClose }: {
  title: string;
  options: GoalPlayerOption[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.jerseyNumber !== null && String(p.jerseyNumber).includes(q))
      )
    : options;

  return (
    <div className="fixed inset-0 z-50 lg:absolute">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-hidden rounded-t-2xl border-t border-line bg-surface shadow-2xl lg:inset-x-auto lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:w-[420px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-body text-sm font-bold text-text">{title}</span>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="btn-icon font-body text-lg text-text-dim transition-colors hover:bg-surface-elevated hover:text-text">×</button>
        </div>
        <div className="border-b border-line p-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو رقم القميص..."
            className="input-field !py-3"
          />
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center font-body text-[13px] text-text-dimmer">لا يوجد لاعبون مطابقون.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-right font-body text-[14px] font-bold text-text transition-colors hover:bg-surface-elevated"
                >
                  <span className="truncate">{p.name}</span>
                  {p.jerseyNumber !== null && <span className="font-num text-[12px] text-text-dim">{p.jerseyNumber}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function GoalAssignPanel({ match, prefix, homePlayers, awayPlayers, existingHome, existingAway, existingHomeAssists, existingAwayAssists, existingHomeYellow, existingAwayYellow, existingHomeRed, existingAwayRed, onClose }: {
  match: MatchRow;
  prefix: string;
  homePlayers: GoalPlayerOption[];
  awayPlayers: GoalPlayerOption[];
  existingHome: string[];
  existingAway: string[];
  existingHomeAssists: string[];
  existingAwayAssists: string[];
  existingHomeYellow: string[];
  existingAwayYellow: string[];
  existingHomeRed: string[];
  existingAwayRed: string[];
  onClose: () => void;
}) {
  const [homeScore, setHomeScore] = useState<number>(match.homeScore);
  const [awayScore, setAwayScore] = useState<number>(match.awayScore);
  const [homeSel, setHomeSel] = useState<string[]>(() =>
    Array.from({ length: Math.max(match.homeScore, 0) }, (_, i) => existingHome[i] ?? "")
  );
  const [awaySel, setAwaySel] = useState<string[]>(() =>
    Array.from({ length: Math.max(match.awayScore, 0) }, (_, i) => existingAway[i] ?? "")
  );
  const [homeAssistSel, setHomeAssistSel] = useState<string[]>(() =>
    Array.from({ length: Math.max(match.homeScore, 0) }, (_, i) => existingHomeAssists[i] ?? "")
  );
  const [awayAssistSel, setAwayAssistSel] = useState<string[]>(() =>
    Array.from({ length: Math.max(match.awayScore, 0) }, (_, i) => existingAwayAssists[i] ?? "")
  );
  const [homeYellowSel, setHomeYellowSel] = useState<string[]>(() => [...existingHomeYellow]);
  const [awayYellowSel, setAwayYellowSel] = useState<string[]>(() => [...existingAwayYellow]);
  const [homeRedSel, setHomeRedSel] = useState<string[]>(() => [...existingHomeRed]);
  const [awayRedSel, setAwayRedSel] = useState<string[]>(() => [...existingAwayRed]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "away">("home");
  const [picker, setPicker] = useState<{ team: "home" | "away"; kind: "goal" | "assist" | "yellow" | "red"; slot: number } | null>(null);

  const resize = (list: string[], n: number, setter: (v: string[]) => void) => {
    if (n === list.length) return;
    if (n > list.length) setter([...list, ...Array.from({ length: n - list.length }, () => "")]);
    else setter(list.slice(0, n));
  };

  useEffect(() => {
  resize(homeSel, homeScore, setHomeSel);
  resize(homeAssistSel, homeScore, setHomeAssistSel);
}, [homeScore]); // eslint-disable-line react-hooks/exhaustive-deps
useEffect(() => {
  resize(awaySel, awayScore, setAwaySel);
  resize(awayAssistSel, awayScore, setAwayAssistSel);
}, [awayScore]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSaveWithGoals =
    (homeScore === 0 || homeSel.every((s) => s !== "")) &&
    (awayScore === 0 || awaySel.every((s) => s !== ""));

  const hasEmptyCard =
    homeYellowSel.some((s) => s === "") ||
    awayYellowSel.some((s) => s === "") ||
    homeRedSel.some((s) => s === "") ||
    awayRedSel.some((s) => s === "");

  const homeList = homePlayers;
  const awayList = awayPlayers;

  const playersFor = (team: "home" | "away") => (team === "home" ? homePlayers : awayPlayers);
  const listFor = (kind: "goal" | "assist" | "yellow" | "red", team: "home" | "away") => {
    if (team === "home") {
      return kind === "goal" ? [homeSel, setHomeSel] as const
        : kind === "assist" ? [homeAssistSel, setHomeAssistSel] as const
        : kind === "yellow" ? [homeYellowSel, setHomeYellowSel] as const
        : [homeRedSel, setHomeRedSel] as const;
    }
    return kind === "goal" ? [awaySel, setAwaySel] as const
      : kind === "assist" ? [awayAssistSel, setAwayAssistSel] as const
      : kind === "yellow" ? [awayYellowSel, setAwayYellowSel] as const
      : [awayRedSel, setAwayRedSel] as const;
  };

  function applyPicker(pid: string) {
    if (!picker) return;
    const [list, setter] = listFor(picker.kind, picker.team);
    const next = [...list];
    if (picker.kind === "goal" || picker.kind === "assist") {
      next[picker.slot] = pid;
    } else {
      // cards: ensure the slot exists (fill an added placeholder)
      while (next.length <= picker.slot) next.push("");
      next[picker.slot] = pid;
    }
    setter(next);
    setPicker(null);
  }

  function removeAtKind(kind: "goal" | "assist" | "yellow" | "red", team: "home" | "away", idx: number) {
    const [, setter] = listFor(kind, team);
    const [list] = listFor(kind, team);
    setter(list.filter((_, i) => i !== idx));
  }

  function addCard(kind: "yellow" | "red", team: "home" | "away") {
    const [list] = listFor(kind, team);
    if (playersFor(team).length === 0) return;
    setPicker({ team, kind, slot: list.length });
  }

  function bumpScore(team: "home" | "away", delta: number) {
    if (team === "home") setHomeScore(Math.max(0, Math.min(30, homeScore + delta)));
    else setAwayScore(Math.max(0, Math.min(30, awayScore + delta)));
  }

  const teamLabel = (team: "home" | "away") => (team === "home" ? match.homeTeam.name : match.awayTeam.name);

  async function save(withEvents: boolean) {
    setSaving(true);
    setError(null);
    try {
      if (withEvents && hasEmptyCard) {
        setError("حدّد لاعباً لكل كارت (أصفر/أحمر) قبل الحفظ، أو احذف الكارت الفارغ");
        setSaving(false);
        return;
      }
      if (withEvents) {
        await setMatchResultWithGoals(
          match.id, homeScore, awayScore, homeSel, awaySel,
          homeYellowSel.filter((s) => s !== ""),
          awayYellowSel.filter((s) => s !== ""),
          homeRedSel.filter((s) => s !== ""),
          awayRedSel.filter((s) => s !== ""),
          homeAssistSel,
          awayAssistSel,
        );
      } else {
        await setMatchResult(match.id, homeScore, awayScore);
      }
      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-body text-[13px] font-bold text-text">
          تسجيل نتيجة {match.homeTeam.name} - {match.awayTeam.name}
        </p>
        <button onClick={onClose} aria-label="إغلاق" className="btn-icon font-body text-lg text-text-dim transition-colors hover:bg-surface-elevated hover:text-text">×</button>
      </div>

      {/* Score steppers for both teams */}
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {(["home", "away"] as const).map((t) => (
          <div key={t} className="rounded-lg border border-line bg-surface-elevated/50 p-2">
            <p className="truncate text-center font-body text-[12px] font-bold text-text">{teamLabel(t)}</p>
            <div className="mt-2 flex items-center justify-center gap-2.5">
              <button type="button" onClick={() => bumpScore(t, -1)} disabled={saving} aria-label="تقليل الهدف"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-xl font-black text-accent transition-colors hover:bg-accent/20 disabled:opacity-40">-</button>
              <span className="w-9 text-center font-num text-2xl font-bold text-text">{t === "home" ? homeScore : awayScore}</span>
              <button type="button" onClick={() => bumpScore(t, 1)} disabled={saving} aria-label="زيادة الهدف"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-xl font-black text-accent transition-colors hover:bg-accent/20 disabled:opacity-40">+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Team tabs */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-elevated/40 p-1">
        {(["home", "away"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setActiveTab(t)}
            className={`min-h-[44px] truncate rounded-lg px-2 font-body text-[13px] font-bold transition-colors ${activeTab === t ? "bg-accent text-white" : "text-text-dim hover:text-text"}`}>
            {teamLabel(t)}
          </button>
        ))}
      </div>

      {(() => {
        const t = activeTab;
        const players = playersFor(t);
        const score = t === "home" ? homeScore : awayScore;
        const goals = t === "home" ? homeSel : awaySel;
        const assists = t === "home" ? homeAssistSel : awayAssistSel;
        const yellows = t === "home" ? homeYellowSel : awayYellowSel;
        const reds = t === "home" ? homeRedSel : awayRedSel;

        return (
          <div className="space-y-4">
            <div>
              <p className="mb-2 font-body text-[12px] font-bold text-accent">أهداف {teamLabel(t)} ({score})</p>
              {players.length === 0 ? (
                <p className="rounded-lg border border-line bg-surface-elevated/40 px-3 py-2 font-body text-[11px] text-text-dim">
                  لا يوجد لاعبون مسجّلون في {teamLabel(t)} — أضف لاعبين من صفحة إدارة اللاعبين.
                </p>
              ) : score === 0 ? (
                <p className="font-body text-[11px] text-text-dimmer">زد النتيجة بالأعلى لتسجيل الأهداف.</p>
              ) : (
                <div className="space-y-2">
                  {Array.from({ length: score }, (_, idx) => {
                    const id = goals[idx] ?? "";
                    const player = players.find((p) => p.id === id);
                    return (
                      <div key={idx} className="flex items-center gap-2 rounded-lg border border-line/60 bg-surface-elevated/40 p-2">
                        <span className="w-6 flex-shrink-0 text-center font-num text-[12px] text-text-dimmer">{idx + 1}</span>
                        <button type="button" onClick={() => setPicker({ team: t, kind: "goal", slot: idx })} disabled={saving}
                          className="min-h-[44px] flex-1 truncate rounded-lg border border-accent/30 bg-bg px-3 text-right font-body text-[13px] font-bold text-text transition-colors hover:border-accent">
                          {player ? playerLabel(player) : "اختر اللاعب"}
                        </button>
                        <button type="button" onClick={() => removeAtKind("goal", t, idx)} disabled={saving} aria-label="إزالة الهدف"
                          className="btn-icon h-11 w-11 flex-shrink-0 border border-live/30 text-live transition-colors hover:bg-live/10">×</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {players.length > 0 && score > 0 && (
                <div className="mt-2 space-y-2 pr-8">
                  {Array.from({ length: score }, (_, idx) => {
                    if (!(goals[idx] ?? "")) return null;
                    const assistId = assists[idx] ?? "";
                    const assister = assistId ? players.find((p) => p.id === assistId) : undefined;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <button type="button" onClick={() => setPicker({ team: t, kind: "assist", slot: idx })} disabled={saving}
                          className="min-h-[44px] flex-1 truncate rounded-lg border border-line bg-surface px-3 text-right font-body text-[12px] font-bold text-text-dim transition-colors hover:border-accent">
                          {assister ? `المساعد: ${playerLabel(assister)}` : `+ صانع الهدف ${idx + 1} (اختياري)`}
                        </button>
                        {assistId && (
                          <button type="button" onClick={() => removeAtKind("assist", t, idx)} disabled={saving} aria-label="إزالة الصانع"
                            className="btn-icon h-11 w-11 flex-shrink-0 border border-line text-text-dim transition-colors hover:border-live/40 hover:text-live">×</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {(["yellow", "red"] as const).map((color) => {
                const cards = color === "yellow" ? yellows : reds;
                return (
                  <div key={color} className="rounded-lg border border-line/60 bg-surface-elevated/30 p-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-body text-[11px] font-bold text-text">
                        <span className={`ml-1.5 inline-block h-2.5 w-2.5 rounded-sm ${color === "yellow" ? "bg-yellow-400" : "bg-red-500"}`} />
                        الكروت {color === "yellow" ? "الصفراء" : "الحمراء"}
                      </p>
                      <button type="button" onClick={() => addCard(color, t)} disabled={saving || players.length === 0}
                        className={`btn-sm px-3 border ${color === "yellow" ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20" : "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"} disabled:opacity-40`}>
                        + كارت
                      </button>
                    </div>
                    {players.length === 0 ? (
                      <p className="font-body text-[10px] text-text-dimmer">لا يوجد لاعبون مسجّلون في هذا الفريق.</p>
                    ) : cards.length === 0 ? (
                      <p className="font-body text-[10px] text-text-dimmer">لا توجد كروت.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {cards.map((v, idx) => {
                          const player = players.find((p) => p.id === v);
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className={`h-3 w-3 flex-shrink-0 rounded-sm ${color === "yellow" ? "bg-yellow-400" : "bg-red-500"}`} />
                              <button type="button" onClick={() => setPicker({ team: t, kind: color, slot: idx })} disabled={saving}
                                className="min-h-[44px] flex-1 truncate rounded-lg border border-line bg-bg px-3 text-right font-body text-[12px] font-bold text-text transition-colors hover:border-accent">
                                {player ? playerLabel(player) : "اختر اللاعب"}
                              </button>
                              <button type="button" onClick={() => removeAtKind(color, t, idx)} disabled={saving} aria-label="حذف الكارت"
                                className="btn-icon h-11 w-11 flex-shrink-0 border border-line text-text-dim transition-colors hover:border-live/40 hover:text-live">×</button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {error && <p className="mb-3 rounded-lg border border-live/30 bg-live/10 px-3 py-2 font-body text-[12px] text-live">{error}</p>}

      <div className="flex flex-wrap items-center gap-2.5">
        <button onClick={() => save(true)} disabled={saving || !canSaveWithGoals} className="btn-primary text-[13px]">
          {saving ? "جارِ الحفظ..." : "حفظ النتيجة والأهداف"}
        </button>
        <button onClick={() => save(false)} disabled={saving} className="btn-sm border border-line text-text-dim hover:text-text">حفظ النتيجة فقط</button>
        <button onClick={onClose} disabled={saving} className="btn-sm border border-line text-text-dim hover:text-text">إلغاء</button>
      </div>
      <p className="mt-2 font-body text-[10px] text-text-dimmer">الأهداف تُحتسب تلقائياً في جدول الهدافين وصفحة اللاعب، والكروت تظهر في سجل الانضباط وتُحسب الإيقافات تلقائياً (حمراء = إيقاف مباراة، كارتان أصفراوان في مباراتين = إيقاف مباراة). إذا غيرت النتيجة لاحقاً، تُعاد اختيارات الأهداف والكروت وستُستبدل السابقة.</p>

      {picker && playersFor(picker.team).length > 0 && (
        <PlayerPickerSheet
          title={`${picker.kind === "assist" ? "اختر صانع الهدف" : picker.kind === "yellow" ? "اختر لاعب الكارت الأصفر" : picker.kind === "red" ? "اختر لاعب الكارت الأحمر" : "اختر مسجل الهدف"} — ${teamLabel(picker.team)}`}
          options={playersFor(picker.team)}
          onSelect={applyPicker}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function ScheduleEditForm({ match, onClose }: { match: MatchRow; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(match.status === "POSTPONED" ? "POSTPONED" : match.status === "CANCELLED" ? "CANCELLED" : "SCHEDULED");
  const [venueImage, setVenueImage] = useState<string | null>(match.venueImageUrl);

  return (
    <div className="rounded-xl border border-accent/20 bg-surface p-4">
      <form action={async (formData) => {
        setError(null);
        try {
          await updateMatchSchedule(
            match.id,
            String(formData.get("kickoffAt") || ""),
            String(formData.get("venue") || ""),
            String(formData.get("status") || ""),
            venueImage || "",
          );
          window.location.reload();
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "حدث خطأ");
        }
      }}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الموعد الجديد</label>
            <input type="datetime-local" name="kickoffAt" defaultValue={toLocalInput(new Date(match.kickoffAt))} required className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-body text-sm text-text outline-none focus:border-accent" />
          </div>
          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الملعب <span className="text-live">*</span></label>
            <input name="venue" defaultValue={match.venue ?? ""} required className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-body text-sm text-text outline-none focus:border-accent" />
          </div>
          <div>
            <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الحالة</label>
            <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-body text-sm text-text outline-none focus:border-accent">
              {SCHEDULE_STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <ImageUpload name="venueImageUrl" purpose="general" label="صورة الملعب (اختياري)" value={venueImage} onChange={setVenueImage} />
        </div>
        {error && <p className="mt-3 rounded-lg border border-live/30 bg-live/10 px-3 py-2 font-body text-[12px] text-live">{error}</p>}
        <div className="mt-3 flex items-center gap-2.5">
          <button type="submit" className="btn-primary text-[12px]">حفظ</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text">إلغاء</button>
        </div>
      </form>
    </div>
  );
}

function formatDate(date: Date): string {
  return formatMatchDateTime(date);
}

function MatchDeleteRow({ matchId }: { matchId: string }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <form action={async () => {
        try {
          await deleteMatch(matchId);
          window.location.reload();
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "حدث خطأ");
        }
      }} className="inline">
        <DeleteButton />
      </form>
      {error && <p className="mt-1 font-body text-[10px] text-live">{error}</p>}
    </div>
  );
}

function MatchRowItem({ match, onEditGoals, onEditSchedule }: {
  match: MatchRow;
  onEditGoals: () => void;
  onEditSchedule: () => void;
}) {
  const overdue = isOverdueMatch(match);

  return (
    <tr className={`transition-colors hover:bg-surface-elevated/50 ${overdue ? "bg-live/[0.06]" : ""}`}>
      <td className="px-4 py-3">
        <span className="font-body text-[12px] text-text-dim">{match.tournament.name}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-body text-sm font-bold text-text">{match.homeTeam.name}</span>
          <span className="font-utility text-[10px] text-text-dimmer">vs</span>
          <span className="font-body text-sm font-bold text-text">{match.awayTeam.name}</span>
          {overdue && <span className="rounded-md bg-live/15 px-2 py-0.5 font-utility text-[9px] tracking-wider text-live">متأخرة</span>}
        </div>
        {match.round && <span className="font-body text-[11px] text-text-dim">{match.round}</span>}
      </td>
      <td className="px-4 py-3">
        <span className="font-num text-lg font-bold text-text">{match.homeScore} - {match.awayScore}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-md px-2 py-0.5 font-utility text-[10px] tracking-wider ${STATUS_COLORS[match.status] ?? ""}`}>
          {STATUS_LABELS[match.status] ?? match.status}
        </span>
      </td>
      <td className="px-4 py-3 font-body text-[12px] text-text-dim">{formatDate(new Date(match.kickoffAt))}</td>
      <td className="px-4 py-3">
        {match.venue ? (
          <span className="flex items-center gap-1.5 font-body text-[11px] text-text-dim">
            <svg className="h-3 w-3 flex-shrink-0 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="7" /><circle cx="8" cy="8" r="2.5" /><path d="M8 2v2.5M8 11.5V14M2.5 8H5M11 8h2.5" />
            </svg>
            <span className="max-w-[110px] truncate">{match.venue}</span>
          </span>
        ) : (
          <span className="font-body text-[11px] text-live">مطلوب</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {match.status !== "CANCELLED" && (
            <button onClick={onEditGoals} className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/20 min-h-11">
              {match.status === "SCHEDULED" || match.status === "POSTPONED" ? "إدخال النتيجة والأهداف" : "تحديث النتيجة والأهداف"}
            </button>
          )}
          <button onClick={onEditSchedule} className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/20 min-h-11">الموعد</button>
          <Link href={`/admin/matches/${match.id}/squads`} className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/20 min-h-11 inline-flex items-center">القوائم</Link>
          <MatchDeleteRow matchId={match.id} />
        </div>
      </td>
    </tr>
  );
}

function Overlay({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 sm:p-6">
      <div className="mx-auto flex min-h-full w-full max-w-2xl items-start justify-center sm:items-center">
        <div className="w-full rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
            <span className="font-display text-[15px] font-black text-text">{title}</span>
            <button type="button" onClick={onClose} aria-label="إغلاق" className="btn-icon font-body text-lg text-text-dim transition-colors hover:bg-surface-elevated hover:text-text">×</button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function MatchesTable({ matches, teams, tournaments, referees = [], playersByTeam = {}, eventsByMatch = {} }: {
  matches: MatchRow[];
  teams: TeamOption[];
  tournaments: TournamentOption[];
  referees?: { id: string; fullName: string }[];
  playersByTeam?: Record<string, GoalPlayerOption[]>;
  eventsByMatch?: Record<string, EventLite[]>;
}) {
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [goalRowId, setGoalRowId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const overdueCount = matches.filter(isOverdueMatch).length;

  const query = normalizeArabic(search.trim());
  const filtered = query
    ? matches.filter((match) => {
        const home = normalizeArabic(match.homeTeam.name);
        const away = normalizeArabic(match.awayTeam.name);
        const tournament = normalizeArabic(match.tournament.name);
        const venue = normalizeArabic(match.venue || "");
        const round = normalizeArabic(match.round || "");
        return (
          home.includes(query) ||
          away.includes(query) ||
          tournament.includes(query) ||
          venue.includes(query) ||
          round.includes(query)
        );
      })
    : matches;

  const hasResults = filtered.length > 0;

  return (
    <>
      <InlineCreateForm teams={teams} tournaments={tournaments} referees={referees} />
      {overdueCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-live/30 bg-live/10 px-4 py-3.5">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-live/20 font-num text-[12px] font-bold text-live">{overdueCount}</span>
          <div>
            <p className="font-body text-[13px] font-bold text-live">مباريات متأخرة بدون نتيجة</p>
            <p className="mt-0.5 font-body text-[12px] text-live/80">
              سجّل النتيجة (اكتبها واضغط &quot;حفظ النتيجة والأهداف&quot;) أو أرجئها من زر &quot;الموعد&quot;.
            </p>
          </div>
        </div>
      )}
      <div className="max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="ابحث بفريق أو بطولة أو ملعب..."
          label="بحث في المباريات"
        />
      </div>
      {matches.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <p className="font-body text-sm text-text-dim">لا توجد مباريات بعد. أضف مباراة للبدء.</p>
        </div>
      ) : !hasResults ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <p className="font-body text-sm font-bold text-text-dim">لا توجد نتائج مطابقة لبحثك.</p>
          <p className="mt-1 font-body text-[12px] text-text-dimmer">جرّب كتابة اسم فريق أو بطولة أو ملعب آخر.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-line bg-surface-elevated/50">
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">البطولة</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المباراة</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">النتيجة</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الحالة</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">التاريخ</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الملعب</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {filtered.map((match) => (
                <MatchRowItem
                  key={match.id}
                  match={match}
                  onEditGoals={() => { setGoalRowId(match.id); setEditingSchedule(null); }}
                  onEditSchedule={() => { setEditingSchedule(match.id); setGoalRowId(null); }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {goalRowId && (() => {
        const match = filtered.find((m) => m.id === goalRowId);
        if (!match) return null;
        const existingEvents = eventsByMatch[match.id] ?? [];
        const existingHomeGoals = existingEvents.filter((g) => g.type === "GOAL" && g.teamId === match.homeTeamId).map((g) => g.playerId);
        const existingAwayGoals = existingEvents.filter((g) => g.type === "GOAL" && g.teamId === match.awayTeamId).map((g) => g.playerId);
        const existingHomeAssists = existingEvents.filter((e) => e.type === "ASSIST" && e.teamId === match.homeTeamId).map((e) => e.playerId);
        const existingAwayAssists = existingEvents.filter((e) => e.type === "ASSIST" && e.teamId === match.awayTeamId).map((e) => e.playerId);
        const existingHomeYellow = existingEvents.filter((e) => e.type === "YELLOW_CARD" && e.teamId === match.homeTeamId).map((e) => e.playerId);
        const existingAwayYellow = existingEvents.filter((e) => e.type === "YELLOW_CARD" && e.teamId === match.awayTeamId).map((e) => e.playerId);
        const existingHomeRed = existingEvents.filter((e) => e.type === "RED_CARD" && e.teamId === match.homeTeamId).map((e) => e.playerId);
        const existingAwayRed = existingEvents.filter((e) => e.type === "RED_CARD" && e.teamId === match.awayTeamId).map((e) => e.playerId);
        return (
          <Overlay title="تسجيل النتيجة والأهداف" onClose={() => setGoalRowId(null)}>
            <GoalAssignPanel
              match={match}
              prefix={`${match.id}-home`}
              homePlayers={playersByTeam[match.homeTeamId] ?? []}
              awayPlayers={playersByTeam[match.awayTeamId] ?? []}
              existingHome={existingHomeGoals}
              existingAway={existingAwayGoals}
              existingHomeAssists={existingHomeAssists}
              existingAwayAssists={existingAwayAssists}
              existingHomeYellow={existingHomeYellow}
              existingAwayYellow={existingAwayYellow}
              existingHomeRed={existingHomeRed}
              existingAwayRed={existingAwayRed}
              onClose={() => setGoalRowId(null)}
            />
          </Overlay>
        );
      })()}

      {editingSchedule && (() => {
        const match = filtered.find((m) => m.id === editingSchedule);
        if (!match) return null;
        return (
          <Overlay title="تعديل موعد المباراة" onClose={() => setEditingSchedule(null)}>
            <ScheduleEditForm match={match} onClose={() => setEditingSchedule(null)} />
          </Overlay>
        );
      })()}
    </>
  );
}