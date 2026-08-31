"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { resetPasswordAction, type RecoveryResult } from "@/lib/actions/recovery";

const initialState: RecoveryResult = { success: false };

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  if (!token) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <p className="font-body text-sm text-live">الرابط غير صالح. اطلب رابطاً جديداً من صفحة استعادة كلمة المرور.</p>
        <div className="mt-4">
          <Link href="/forgot-password" className="font-body text-xs font-bold text-accent hover:text-accent-bright transition-colors">
            انتقل إلى استعادة كلمة المرور
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      {state.error && (
        <div className="mb-5 rounded-lg border border-live/20 bg-live/5 px-3.5 py-2.5 font-body text-sm text-live">{state.error}</div>
      )}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <label htmlFor="password" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">كلمة المرور الجديدة</label>
          <input id="password" name="password" type="password" required minLength={8} className="input-field" placeholder="8 أحرف على الأقل" />
          {state.fieldErrors?.password && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">تأكيد كلمة المرور</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className="input-field" placeholder="أعد كتابة كلمة المرور" />
          {state.fieldErrors?.confirmPassword && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.confirmPassword}</p>}
        </div>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "جارٍ الحفظ..." : "تحديث كلمة المرور"}
        </button>
      </form>
    </div>
  );
}

function Fallback() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded-lg bg-surface-elevated" />
        <div className="h-10 animate-pulse rounded-lg bg-surface-elevated" />
        <div className="h-10 animate-pulse rounded-lg bg-accent/15" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/images/league-logo.jpg" alt="شعار الدوري" width={1280} height={698} className="relative h-16 w-16 rounded-full object-cover border border-accent/20 shadow-glow mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text">تحديد كلمة مرور جديدة</h1>
          <p className="mt-1.5 font-body text-sm text-text-dim">ستُجرّ خروجك من جميع الأجهزة بعد التحديث.</p>
        </div>
        <Suspense fallback={<Fallback />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}