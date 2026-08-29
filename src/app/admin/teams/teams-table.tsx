"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createTeam, updateTeam, deleteTeam } from "@/lib/actions/teams";
import { ImageDisplay } from "@/components/ui/image-display";
import { ImageUpload } from "@/components/ui/image-upload";

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
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "جارِ الحفظ..." : "حفظ"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} onClick={(e) => { if (!confirm("هل أنت متأكد من حذف الفريق؟")) e.preventDefault(); }} className="btn-danger-outline">
      {pending ? "..." : "حذف"}
    </button>
  );
}

function InlineCreateForm() {
  const [isAdding, setIsAdding] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-5 py-2.5 font-body text-[12px] font-bold text-gold transition-all hover:bg-gold/20"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8 3v10M3 8h10" />
        </svg>
        إضافة فريق
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        setError(null);
        formData.set("logoUrl", logoUrl || "");
        const res = await createTeam({ status: "empty" }, formData);
        if (res.status === "success") {
          window.location.reload();
        } else if (res.status === "error") {
          setError(res.message || "حدث خطأ");
        }
      }}
      className="rounded-xl border border-gold/20 bg-surface p-5"
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <ImageUpload
          name="logoUrl"
          purpose="team-logo"
          label="شعار الفريق"
          value={logoUrl}
          onChange={setLogoUrl}
        />
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم الفريق</label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="نادي الإسكندرية"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الاسم المختصر</label>
          <input
            name="shortName"
            required
            maxLength={5}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="ESK"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المدينة</label>
          <input
            name="city"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-gold"
            placeholder="الإسكندرية"
          />
        </div>
      </div>
      {error && <div className="mb-4 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">{error}</div>}
      <div className="flex items-center gap-3">
        <SubmitButton />
        <button
          type="button"
          onClick={() => { setIsAdding(false); setLogoUrl(null); setError(null); }}
          className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

function EditRow({ team, onClose }: { team: TeamRow; onClose: () => void }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(team.crestUrl);
  const [error, setError] = useState<string | null>(null);
  return (
    <tr>
      <td colSpan={5} className="px-4 py-3">
        {error && (
          <div className="mb-3 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-sm text-live">{error}</div>
        )}
        <form
          action={async (formData) => {
            setError(null);
            if (logoUrl !== undefined) formData.set("logoUrl", logoUrl || "");
            try {
              await updateTeam(formData);
              onClose();
            } catch (e: unknown) {
              setError(e instanceof Error ? e.message : "حدث خطأ");
            }
          }}
          className="rounded-xl border border-gold/20 bg-surface p-4"
        >
          <input type="hidden" name="id" value={team.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <ImageUpload
              name="logoUrl"
              purpose="team-logo"
              label="شعار الفريق"
              value={logoUrl}
              onChange={setLogoUrl}
            />
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم الفريق</label>
              <input
                name="name"
                defaultValue={team.name}
                required
                className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الاسم المختصر</label>
              <input
                name="shortName"
                defaultValue={team.shortName}
                required
                maxLength={5}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المدينة</label>
              <input
                name="city"
                defaultValue={team.city}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-gold"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-b from-gold to-gold-dim px-5 py-2 font-body text-[12px] font-extrabold text-bg transition-all hover:from-gold-bright hover:to-gold"
            >
              تحديث
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text"
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

  return (
    <>
      <InlineCreateForm />
      {teams.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <p className="font-body text-sm text-text-dim">لا توجد فرق بعد. أضف فريق للبدء.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-line bg-surface-elevated/50">
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الاسم</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المختصر</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المدينة</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اللاعبين</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {teams.map((team) =>
                editingId === team.id ? (
                  <EditRow key={team.id} team={team} onClose={() => setEditingId(null)} />
                ) : (
                  <TeamDeleteRow key={team.id} team={team} onEdit={() => setEditingId(team.id)} />
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function TeamDeleteRow({ team, onEdit }: { team: TeamRow; onEdit: () => void }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="transition-colors hover:bg-surface-elevated/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <ImageDisplay src={team.crestUrl} alt={`شعار ${team.name}`} type="team-logo" size="sm" shortCode={team.shortName} />
          <span className="font-body text-sm font-bold text-text">{team.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface-elevated font-utility text-[10px] font-bold text-gold">{team.shortName}</span>
      </td>
      <td className="px-4 py-3 font-body text-sm text-text-dim">{team.city || "—"}</td>
      <td className="px-4 py-3 font-num text-sm font-bold text-text">{team._count.memberships}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 font-body text-[11px] font-bold text-gold transition-colors hover:bg-gold/20">تعديل</button>
          <form action={async (formData) => {
            try {
              await deleteTeam(formData);
              window.location.reload();
            } catch (e: unknown) {
              setError(e instanceof Error ? e.message : "حدث خطأ");
            }
          }} className="inline">
            <input type="hidden" name="id" value={team.id} />
            <DeleteButton />
          </form>
          {error && <span className="font-body text-[11px] text-live">{error}</span>}
        </div>
      </td>
    </tr>
  );
}
