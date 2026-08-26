"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createTournament,
  updateTournament,
  deleteTournament,
} from "@/lib/actions/tournaments";

interface TournamentRow {
  id: string;
  name: string;
  format: string;
  status: string;
  startDate: string;
  _count: { teams: number };
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
        if (!confirm("هل أنت متأكد من حذف البطولة؟")) {
          e.preventDefault();
        }
      }}
      className="rounded-sm border border-live/30 bg-live/10 px-3 py-1.5 font-body text-[11px] font-bold text-live transition-colors hover:bg-live/20 disabled:opacity-50"
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}

const FORMAT_OPTIONS = [
  { value: "LEAGUE", label: "دوري" },
  { value: "KNOCKOUT", label: "إقصائي" },
  { value: "GROUPS_KNOCKOUT", label: "مجموعات + إقصائي" },
] as const;

const STATUS_OPTIONS = [
  { value: "UPCOMING", label: "قادمة" },
  { value: "ONGOING", label: "جارية" },
  { value: "COMPLETED", label: "منتهية" },
  { value: "CANCELLED", label: "ملغاة" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "قادمة",
  ONGOING: "جارية",
  COMPLETED: "منتهية",
  CANCELLED: "ملغاة",
};

const FORMAT_LABELS: Record<string, string> = {
  LEAGUE: "دوري",
  KNOCKOUT: "إقصائي",
  GROUPS_KNOCKOUT: "مجموعات + إقصائي",
};

function InlineCreateForm() {
  const [isAdding, setIsAdding] = useState(false);

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="rounded-sm border border-gold/30 bg-gold/10 px-5 py-2.5 font-body text-[13px] font-bold text-gold transition-colors hover:bg-gold/20"
      >
        + إضافة بطولة
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createTournament(formData);
        setIsAdding(false);
      }}
      className="rounded-sm border border-line bg-bg-raised p-5"
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            اسم البطولة
          </label>
          <input
            name="name"
            required
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="دوري الإسكندرية"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            الصيغة
          </label>
          <select
            name="format"
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            الحالة
          </label>
          <select
            name="status"
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            تاريخ البدء
          </label>
          <input
            type="date"
            name="startDate"
            required
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
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

function EditRow({
  tournament,
  onClose,
}: {
  tournament: TournamentRow;
  onClose: () => void;
}) {
  return (
    <tr>
      <td colSpan={5} className="px-4 py-3">
        <form
          action={async (formData) => {
            await updateTournament(formData);
            onClose();
          }}
          className="rounded-sm border border-gold/30 bg-bg p-4"
        >
          <input type="hidden" name="id" value={tournament.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
                اسم البطولة
              </label>
              <input
                name="name"
                defaultValue={tournament.name}
                required
                className="w-full rounded-sm border border-line bg-bg-raised px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
                الصيغة
              </label>
              <select
                name="format"
                defaultValue={tournament.format}
                className="w-full rounded-sm border border-line bg-bg-raised px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
              >
                {FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
                الحالة
              </label>
              <select
                name="status"
                defaultValue={tournament.status}
                className="w-full rounded-sm border border-line bg-bg-raised px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
                تاريخ البدء
              </label>
              <input
                type="date"
                name="startDate"
                defaultValue={new Date(tournament.startDate).toISOString().split("T")[0]}
                required
                className="w-full rounded-sm border border-line bg-bg-raised px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-sm bg-gold px-5 py-2 font-body text-[13px] font-extrabold text-bg transition-colors hover:bg-gold-bright"
            >
              تحديث
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-line px-4 py-2 font-body text-[13px] font-bold text-text-dim transition-colors hover:text-text"
            >
              إلغاء
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

export default function TournamentsTable({
  tournaments,
}: {
  tournaments: TournamentRow[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (tournaments.length === 0) {
    return (
      <div className="rounded-sm border border-line bg-bg-raised px-6 py-10 text-center">
        <p className="font-body text-sm text-text-dim">
          لا توجد بطولات بعد. أضف بطولة للبدء.
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
              الصيغة
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              الحالة
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              الفرق
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              تاريخ البدء
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              إجراءات
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {tournaments.map((tournament) =>
            editingId === tournament.id ? (
              <EditRow
                key={tournament.id}
                tournament={tournament}
                onClose={() => setEditingId(null)}
              />
            ) : (
              <tr key={tournament.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-body text-sm font-bold text-text">
                  {tournament.name}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-dim">
                  {FORMAT_LABELS[tournament.format] ?? tournament.format}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-sm px-2 py-0.5 font-utility text-[10px] tracking-wider ${
                      tournament.status === "ONGOING"
                        ? "border border-gold/30 bg-gold/10 text-gold"
                        : tournament.status === "COMPLETED"
                          ? "border border-line bg-white/[0.04] text-text-dim"
                          : tournament.status === "CANCELLED"
                            ? "border border-live/30 bg-live/10 text-live"
                            : "border border-line bg-white/[0.04] text-text-dimmer"
                    }`}
                  >
                    {STATUS_LABELS[tournament.status] ?? tournament.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-num text-sm text-text">
                  {tournament._count.teams}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-dim">
                  {new Intl.DateTimeFormat("ar-EG").format(
                    new Date(tournament.startDate)
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(tournament.id)}
                      className="rounded-sm border border-gold/30 bg-gold/10 px-3 py-1.5 font-body text-[11px] font-bold text-gold transition-colors hover:bg-gold/20"
                    >
                      تعديل
                    </button>
                    <form
                      action={async (formData) => {
                        await deleteTournament(formData);
                      }}
                      className="inline"
                    >
                      <input type="hidden" name="id" value={tournament.id} />
                      <DeleteButton />
                    </form>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
