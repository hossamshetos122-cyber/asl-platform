"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createTeam, updateTeam, deleteTeam } from "@/lib/actions/teams";
import Image from "next/image";

interface TeamRow {
  id: string;
  name: string;
  shortName: string;
  city: string;
  crestUrl: string | null;
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
        if (!confirm("هل أنت متأكد من حذف الفريق؟")) {
          e.preventDefault();
        }
      }}
      className="rounded-sm border border-live/30 bg-live/10 px-3 py-1.5 font-body text-[11px] font-bold text-live transition-colors hover:bg-live/20 disabled:opacity-50"
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}

function InlineCreateForm() {
  const [isAdding, setIsAdding] = useState(false);

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="rounded-sm border border-gold/30 bg-gold/10 px-5 py-2.5 font-body text-[13px] font-bold text-gold transition-colors hover:bg-gold/20"
      >
        + إضافة فريق
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createTeam({ status: "empty" }, formData);
        setIsAdding(false);
      }}
      className="rounded-sm border border-line bg-bg-raised p-5"
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            اسم الفريق
          </label>
          <input
            name="name"
            required
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="نادي الإسكندرية"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            الاسم المختصر
          </label>
          <input
            name="shortName"
            required
            maxLength={5}
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="ESK"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            المدينة
          </label>
          <input
            name="city"
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="الإسكندرية"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
            شعار الفريق (رابط)
          </label>
          <input
            name="logoUrl"
            className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="https://example.com/logo.png"
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

function EditRow({ team, onClose }: { team: TeamRow; onClose: () => void }) {
  return (
    <tr>
      <td colSpan={6} className="px-4 py-3">
        <form
          action={async (formData) => {
            await updateTeam(formData);
            onClose();
          }}
          className="rounded-sm border border-gold/30 bg-bg p-4"
        >
          <input type="hidden" name="id" value={team.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
                اسم الفريق
              </label>
              <input
                name="name"
                defaultValue={team.name}
                required
                className="w-full rounded-sm border border-line bg-bg-raised px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
                الاسم المختصر
              </label>
              <input
                name="shortName"
                defaultValue={team.shortName}
                required
                maxLength={5}
                className="w-full rounded-sm border border-line bg-bg-raised px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
                المدينة
              </label>
              <input
                name="city"
                defaultValue={team.city}
                className="w-full rounded-sm border border-line bg-bg-raised px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[10px] tracking-wider text-text-dimmer">
                شعار الفريق (رابط)
              </label>
              <input
                name="logoUrl"
                defaultValue={team.crestUrl || ""}
                className="w-full rounded-sm border border-line bg-bg-raised px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
                placeholder="https://example.com/logo.png"
                dir="ltr"
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

export default function TeamsTable({ teams }: { teams: TeamRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (teams.length === 0) {
    return (
      <div className="rounded-sm border border-line bg-bg-raised px-6 py-10 text-center">
        <p className="font-body text-sm text-text-dim">
          لا توجد فرق بعد. أضف فريق للبدء.
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
              المختصر
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              المدينة
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              اللاعبين
            </th>
            <th className="px-4 py-3 font-utility text-[10px] tracking-wider text-text-dimmer">
              إجراءات
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {teams.map((team) =>
            editingId === team.id ? (
              <EditRow
                key={team.id}
                team={team}
                onClose={() => setEditingId(null)}
              />
            ) : (
              <tr key={team.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {team.crestUrl ? (
                      <Image
                        src={team.crestUrl}
                        alt={`شعار ${team.name}`}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded object-contain flex-shrink-0 border border-line"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-line bg-bg-raised2 font-display text-xs font-bold text-gold flex-shrink-0">
                        {team.shortName}
                      </div>
                    )}
                    <span className="font-body text-sm font-bold text-text">
                      {team.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-line bg-bg font-utility text-[10px] text-gold">
                    {team.shortName}
                  </span>
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-dim">
                  {team.city || "—"}
                </td>
                <td className="px-4 py-3 font-num text-sm text-text">
                  {team._count.memberships}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(team.id)}
                      className="rounded-sm border border-gold/30 bg-gold/10 px-3 py-1.5 font-body text-[11px] font-bold text-gold transition-colors hover:bg-gold/20"
                    >
                      تعديل
                    </button>
                    <form
                      action={async (formData) => {
                        await deleteTeam(formData);
                      }}
                      className="inline"
                    >
                      <input type="hidden" name="id" value={team.id} />
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
