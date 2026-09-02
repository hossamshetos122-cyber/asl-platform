"use client";

import { useRouter } from "next/navigation";
import { refereeAddEvent, refereeRemoveEvent, refereeSetScore } from "@/lib/actions/referee";
import type { RefereeMatchVM } from "@/lib/data/referee";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "مجدولة",
  LIVE: "مباشر",
  HALFTIME: "استراحة",
  FINISHED: "انتهت",
  POSTPONED: "مؤجلة",
};

const EVENT_LABELS: Record<string, string> = {
  GOAL: "هدف",
  OWN_GOAL: "هدف عكسي",
  ASSIST: "تمريرة حاسمة",
  YELLOW_CARD: "بطاقة صفراء",
  RED_CARD: "بطاقة حمراء",
  PENALTY_SCORED: "هدف من ركلة جزاء",
  PENALTY_MISSED: "ضائع ركلة جزاء",
  SUBSTITUTION_IN: "دخول",
  SUBSTITUTION_OUT: "خروج",
};

const EVENT_OPTIONS = [
  "GOAL",
  "OWN_GOAL",
  "PENALTY_SCORED",
  "PENALTY_MISSED",
  "YELLOW_CARD",
  "RED_CARD",
  "ASSIST",
  "SUBSTITUTION_IN",
  "SUBSTITUTION_OUT",
] as const;

type PlayerOption = { id: string; name: string; jerseyNumber: number | null };

function ScoreEditor({ match, players }: { match: RefereeMatchVM; players: Record<string, PlayerOption[]> }) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        const res = await refereeSetScore(formData);
        if (res.ok) router.refresh();
        else alert(res.error || "حدث خطأ");
      }}
      className="flex flex-wrap items-end gap-2.5"
    >
      <input type="hidden" name="matchId" value={match.id} />
      <div>
        <label className="mb-1 block font-utility text-[8px] tracking-[0.14em] text-text-dimmer uppercase">الحالة</label>
        <select name="status" defaultValue={match.status === "FINISHED" ? "FINISHED" : match.status === "HALFTIME" ? "HALFTIME" : "LIVE"} className="rounded-lg border border-line bg-bg px-2.5 py-2 font-body text-[12px] text-text outline-none focus:border-accent">
          <option value="LIVE">مباشر</option>
          <option value="HALFTIME">استراحة</option>
          <option value="FINISHED">انتهت</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block font-utility text-[8px] tracking-[0.14em] text-text-dimmer uppercase">نادي {match.homeTeam.shortCode}</label>
        <input name="homeScore" type="number" min={0} max={50} defaultValue={match.homeScore} className="w-16 rounded-lg border border-line bg-bg px-2.5 py-2 font-num text-[12px] font-bold text-text outline-none focus:border-accent" dir="ltr" />
      </div>
      <div>
        <label className="mb-1 block font-utility text-[8px] tracking-[0.14em] text-text-dimmer uppercase">نادي {match.awayTeam.shortCode}</label>
        <input name="awayScore" type="number" min={0} max={50} defaultValue={match.awayScore} className="w-16 rounded-lg border border-line bg-bg px-2.5 py-2 font-num text-[12px] font-bold text-text outline-none focus:border-accent" dir="ltr" />
      </div>
      <div>
        <label className="mb-1 block font-utility text-[8px] tracking-[0.14em] text-text-dimmer uppercase">الدقيقة</label>
        <input name="minute" type="number" min={0} max={120} defaultValue={match.minute ?? ""} placeholder="-" className="w-16 rounded-lg border border-line bg-bg px-2.5 py-2 font-num text-[12px] font-bold text-text outline-none focus:border-accent" dir="ltr" />
      </div>
      <button type="submit" className="rounded-lg bg-accent px-4 py-2 font-body text-[12px] font-bold text-[#0b1220] transition-colors hover:bg-accent-bright">
        حفظ النتيجة
      </button>
      {match.minute !== null && match.status === "LIVE" && (
        <span className="font-num text-[12px] font-bold text-live">{match.minute}&#39;</span>
      )}
      {players && <p className="w-full font-body text-[10px] text-text-dimmer">
        تحديث الحالة إلى «انتهت» يثبّت النتيجة ويحدّث الترتيب تلقائياً.
      </p>}
    </form>
  );
}

