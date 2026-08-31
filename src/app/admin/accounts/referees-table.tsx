"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createRefereeAccount } from "@/lib/actions/accounts";

export interface RefereeRow {
  id: string;
  fullName: string;
  email: string;
  licenseNo: string | null;
  assignments: number;
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? pendingLabel : label}
    </button>
  );
}

function CreateRefereeForm({ onCreated }: { onCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-live/30 bg-live/10 px-5 py-2.5 font-body text-[12px] font-bold text-live transition-all hover:bg-live/20"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8 3v10M3 8h10" />
        </svg>
        إنشاء حساب حكم
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        setError(null);
        const res = await createRefereeAccount(formData);
        if (res.ok) {
          setIsOpen(false);
          onCreated();
        } else {
          setError(res.error || "حدث خطأ");
        }
      }}
      className="rounded-xl border border-live/20 bg-surface p-5"
    >
      {error && <div className="mb-4 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">{error}</div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم الحكم</label>
          <input
            name="fullName"
            required
            minLength={2}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            placeholder="محمد عبد الفتاح"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">البريد الإلكتروني</label>
          <input
            name="email"
            type="email"
            required
            dir="ltr"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            placeholder="referee@example.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">كلمة المرور</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            dir="ltr"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            placeholder="8 أحرف على الأقل"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">رقم الرخصة (اختياري)</label>
          <input
            name="licenseNo"
            maxLength={50}
            dir="ltr"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            placeholder="REF-2024-001"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <SubmitButton label="إنشاء الحساب" pendingLabel="جارٍ الإنشاء..." />
        <button
          type="button"
          onClick={() => { setIsOpen(false); setError(null); }}
          className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

export default function RefereesTable({ referees }: { referees: RefereeRow[] }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h2 className="font-display text-lg font-black text-text">حكام المباريات</h2>
          <p className="mt-1 font-body text-[12px] text-text-dim">
            كل حكم لديه صلاحية تسجيل النتائج والأحداث في المباريات المسندة إليه فقط عبر بوابة الحكم «/referee».
          </p>
        </div>
        <span className="badge-live font-num">{referees.length}</span>
      </div>

      <CreateRefereeForm onCreated={() => router.refresh()} />

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-line bg-surface-elevated/50">
              <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الحكم</th>
              <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">رقم الرخصة</th>
              <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">إسنادات</th>
              <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الدور</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/50">
            {referees.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center">
                  <p className="font-body text-sm text-text-dim">لا توجد حسابات حكام بعد.</p>
                </td>
              </tr>
            )}
            {referees.map((ref) => (
              <tr key={ref.id} className="transition-colors hover:bg-surface-elevated/50">
                <td className="px-4 py-3">
                  <div className="font-body text-sm font-bold text-text">{ref.fullName}</div>
                  <div className="mt-0.5 font-body text-[11px] text-text-dimmer" dir="ltr">{ref.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-num text-[12px] font-bold text-text-dim">{ref.licenseNo || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="badge-accent font-num">{ref.assignments}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="badge-live">حكم</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-body text-[11px] text-text-dimmer">
        لتعيين حكم لمباراة: أنشئ الحساب هنا ثم اختر الحكم من نموذج «إضافة مباراة» في إدارة المباريات.
      </p>
    </div>
  );
}