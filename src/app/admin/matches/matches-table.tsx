"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createMatch, setMatchResult, setMatchResultWithGoals, updateMatchSchedule, deleteMatch } from "@/lib/actions/matches";
import { formatMatchDateTime } from "@/lib/dates";
import { ImageUpload } from "@/components/ui/image-upload";

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

function InlineCreateForm({ teams, tournaments }: { teams: TeamOption[]; tournaments: TournamentOption[] }) {
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

interface CardGroupProps {
  label: string;
  color: "yellow" | "red";
  teamName: string;
  players: GoalPlayerOption[];
  values: string[];
  prefix: string;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, value: string) => void;
}

function CardGroup({ label, color, teamName, players, values, prefix, onAdd, onRemove, onChange }: CardGroupProps) {
  return (
    <div className="rounded-lg border border-line/60 bg-surface-elevated/30 px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-body text-[11px] font-bold text-text">
          <span className={`ml-1.5 inline-block h-2.5 w-2.5 rounded-sm ${color === "yellow" ? "bg-yellow-400" : "bg-red-500"}`} />
          {label} — {teamName}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={players.length === 0}
          className={`rounded-md border px-2 py-0.5 font-body text-[10px] font-bold transition-colors ${color === "yellow" ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20" : "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          + كارت {color === "yellow" ? "أصفر" : "أحمر"}
        </button>
      </div>
      {players.length === 0 ? (
        <p className="font-body text-[10px] text-text-dimmer">لا يوجد لاعبون مسجّلون في هذا الفريق.</p>
      ) : values.length === 0 ? (
        <p className="font-body text-[10px] text-text-dimmer">لا توجد كروت — اضغط «+ كارت» لاختيار اللاعب.</p>
      ) : (
        <div className="space-y-1.5">
          {values.map((v, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className={`h-3 w-3 flex-shrink-0 rounded-sm ${color === "yellow" ? "bg-yellow-400" : "bg-red-500"}`} />
              <select
                name={`${prefix}-${color}-${idx}`}
                value={v}
                onChange={(e) => onChange(idx, e.target.value)}
                className="w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 font-body text-[12px] text-text outline-none focus:border-accent"
              >
                <option value="">كارت {color === "yellow" ? "أصفر" : "أحمر"}: اختر اللاعب</option>
                {players.map((p) => (<option key={p.id} value={p.id}>{playerLabel(p)}</option>))}
              </select>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-line font-body text-[12px] text-text-dim transition-colors hover:border-live/40 hover:text-live"
                aria-label="حذف الكارت"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
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

  const add = (list: string[], setter: (v: string[]) => void) => setter([...list, ""]);
  const removeAt = (list: string[], setter: (v: string[]) => void, idx: number) =>
    setter(list.filter((_, i) => i !== idx));

  const canSaveWithGoals =
    (homeScore === 0 || homeSel.every((s) => s !== "")) &&
    (awayScore === 0 || awaySel.every((s) => s !== ""));

  async function save(withEvents: boolean) {
    setSaving(true);
    setError(null);
    try {
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

  const homeList = homePlayers;
  const awayList = awayPlayers;

  return (
    <div className="rounded-xl border border-accent/20 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-body text-[13px] font-bold text-text">
          تسجيل نتيجة {match.homeTeam.name} - {match.awayTeam.name}
        </p>
        <button onClick={onClose} className="font-body text-[11px] font-bold text-text-dim transition-colors hover:text-text">إغلاق</button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-elevated/50 px-3 py-2.5">
          <label className="whitespace-nowrap font-body text-[12px] font-bold text-text">{match.homeTeam.name}</label>
          <input type="number" value={homeScore} min={0} max={30} onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value || "0", 10) || 0))} className="w-16 rounded-lg border border-line bg-bg px-2 py-1.5 text-center font-num text-lg font-bold text-text outline-none focus:border-accent" />
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-elevated/50 px-3 py-2.5">
          <label className="whitespace-nowrap font-body text-[12px] font-bold text-text">{match.awayTeam.name}</label>
          <input type="number" value={awayScore} min={0} max={30} onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value || "0", 10) || 0))} className="w-16 rounded-lg border border-line bg-bg px-2 py-1.5 text-center font-num text-lg font-bold text-text outline-none focus:border-accent" />
        </div>
      </div>

      {homeScore > 0 && (
        <div className="mb-4">
          <p className="mb-2 font-body text-[12px] font-bold text-accent">أهداف {match.homeTeam.name} ({homeScore})</p>
          {homeList.length === 0 ? (
            <p className="rounded-lg border border-line bg-surface-elevated/40 px-3 py-2 font-body text-[11px] text-text-dim">
              لا يوجد لاعبون مسجّلون في {match.homeTeam.name} — أضف لاعبين من صفحة إدارة اللاعبين أو فعّل القوائم في صفحة المباراة.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {homeSel.map((sel, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 rounded-lg border border-line/60 bg-surface-elevated/40 p-2">
                  <select name={`${prefix}-goal-${idx}`} value={sel} onChange={(e) => {
                    const next = [...homeSel];
                    next[idx] = e.target.value;
                    setHomeSel(next);
                  }} className="rounded-lg border border-line bg-bg px-2.5 py-1.5 font-body text-[12px] text-text outline-none focus:border-accent">
                    <option value="">الهدف {idx + 1}: اختر اللاعب</option>
                    {homeList.map((p) => (<option key={p.id} value={p.id}>{playerLabel(p)}</option>))}
                  </select>
                  <select name={`${prefix}-assist-${idx}`} value={homeAssistSel[idx] ?? ""} onChange={(e) => {
                    const next = [...homeAssistSel];
                    next[idx] = e.target.value;
                    setHomeAssistSel(next);
                  }} className="rounded-lg border border-line/70 bg-surface-elevated px-2.5 py-1.5 font-body text-[12px] text-text-dim outline-none focus:border-accent">
                    <option value="">صانع الهدف {idx + 1} (اختياري)</option>
                    {homeList.map((p) => (<option key={p.id} value={p.id}>{playerLabel(p)}</option>))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {awayScore > 0 && (
        <div className="mb-4">
          <p className="mb-2 font-body text-[12px] font-bold text-accent">أهداف {match.awayTeam.name} ({awayScore})</p>
          {awayList.length === 0 ? (
            <p className="rounded-lg border border-line bg-surface-elevated/40 px-3 py-2 font-body text-[11px] text-text-dim">
              لا يوجد لاعبون مسجّلون في {match.awayTeam.name} — أضف لاعبين من صفحة إدارة اللاعبين أو فعّل القوائم في صفحة المباراة.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {awaySel.map((sel, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 rounded-lg border border-line/60 bg-surface-elevated/40 p-2">
                  <select name={`${prefix}-goal-${idx}`} value={sel} onChange={(e) => {
                    const next = [...awaySel];
                    next[idx] = e.target.value;
                    setAwaySel(next);
                  }} className="rounded-lg border border-line bg-bg px-2.5 py-1.5 font-body text-[12px] text-text outline-none focus:border-accent">
                    <option value="">الهدف {idx + 1}: اختر اللاعب</option>
                    {awayList.map((p) => (<option key={p.id} value={p.id}>{playerLabel(p)}</option>))}
                  </select>
                  <select name={`${prefix}-assist-${idx}`} value={awayAssistSel[idx] ?? ""} onChange={(e) => {
                    const next = [...awayAssistSel];
                    next[idx] = e.target.value;
                    setAwayAssistSel(next);
                  }} className="rounded-lg border border-line/70 bg-surface-elevated px-2.5 py-1.5 font-body text-[12px] text-text-dim outline-none focus:border-accent">
                    <option value="">صانع الهدف {idx + 1} (اختياري)</option>
                    {awayList.map((p) => (<option key={p.id} value={p.id}>{playerLabel(p)}</option>))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <CardGroup
            label="الكروت الصفراء"
            color="yellow"
            teamName={match.homeTeam.name}
            players={homeList}
            values={homeYellowSel}
            prefix={`${match.id}-home`}
            onAdd={() => add(homeYellowSel, setHomeYellowSel)}
            onRemove={(idx) => removeAt(homeYellowSel, setHomeYellowSel, idx)}
            onChange={(idx, value) => {
              const next = [...homeYellowSel];
              next[idx] = value;
              setHomeYellowSel(next);
            }}
          />
          <CardGroup
            label="الكروت الحمراء"
            color="red"
            teamName={match.homeTeam.name}
            players={homeList}
            values={homeRedSel}
            prefix={`${match.id}-home`}
            onAdd={() => add(homeRedSel, setHomeRedSel)}
            onRemove={(idx) => removeAt(homeRedSel, setHomeRedSel, idx)}
            onChange={(idx, value) => {
              const next = [...homeRedSel];
              next[idx] = value;
              setHomeRedSel(next);
            }}
          />
        </div>
        <div className="space-y-2">
          <CardGroup
            label="الكروت الصفراء"
            color="yellow"
            teamName={match.awayTeam.name}
            players={awayList}
            values={awayYellowSel}
            prefix={`${match.id}-away`}
            onAdd={() => add(awayYellowSel, setAwayYellowSel)}
            onRemove={(idx) => removeAt(awayYellowSel, setAwayYellowSel, idx)}
            onChange={(idx, value) => {
              const next = [...awayYellowSel];
              next[idx] = value;
              setAwayYellowSel(next);
            }}
          />
          <CardGroup
            label="الكروت الحمراء"
            color="red"
            teamName={match.awayTeam.name}
            players={awayList}
            values={awayRedSel}
            prefix={`${match.id}-away`}
            onAdd={() => add(awayRedSel, setAwayRedSel)}
            onRemove={(idx) => removeAt(awayRedSel, setAwayRedSel, idx)}
            onChange={(idx, value) => {
              const next = [...awayRedSel];
              next[idx] = value;
              setAwayRedSel(next);
            }}
          />
        </div>
      </div>

      {error && <p className="mb-3 rounded-lg border border-live/30 bg-live/10 px-3 py-2 font-body text-[12px] text-live">{error}</p>}

      <div className="flex flex-wrap items-center gap-2.5">
        <button onClick={() => save(true)} disabled={saving || !canSaveWithGoals} className="btn-primary text-[12px]">
          {saving ? "جارِ الحفظ..." : "حفظ النتيجة والأهداف"}
        </button>
        <button onClick={() => save(false)} disabled={saving} className="rounded-lg border border-line px-3 py-1.5 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text">
          حفظ النتيجة فقط
        </button>
        <button onClick={onClose} disabled={saving} className="rounded-lg border border-line px-3 py-1.5 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text">إلغاء</button>
      </div>
      <p className="mt-2 font-body text-[10px] text-text-dimmer">الأهداف تُحتسب تلقائياً في جدول الهدافين وصفحة اللاعب، والكروت تظهر في سجل الانضباط وتُحسب الإيقافات تلقائياً (حمراء = إيقاف مباراة، كارتان أصفراوان في مباراتين = إيقاف مباراة). إذا غيرت النتيجة لاحقاً، تُعاد اختيارات الأهداف والكروت وستُستبدل السابقة.</p>
    </div>
  );
}

function GoalEntryButton({ match, isOpen, onClick }: { match: MatchRow; isOpen: boolean; onClick: () => void }) {
  const label = match.status === "SCHEDULED" || match.status === "POSTPONED"
    ? "إدخال النتيجة والأهداف"
    : "تحديث النتيجة والأهداف";
  return (
    <button onClick={onClick} className={`rounded-lg border px-2.5 py-1 font-body text-[11px] font-bold transition-colors ${isOpen ? "border-accent/50 bg-accent/20 text-accent-bright" : "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"}`}>
      {label}
    </button>
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

function MatchRowItem({ match, editingSchedule, setEditingSchedule, goalRowId, setGoalRowId, playersByTeam, eventsByMatch }: {
  match: MatchRow;
  editingSchedule: string | null;
  setEditingSchedule: (id: string | null) => void;
  goalRowId: string | null;
  setGoalRowId: (id: string | null) => void;
  playersByTeam: Record<string, GoalPlayerOption[]>;
  eventsByMatch: Record<string, EventLite[]>;
}) {
  const overdue = isOverdueMatch(match);
  const goalsOpen = goalRowId === match.id;
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
    <>
      {editingSchedule === match.id ? (
        <tr className="bg-surface-elevated/40">
          <td colSpan={7} className="px-4 py-3">
            <ScheduleEditForm match={match} onClose={() => setEditingSchedule(null)} />
          </td>
        </tr>
      ) : (
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
            {match.round && <span className="font-body text-[11px] text-text-dimmer">{match.round}</span>}
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
            <div className="flex items-center gap-2">
              {match.status !== "CANCELLED" && (
                <GoalEntryButton match={match} isOpen={goalsOpen} onClick={() => setGoalRowId(goalsOpen ? null : match.id)} />
              )}
              <button onClick={() => { setEditingSchedule(match.id); setGoalRowId(null); }} className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/20">الموعد</button>
              <Link href={`/admin/matches/${match.id}/squads`} className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/20">القوائم</Link>
              <MatchDeleteRow matchId={match.id} />
            </div>
          </td>
        </tr>
      )}
      {goalsOpen && (
        <tr className="bg-surface-elevated/40">
          <td colSpan={7} className="px-4 py-3">
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
          </td>
        </tr>
      )}
    </>
  );
}

export default function MatchesTable({ matches, teams, tournaments, playersByTeam = {}, eventsByMatch = {} }: {
  matches: MatchRow[];
  teams: TeamOption[];
  tournaments: TournamentOption[];
  playersByTeam?: Record<string, GoalPlayerOption[]>;
  eventsByMatch?: Record<string, EventLite[]>;
}) {
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [goalRowId, setGoalRowId] = useState<string | null>(null);
  const overdueCount = matches.filter(isOverdueMatch).length;

  return (
    <>
      <InlineCreateForm teams={teams} tournaments={tournaments} />
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
      {matches.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <p className="font-body text-sm text-text-dim">لا توجد مباريات بعد. أضف مباراة للبدء.</p>
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
              {matches.map((match) => (
                <MatchRowItem
                  key={match.id}
                  match={match}
                  editingSchedule={editingSchedule}
                  setEditingSchedule={setEditingSchedule}
                  goalRowId={goalRowId}
                  setGoalRowId={setGoalRowId}
                  playersByTeam={playersByTeam}
                  eventsByMatch={eventsByMatch}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}