"use client";

import { useActionState } from "react";
import { claimPlayerAccount, type ClaimPlayerResult } from "@/lib/actions/players";

const initialState: ClaimPlayerResult = { success: false };

export function ClaimPlayerAccount({ playerId, phoneSet }: { playerId: string; phoneSet: boolean }) {
  const [state, formAction, pending] = useActionState(claimPlayerAccount, initialState);

  return (
    <div className="rounded-xl border border-accent/20 bg-gradient-to-b from-accent/8 to-surface p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-display text-base font-black text-text">
        <svg className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="12" height="14" rx="2" /><path d="M8 8h4M8 11h4" />
        </svg>
        هذا اللاعب؟ فعّل حسابك
      </h2>
      <p className="mt-1.5 font-body text-[12px] leading-relaxed text-text-dim">
        {state.success
          ? "تم تفعيل الحساب. استخدم الرابط المرسل لتحديد كلمة المرور ثم سجّل الدخول."
          : "أدخل بريدك الإلكتروني" + (phoneSet ? " ورقم هاتفك المسجل" : "") + " لنرسل لك رابط تفعيل يمكنك من تحديد كلمة المرور والدخول بحسابك."}
      </p>

      {!state.success && (
        <form action={formAction} className="mt-3 space-y-3">
          <input type="hidden" name="playerId" value={playerId} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-body text-xs font-bold text-text-dim">البريد الإلكتروني *</label>
              <input
                name="email"
                type="email"
                required
                dir="ltr"
                placeholder="player@example.com"
                className="input-field w-full text-left"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs font-bold text-text-dim">رقم الهاتف{phoneSet ? " *" : " (اختياري)"}</label>
              <input
                name="phone"
                type="tel"
                required={phoneSet}
                dir="ltr"
                placeholder="+20..."
                className="input-field w-full text-left"
              />
            </div>
          </div>

          {state.error && (
            <div className="rounded-lg border border-live/30 bg-live/10 px-3 py-2 font-body text-[12px] text-live">{state.error}</div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className="btn-primary text-[12px]">
              {pending ? "جارٍ الإرسال..." : "تفعيل الحساب"}
            </button>
            {state.setupLink && (
              <a
                href={state.setupLink}
                className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 font-body text-[12px] font-bold text-accent transition-colors hover:bg-accent/20"
              >
                فتح رابط التفعيل مباشرة
              </a>
            )}
          </div>
        </form>
      )}

      {state.success && (
        <div className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 font-body text-[12px] font-bold text-green-400">
          تم إرسال رابط التفعيل إلى بريدك الإلكتروني (صالح لمدة ساعة).
        </div>
      )}
    </div>
  );
}