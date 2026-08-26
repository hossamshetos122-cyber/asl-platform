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

interface TeamOption {
  id: string;
  name: string;
}

interface TournamentOption {
  id: string;
  name: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-gold px-5 py-2 font-body text-[13px] font-extrabold text-bg transition-colors hover:bg-gold-bright disabled:opacity-50"
    >
      {pending ? "جارِ الحفظ..." : "حفظ"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm("هل أنت متأكد من حذف المباراة؟")) {
          e.preventDefault();
        }
      }}
      className="rounded-sm border border-live/30 bg-live/10 px-3 py-1.5 font-body text-[11px] font-bold text-live transition-colors hover:bg-live/20 disabled:opacity-50"
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "مجدولة",
  LIVE: "مباشر",
  HALFTIME: "استراحة",
  FINISHED: "انتهت",
  POSTPONED: "مؤجلة",
  CANCELLED: "ملغاة",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "border border-gold/30 bg-gold/10 text-gold",
  LIVE: "border border-live/30 bg-live/10 text-live",
  HALFTIME: "border border-live/30 bg-live/10 text-live",
  FINISHED: "border border-line bg-white/[0.04] text-text-dim",
  POSTPONED: "border border-line bg-white/[0.04] text-text-dimmer",
  CANCELLED: "border border-live/30 bg-live/10 text-live",
};

function InlineCreateForm({
  teams,
  tournaments,
}: {
  teams: TeamOption[];
  tournaments: TournamentOption[];
}) {
  const [isAdding, setIsAdding] = useState(false);

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="rounded-sm border border-gold/30 bg-gold/10 px-5 py-2.5 font-body text-[13px] font-bold text-gold transition-colors hover:bg-gold/20"
      >
        + إضافة مباراة
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createMatch(formData);
        setIsAdding(false);
      }}
      className="rounded-sm border border-line bg-bg-raised p-5"
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            البطولة
          </label>
          <select
            name="tournamentId"
            required
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
          >
            <option value="">اختر البطولة</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            الفريق المضيف
          </label>
          <select
            name="homeTeamId"
            required
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
          >
            <option value="">اختر الفريق</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            الفريق الضيف
          </label>
          <select
            name="awayTeamId"
            required
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
          >
            <option value="">اختر الفريق</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            تاريخ ووقت البداية
          </label>
          <input
            type="datetime-local"
            name="kickoffAt"
            required
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            الملعب
          </label>
          <input
            name="venue"
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="استاد الإسكندرية"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            الجولة
          </label>
          <input
            name="round"
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="الأسبوع 1"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setIsAdding(false)}
          className="rounded-sm border border-line px-4 py-2 font-body text-[13px] font-bold text-text-dim transition-colors hover:text-text"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

function ScoreUpdateForm({ match }: { match: MatchRow }) {
  return (
    <form
      action={async (formData) => {
        const home = Number(formData.get("homeScore"));
        const away = Number(formData.get("awayScore"));
        await updateScore(match.id, home, away);
      }}
      className="inline-flex items-center gap-2"
    >
      <input
        type="number"
        name="homeScore"
        defaultValue={match.homeScore}
        min={0}
        className="w-12 rounded-sm border border-line bg-bg-raised px-1.5 py-1 text-center font-num text-sm text-text outline-none focus:border-gold"
      />
      <span className="font-num text-sm text-text-dimmer">-</span>
      <input
        type="number"
        name="awayScore"
        defaultValue={match.awayScore}
        min={0}
        className="w-12 rounded-sm border border-line bg-bg-raised px-1.5 py-1 text-center font-num text-sm text-text outline-none focus:border-gold"
      />
      <button
        type="submit"
        className="rounded-sm border border-gold/30 bg-gold/10 px-2.5 py-1 font-body text-[11px] font-bold text-gold transition-colors hover:bg-gold/20"
      >
        تحديث
      </button>
    </form>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default function MatchesTable({
  matches,
  teams,
  tournaments,
}: {
  matches: MatchRow[];
  teams: TeamOption[];
  tournaments: TournamentOption[];
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-sm border border-line bg-bg-raised px-6 py-10 text-center">
        <p className="font-body text-sm text-text-dim">
          لا توجد مباريات بعد. أضف مباراة للبدء.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-line bg-bg-raised">
      <table className="w-full text-right">
        <thead>
          <tr className="border-b border-line">
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              البطولة
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              المباراة
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              النتيجة
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              الحالة
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              التاريخ
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              إجراءات
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {matches.map((match) => (
            <tr
              key={match.id}
              className="transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3">
                <span className="font-body text-[12px] text-text-dim">
                  {match.tournament.name}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm font-bold text-text">
                    {match.homeTeam.name}
                  </span>
                  <span className="font-utility text-[10px] text-text-dimmer">
                    vs
                  </span>
                  <span className="font-body text-sm font-bold text-text">
                    {match.awayTeam.name}
                  </span>
                </div>
                {match.round && (
                  <span className="font-body text-[11px] text-text-dimmer">
                    {match.round}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {match.status === "FINISHED" ||
                match.status === "LIVE" ||
                match.status === "HALFTIME" ? (
                  <ScoreUpdateForm match={match} />
                ) : (
                  <span className="font-num text-lg font-bold text-text-dimmer">
                    {match.homeScore} - {match.awayScore}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-sm px-2 py-0.5 font-utility text-[10px] tracking-wider ${
                    STATUS_COLORS[match.status] ?? ""
                  }`}
                >
                  {STATUS_LABELS[match.status] ?? match.status}
                </span>
              </td>
              <td className="px-4 py-3 font-body text-[12px] text-text-dim">
                {formatDate(new Date(match.kickoffAt))}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/matches/${match.id}/squads`}
                    className="rounded-sm border border-gold/30 bg-gold/10 px-2.5 py-1 font-body text-[11px] font-bold text-gold transition-colors hover:bg-gold/20"
                  >
                    القوائم
                  </Link>
                  <form
                    action={async () => {
                      await deleteMatch(match.id);
                    }}
                    className="inline"
                  >
                    <DeleteButton />
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
