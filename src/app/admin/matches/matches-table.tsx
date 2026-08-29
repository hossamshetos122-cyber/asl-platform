"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createMatch, updateScore, deleteMatch } from "@/lib/actions/matches";

interface MatchRow {
  id: string;
  status: string;
  kickoffAt: string;
  venue: string | null;
  round: string | null;
  homeScore: number;
  awayScore: number;
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

function InlineCreateForm({ teams, tournaments }: { teams: TeamOption[]; tournaments: TournamentOption[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الملعب</label>
          <input name="venue" className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent" placeholder="استاد الإسكندرية" />
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

function ScoreUpdateForm({ match }: { match: MatchRow }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <form action={async (formData) => {
        setError(null);
        try {
          const home = Number(formData.get("homeScore"));
          const away = Number(formData.get("awayScore"));
          await updateScore(match.id, home, away);
          window.location.reload();
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "حدث خطأ");
        }
      }} className="inline-flex items-center gap-2">
        <input type="number" name="homeScore" defaultValue={match.homeScore} min={0} className="w-12 rounded-lg border border-line bg-surface-elevated px-1.5 py-1 text-center font-num text-sm text-text outline-none focus:border-accent" />
        <span className="font-num text-sm text-accent/50">-</span>
        <input type="number" name="awayScore" defaultValue={match.awayScore} min={0} className="w-12 rounded-lg border border-line bg-surface-elevated px-1.5 py-1 text-center font-num text-sm text-text outline-none focus:border-accent" />
        <button type="submit" className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/20">تحديث</button>
      </form>
      {error && <p className="mt-1 font-body text-[10px] text-live">{error}</p>}
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
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

export default function MatchesTable({ matches, teams, tournaments }: { matches: MatchRow[]; teams: TeamOption[]; tournaments: TournamentOption[] }) {
  return (
    <>
      <InlineCreateForm teams={teams} tournaments={tournaments} />
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
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {matches.map((match) => (
                <tr key={match.id} className="transition-colors hover:bg-surface-elevated/50">
                  <td className="px-4 py-3">
                    <span className="font-body text-[12px] text-text-dim">{match.tournament.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-bold text-text">{match.homeTeam.name}</span>
                      <span className="font-utility text-[10px] text-text-dimmer">vs</span>
                      <span className="font-body text-sm font-bold text-text">{match.awayTeam.name}</span>
                    </div>
                    {match.round && <span className="font-body text-[11px] text-text-dimmer">{match.round}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {match.status === "FINISHED" || match.status === "LIVE" || match.status === "HALFTIME" ? (
                      <ScoreUpdateForm match={match} />
                    ) : (
                      <span className="font-num text-lg font-bold text-text-dimmer">{match.homeScore} - {match.awayScore}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 font-utility text-[10px] tracking-wider ${STATUS_COLORS[match.status] ?? ""}`}>
                      {STATUS_LABELS[match.status] ?? match.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-[12px] text-text-dim">{formatDate(new Date(match.kickoffAt))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/matches/${match.id}/squads`} className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/20">القوائم</Link>
                      <MatchDeleteRow matchId={match.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
