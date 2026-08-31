"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { requestPasswordResetAction, type RecoveryResult } from "@/lib/actions/recovery";

const initialState: RecoveryResult = { success: false };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/images/league-logo.jpg" alt="شعار الدوري" width={1280} height={698} className="relative h-16 w-16 rounded-full object-cover border border-accent/20 shadow-glow mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text">استعادة كلمة المرور</h1>
          <p className="mt-1.5 font-body text-sm text-text-dim">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          {state.success ? (
            <div className="text-center py-2">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </div>
              <h2 className="font-display text-base font-black text-text">تم إرسال رابط الاستعادة</h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-text-dim">
                {state.resetLink
                  ? "لم يتم تفعيل خدمة البريد بعد — استخدم الرابط أدناه مباشرة لإكمال العملية."
                  : "راجع بريدك الإلكتروني. إذا كان الحساب مسجّلاً، ستصل رسالة تحتوي على رابط خلال دقائق."}
              </p>
              {state.resetLink && (
                <a href={state.resetLink} className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 font-body text-xs font-bold text-accent break-all transition-colors hover:bg-accent/20">
                  {state.resetLink}
                </a>
              )}
              <div className="mt-6">
                <Link href="/login" className="inline-block font-body text-xs font-bold text-accent hover:text-accent-bright transition-colors">
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </div>
          ) : (
            <>
              {state.error && (
                <div className="mb-5 rounded-lg border border-live/20 bg-live/5 px-3.5 py-2.5 font-body text-sm text-live">{state.error}</div>
              )}
              <form action={formAction} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">البريد الإلكتروني</label>
                  <input id="email" name="email" type="email" required className="input-field" placeholder="example@email.com" />
                  {state.fieldErrors?.email && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.email}</p>}
                </div>
                <button type="submit" disabled={pending} className="btn-primary w-full">
                  {pending ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
                </button>
              </form>
              <p className="mt-5 text-center font-body text-xs text-text-dimmer">
                تذكّرت كلمة المرور؟{" "}
                <Link href="/login" className="inline-block py-2.5 font-bold text-accent hover:text-accent-bright transition-colors">سجّل دخولك</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}