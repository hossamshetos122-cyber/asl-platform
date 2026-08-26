"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createPlayer, deletePlayer } from "@/lib/actions/players";
import Image from "next/image";

interface PlayerRow {
  id: string;
  jerseyNumber: number | null;
  position: string;
  photoUrl: string | null;
  user: { fullName: string; email: string };
  memberships: { team: { name: string } }[];
}

interface TeamOption {
  id: string;
  name: string;
  _count: { memberships: number };
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
        if (!confirm("هل أنت متأكد من حذف اللاعب؟")) {
          e.preventDefault();
        }
      }}
      className="rounded-sm border border-live/30 bg-live/10 px-3 py-1.5 font-body text-[11px] font-bold text-live transition-colors hover:bg-live/20 disabled:opacity-50"
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}

const POSITION_OPTIONS = [
  { value: "GOALKEEPER", label: "حارس مرمى" },
  { value: "DEFENDER", label: "مدافع" },
  { value: "MIDFIELDER", label: "لاعب وسط" },
  { value: "FORWARD", label: "مهاجم" },
] as const;

const POSITION_LABELS: Record<string, string> = Object.fromEntries(
  POSITION_OPTIONS.map((o) => [o.value, o.label])
);

function InlineCreateForm({ teams }: { teams: TeamOption[] }) {
  const [isAdding, setIsAdding] = useState(false);

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="rounded-sm border border-gold/30 bg-gold/10 px-5 py-2.5 font-body text-[13px] font-bold text-gold transition-colors hover:bg-gold/20"
      >
        + إضافة لاعب
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createPlayer(formData);
        setIsAdding(false);
      }}
      className="rounded-sm border border-line bg-bg-raised p-5"
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            الاسم الكامل
          </label>
          <input
            name="fullName"
            required
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="محمد أحمد"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="player@email.com"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            كلمة المرور
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            المركز
          </label>
          <select
            name="position"
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
          >
            {POSITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            رقم القميص
          </label>
          <input
            type="number"
            name="jerseyNumber"
            min={0}
            max={99}
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="10"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            الفريق
          </label>
          <select
            name="teamId"
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
          >
            <option value="">بدون فريق</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t._count.memberships}/20)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            صورة اللاعب (رابط)
          </label>
          <input
            name="photoUrl"
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="https://example.com/photo.jpg"
            dir="ltr"
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

export default function PlayersTable({
  players,
  teams,
}: {
  players: PlayerRow[];
  teams: TeamOption[];
}) {
  if (players.length === 0) {
    return (
      <div className="rounded-sm border border-line bg-bg-raised px-6 py-10 text-center">
        <p className="font-body text-sm text-text-dim">
          لا يوجد لاعبون بعد. أضف لاعب للبدء.
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
              الاسم
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              الفريق
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              المركز
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              رقم القميص
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              إجراءات
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {players.map((player) => (
            <tr
              key={player.id}
              className="transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {player.photoUrl ? (
                    <Image
                      src={player.photoUrl}
                      alt={player.user.fullName}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-bg-raised2 flex-shrink-0">
                      <svg className="h-4 w-4 text-text-dimmer" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <div className="font-body text-sm font-bold text-text">
                      {player.user.fullName}
                    </div>
                    <div className="font-body text-[12px] text-text-dimmer" dir="ltr">
                      {player.user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-body text-sm text-text-dim">
                {player.memberships[0]?.team.name ?? (
                  <span className="text-text-dimmer">بدون فريق</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-sm border border-line bg-white/[0.03] px-2 py-0.5 font-utility text-[10px] tracking-wider text-text-dim">
                  {POSITION_LABELS[player.position] ?? player.position}
                </span>
              </td>
              <td className="px-4 py-3 font-num text-sm text-gold">
                {player.jerseyNumber ?? "—"}
              </td>
              <td className="px-4 py-3">
                <form
                  action={async () => {
                    await deletePlayer(player.id);
                  }}
                  className="inline"
                >
                  <DeleteButton />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
