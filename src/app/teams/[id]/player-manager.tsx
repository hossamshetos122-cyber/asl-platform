"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createPlayer, removeFromTeam } from "@/lib/actions/players";
import { ImageUpload } from "@/components/ui/image-upload";

function AddPlayerButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mb-4 rounded-sm border border-accent/30 bg-accent/10 px-4 py-2 font-body text-[13px] font-bold text-accent transition-colors hover:bg-accent/20">
      + إضافة لاعب
    </button>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-sm bg-accent px-5 py-2 font-body text-[13px] font-extrabold text-[#0b1220] transition-colors hover:bg-accent-bright disabled:opacity-50">
      {pending ? "جارِ الحفظ..." : "إضافة اللاعب"}
    </button>
  );
}

const POSITION_OPTIONS = [
  { value: "GOALKEEPER", label: "حارس مرمى" },
  { value: "DEFENDER", label: "مدافع" },
  { value: "MIDFIELDER", label: "لاعب وسط" },
  { value: "FORWARD", label: "مهاجم" },
] as const;

export function PlayerManager({
  teamId,
  currentCount,
  maxCount,
}: {
  teamId: string;
  currentCount: number;
  maxCount: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const router = useRouter();

  const isFull = currentCount >= maxCount;

  if (showForm) {
    return (
      <form
        action={async (formData) => {
          setError(null);
          setSuccess(false);
          formData.set("teamId", teamId);
          formData.set("photoUrl", photoUrl || "");
          try {
            const res = await createPlayer({ success: false }, formData);
            if (res.success) {
              setSuccess(true);
              setSuccessInfo(res.info ?? null);
              setShowForm(false);
              setPhotoUrl(null);
              router.refresh();
            } else {
              setError(res.error || "حدث خطأ");
            }
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "حدث خطأ");
          }
        }}
        className="mb-4 rounded-lg border border-line bg-bg-raised p-4 space-y-3"
      >
        {error && (
          <div className="rounded border border-live/30 bg-live/10 px-3 py-2 font-body text-sm text-live">{error}</div>
        )}
        {success && (
          <div className="rounded border border-green-500/30 bg-green-500/10 px-3 py-2 font-body text-sm text-green-400">
            تم إضافة اللاعب بنجاح. {successInfo ? successInfo : "لم يصل الرابط؟ يمكن للاعب تفعيل حسابه من صفحته بالضغط على «هذا اللاعب؟ فعّل حسابك»."}
          </div>
        )}
        <ImageUpload
          name="photoUrl"
          purpose="player-photo"
          label="صورة اللاعب"
          value={photoUrl}
          onChange={setPhotoUrl}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-body text-xs font-bold text-text-dim">اسم اللاعب *</label>
            <input name="fullName" required className="input-field w-full" placeholder="محمد أحمد" />
          </div>
          <div>
            <label className="mb-1 block font-body text-xs font-bold text-text-dim">رقم القميص</label>
            <input name="jerseyNumber" type="number" min={0} max={99} className="input-field w-full" placeholder="10" />
          </div>
          <div>
            <label className="mb-1 block font-body text-xs font-bold text-text-dim">المركز</label>
            <select name="position" className="input-field w-full">
              {POSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-body text-xs font-bold text-text-dim">رقم الهاتف (اختياري)</label>
            <input name="phone" type="tel" className="input-field w-full" dir="ltr" placeholder="+20..." />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block font-body text-xs font-bold text-text-dim">البريد الإلكتروني (اختياري — لتفعيل حساب اللاعب)</label>
            <input name="email" type="email" dir="ltr" className="input-field w-full text-left" placeholder="player@example.com" />
          </div>
        </div>
        <div className="flex gap-2">
          <SubmitButton />
          <button type="button" onClick={() => { setShowForm(false); setError(null); setPhotoUrl(null); }} className="rounded-sm border border-line px-4 py-2 font-body text-[13px] font-bold text-text-dim transition-colors hover:text-text">
            إلغاء
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mb-4">
      {!isFull ? (
        <AddPlayerButton onClick={() => setShowForm(true)} />
      ) : (
        <p className="mb-2 font-body text-xs text-live">القائمة ممتلئة ({currentCount}/{maxCount})</p>
      )}
    </div>
  );
}

export function RemovePlayerButton({ teamId, playerId }: { teamId: string; playerId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline">
      <form
        action={async () => {
          if (!confirm("هل أنت متأكد من إزالة هذا اللاعب؟")) return;
          try {
            await removeFromTeam(teamId, playerId);
            router.refresh();
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "حدث خطأ أثناء إزالة اللاعب");
          }
        }}
        className="inline"
      >
        <button type="submit" className="rounded-sm border border-live/30 bg-live/10 px-2 py-1 font-body text-[10px] font-bold text-live transition-colors hover:bg-live/20">
          إزالة
        </button>
      </form>
      {error && <p className="mt-1 font-body text-[10px] text-live">{error}</p>}
    </div>
  );
}