function AddEventForm({ match, players }: { match: RefereeMatchVM; players: Record<string, PlayerOption[]> }) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        const res = await refereeAddEvent(formData);
        if (res.ok) router.refresh();
        else alert(res.error || "حدث خطأ");
      }}
      className="flex flex-wrap items-end gap-2.5"
    >
      <input type="hidden" name="matchId" value={match.id} />
      <div>
        <label className="mb-1 block font-utility text-[8px] tracking-[0.14em] text-text-dimmer uppercase">الحدث</label>
        <select name="type" required className="rounded-lg border border-line bg-bg px-2.5 py-2 font-body text-[12px] text-text outline-none focus:border-accent">
          <option value="">اختر...</option>
          {EVENT_OPTIONS.map((t) => (
            <option key={t} value={t}>{EVENT_LABELS[t]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block font-utility text-[8px] tracking-[0.14em] text-text-dimmer uppercase">الفريق</label>
        <select name="teamId" required defaultValue={match.homeTeam.id} className="rounded-lg border border-line bg-bg px-2.5 py-2 font-body text-[12px] text-text outline-none focus:border-accent">
          <option value={match.homeTeam.id}>{match.homeTeam.name}</option>
          <option value={match.awayTeam.id}>{match.awayTeam.name}</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block font-utility text-[8px] tracking-[0.14em] text-text-dimmer uppercase">اللاعب</label>
        <select name="playerId" required className="w-40 rounded-lg border border-line bg-bg px-2.5 py-2 font-body text-[12px] text-text outline-none focus:border-accent">
          <option value="">اختر...</option>
          {[...(players[match.homeTeam.id] ?? []), ...(players[match.awayTeam.id] ?? [])].map((p) => (
            <option key={p.id} value={p.id}>
              {p.jerseyNumber ? `${p.jerseyNumber} — ` : ""}{p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block font-utility text-[8px] tracking-[0.14em] text-text-dimmer uppercase">الدقيقة</label>
        <input name="minute" type="number" min={0} max={120} defaultValue={0} required className="w-16 rounded-lg border border-line bg-bg px-2.5 py-2 font-num text-[12px] font-bold text-text outline-none focus:border-accent" dir="ltr" />
      </div>
      <button type="submit" className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 font-body text-[12px] font-bold text-accent transition-colors hover:bg-accent/20">
        إضافة
      </button>
    </form>
  );
}

function EventsList({ match }: { match: RefereeMatchVM }) {
  const router = useRouter();

  if (match.events.length === 0) {
    return <p className="font-body text-[11px] text-text-dimmer">لا توجد أحداث مسجّلة بعد.</p>;
  }

  return (
    <div className="divide-y divide-line/40">
      {match.events.map((ev) => (
        <div key={ev.id} className="flex items-center gap-2 py-1.5">
          <span className="font-num w-8 text-center text-[10px] font-bold text-accent">{ev.minute}&#39;</span>
          <span className="flex-1 font-body text-[12px] text-text truncate">{ev.playerName}</span>
          <span className={`badge-muted text-[9px] ${ev.type === "GOAL" || ev.type === "PENALTY_SCORED" ? "!bg-emerald-500/10 !text-emerald-400 border-emerald-500/25" : ev.type === "RED_CARD" ? "!bg-live/10 !text-live border-live/25" : ""}`}>
            {EVENT_LABELS[ev.type] ?? ev.type}
          </span>
          <form
            action={async (formData) => {
              const res = await refereeRemoveEvent(formData);
              if (res.ok) router.refresh();
            }}
          >
            <input type="hidden" name="matchId" value={match.id} />
            <input type="hidden" name="eventId" value={ev.id} />
            <button type="submit" title="حذف الحدث" className="text-text-dimmer transition-colors hover:text-live">
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}

export function RefereePortal({
  matches,
  playersByTeam,
}: {
  matches: RefereeMatchVM[];
  playersByTeam: Record<string, PlayerOption[]>;
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-10 text-center">
        <p className="font-body text-sm text-text-dim">
          لا توجد مباريات مسندة إليك حالياً. ستظهر المباريات هنا تلقائياً بعد إسنادها من لوحة التحكم.
        </p>
      </div>
    );
  }

  const live = matches.filter((m) => m.status === "LIVE" || m.status === "HALFTIME");
  const upcoming = matches.filter((m) => m.status === "SCHEDULED" || m.status === "POSTPONED");
  const finished = matches.filter((m) => m.status === "FINISHED");

  return (
    <div className="space-y-6">
      {live.length > 0 && (
        <section>
          <h2 className="mb-px flex items-center gap-2 font-utility text-[10px] tracking-[0.18em] text-live uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
            جارية الآن · سوف تشاهد لوحات البث والتحديث بدون إعادة تحميل
          </h2>
          <MatchCards matches={live} playersByTeam={playersByTeam} />
        </section>
      )}
      <section>
        <h2 className="mb-px font-utility text-[10px] tracking-[0.18em] text-text-dimmer uppercase">مباريات المجدولة</h2>
        <MatchCards matches={upcoming} playersByTeam={playersByTeam} />
      </section>
      <section>
        <h2 className="mb-px font-utility text-[10px] tracking-[0.18em] text-text-dimmer uppercase">النتائج النهائية</h2>
        <MatchCards matches={finished} playersByTeam={playersByTeam} />
      </section>
    </div>
  );
}

function MatchCards({ matches, playersByTeam }: { matches: RefereeMatchVM[]; playersByTeam: Record<string, PlayerOption[]> }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
      {matches.map((m) => (
        <div key={m.id} className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-elevated/30 px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-display text-[13px] font-black text-text truncate">
                {m.homeTeam.name} <span className="text-live">–</span> {m.awayTeam.name}
              </span>
            </div>
            <span className={`badge-muted text-[9px] ${m.status === "LIVE" ? "badge-live" : m.status === "HALFTIME" ? "badge-accent" : ""}`}>
              {STATUS_LABELS[m.status] ?? m.status}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">النتيجة والحالة</h3>
              <ScoreEditor match={m} players={playersByTeam} />
            </div>
            <div>
              <h3 className="mb-2 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الأحداث المسجّلة</h3>
              <EventsList match={m} />
              <div className="mt-3 border-t border-line/40 pt-3">
                <AddEventForm match={m} players={playersByTeam} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}