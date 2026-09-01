"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createPlayer, deletePlayer, updatePlayer } from "@/lib/actions/players";
import { ImageDisplay } from "@/components/ui/image-display";
import { ImageUpload } from "@/components/ui/image-upload";

interface PlayerRow {
  id: string;
  jerseyNumber: number | null;
  position: string;
  dateOfBirth: Date | null;
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
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "جارِ الحفظ..." : "حفظ"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} onClick={(e) => { if (!confirm("هل أنت متأكد من حذف اللاعب؟")) e.preventDefault(); }} className="btn-danger-outline">
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

function formatDateInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0] ?? "";
}

function formatBirthdate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(date));
}

function InlineCreateForm({ teams }: { teams: TeamOption[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isAdding) {
    return (
      <button onClick={() => setIsAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-5 py-2.5 font-body text-[12px] font-bold text-accent transition-all hover:bg-accent/20">
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8 3v10M3 8h10" />
        </svg>
        إضافة لاعب
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        setError(null);
        formData.set("photoUrl", photoUrl || "");
        const res = await createPlayer({ success: false }, formData);
        if (res.success) {
          setIsAdding(false);
          setPhotoUrl(null);
          window.location.reload();
        } else {
          setError(res.error || "حدث خطأ");
        }
      }}
      className="rounded-xl border border-accent/20 bg-surface p-5"
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <ImageUpload name="photoUrl" purpose="player-photo" label="صورة اللاعب" value={photoUrl} onChange={setPhotoUrl} />
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الاسم الكامل</label>
          <input name="fullName" required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent" placeholder="محمد أحمد" />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المركز</label>
          <select name="position" className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent">
            {POSITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">رقم القميص</label>
          <input type="number" name="jerseyNumber" min={0} max={99} className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent" placeholder="10" />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">تاريخ الميلاد</label>
          <input type="date" name="dateOfBirth" className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent" />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الفريق</label>
          <select name="teamId" required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent">
            <option value="">اختر الفريق</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t._count.memberships}/20)</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-3 rounded-lg border border-line bg-surface-elevated/50 px-4 py-2 font-body text-[11px] text-text-dim">
        سيتم إنشاء حساب تسجيل دخول تلقائي للاعب عند الإضافة.
      </div>
      {error && <div className="mb-3 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">{error}</div>}
      <div className="flex items-center gap-3">
        <SubmitButton />
        <button type="button" onClick={() => { setIsAdding(false); setPhotoUrl(null); }} className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text">
          إلغاء
        </button>
      </div>
    </form>
  );
}

function PlayerDeleteRow({ playerId }: { playerId: string }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <form action={async () => {
        try {
          const res = await deletePlayer(playerId);
          if (res.success) window.location.reload();
          else setError(res.error || "حدث خطأ");
        } catch {
          setError("حدث خطأ غير متوقع");
        }
      }} className="inline">
        <DeleteButton />
      </form>
      {error && <p className="mt-1 font-body text-[10px] text-live">{error}</p>}
    </div>
  );
}

function InlineEditForm({ player, onClose }: { player: PlayerRow; onClose: () => void }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(player.photoUrl);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr>
      <td colSpan={6} className="px-4 py-3">
        <form action={async (formData) => {
          setError(null);
          try {
            if (photoUrl !== undefined) formData.set("photoUrl", photoUrl || "");
            const res = await updatePlayer(player.id, formData);
            if (res.success) {
              onClose();
              window.location.reload();
            } else {
              setError(res.error || "حدث خطأ");
            }
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "حدث خطأ");
          }
        }} className="rounded-xl border border-accent/20 bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2"><ImageUpload name="photoUrl" purpose="player-photo" label="صورة اللاعب" value={photoUrl} onChange={setPhotoUrl} /></div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الاسم الكامل</label>
              <input name="fullName" defaultValue={player.user.fullName} required className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المركز</label>
              <select name="position" defaultValue={player.position} className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-accent">
                {POSITION_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">رقم القميص</label>
              <input type="number" name="jerseyNumber" min={0} max={99} defaultValue={player.jerseyNumber ?? ""} className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">تاريخ الميلاد</label>
              <input type="date" name="dateOfBirth" defaultValue={formatDateInput(player.dateOfBirth)} className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">رقم الهاتف</label>
              <input name="phone" type="tel" className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none focus:border-accent" dir="ltr" placeholder="+20..." />
            </div>
          </div>
          {error && <div className="mt-3 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">{error}</div>}
          <div className="mt-4 flex items-center gap-3">
            <button type="submit" className="btn-primary">تحديث</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text">إلغاء</button>
          </div>
        </form>
      </td>
    </tr>
  );
}

export default function PlayersTable({
  players,
  teams,
}: {
  players: PlayerRow[];
  teams: TeamOption[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      <InlineCreateForm teams={teams} />
      {players.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <p className="font-body text-sm text-text-dim">لا يوجد لاعبون بعد. أضف لاعب للبدء.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-line bg-surface-elevated/50">
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الاسم</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الفريق</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المركز</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">رقم القميص</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">تاريخ الميلاد</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {players.map((player) =>
                editingId === player.id ? (
                  <InlineEditForm key={player.id} player={player} onClose={() => setEditingId(null)} />
                ) : (
                  <tr key={player.id} className="transition-colors hover:bg-surface-elevated/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ImageDisplay src={player.photoUrl} alt={player.user.fullName} type="player" size="sm" />
                        <div>
                          <div className="font-body text-sm font-bold text-text">{player.user.fullName}</div>
                          <div className="font-body text-[12px] text-text-dimmer" dir="ltr">{player.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-text-dim">
                      {player.memberships[0]?.team.name ?? <span className="text-text-dimmer">بدون فريق</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-line bg-surface-elevated px-2 py-0.5 font-utility text-[10px] tracking-wider text-text-dim">
                        {POSITION_LABELS[player.position] ?? player.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-num text-sm font-bold text-accent">{player.jerseyNumber ?? "—"}</td>
                    <td className="px-4 py-3 font-body text-sm text-text-dim">{formatBirthdate(player.dateOfBirth)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingId(player.id)} className="rounded-lg border border-accent/30 bg-accent/10 px-3 font-body text-[11px] font-bold text-accent transition-colors hover:bg-accent/20 min-h-11">تعديل</button>
                        <PlayerDeleteRow playerId={player.id} />
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
