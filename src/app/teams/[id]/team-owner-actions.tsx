"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { updateTeam, deleteTeam } from "@/lib/actions/teams";
import { ImageUpload } from "@/components/ui/image-upload";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-sm bg-gold px-5 py-2 font-body text-[13px] font-extrabold text-bg transition-colors hover:bg-gold-bright disabled:opacity-50">
      {pending ? "جارِ الحفظ..." : "حفظ التعديلات"}
    </button>
  );
}

export function TeamEditForm({
  teamId,
  initialName,
  initialShortName,
  initialCity,
  initialCrestUrl,
}: {
  teamId: string;
  initialName: string;
  initialShortName: string;
  initialCity: string;
  initialCrestUrl: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialCrestUrl);
  const router = useRouter();

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="rounded-sm border border-gold/30 bg-gold/10 px-4 py-2 font-body text-[13px] font-bold text-gold transition-colors hover:bg-gold/20">
        تعديل الفريق
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        setError(null);
        formData.set("id", teamId);
        if (logoUrl !== undefined) formData.set("logoUrl", logoUrl || "");
        try {
          await updateTeam(formData);
          setEditing(false);
          router.refresh();
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "حدث خطأ");
        }
      }}
      className="space-y-4 rounded-lg border border-line bg-bg-raised p-4"
    >
      {error && (
        <div className="rounded border border-live/30 bg-live/10 px-3 py-2 font-body text-sm text-live">{error}</div>
      )}
      <ImageUpload
        name="logoUrl"
        label="شعار الفريق"
        value={logoUrl}
        onChange={setLogoUrl}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-body text-xs font-bold text-text-dim">اسم الفريق</label>
          <input name="name" defaultValue={initialName} required className="input-field w-full" />
        </div>
        <div>
          <label className="mb-1 block font-body text-xs font-bold text-text-dim">الاسم المختصر</label>
          <input name="shortName" defaultValue={initialShortName} required maxLength={5} className="input-field w-full" />
        </div>
        <div>
          <label className="mb-1 block font-body text-xs font-bold text-text-dim">المدينة</label>
          <input name="city" defaultValue={initialCity} className="input-field w-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <SaveButton />
        <button type="button" onClick={() => { setEditing(false); setLogoUrl(initialCrestUrl); }} className="rounded-sm border border-line px-4 py-2 font-body text-[13px] font-bold text-text-dim transition-colors hover:text-text">إلغاء</button>
      </div>
    </form>
  );
}

export function TeamDeleteButton({ teamId }: { teamId: string }) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        if (!confirm("هل أنت متأكد من حذف الفريق؟")) return;
        formData.set("id", teamId);
        await deleteTeam(formData);
        router.push("/dashboard");
      }}
      className="inline"
    >
      <button type="submit" className="rounded-sm border border-live/30 bg-live/10 px-4 py-2 font-body text-[13px] font-bold text-live transition-colors hover:bg-live/20">
        حذف الفريق
      </button>
    </form>
  );
}
