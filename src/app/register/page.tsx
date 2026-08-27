"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { registerAction, type AuthResult } from "@/lib/actions/auth";

const initialState: AuthResult = { success: false };

function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    (_prev: AuthResult, formData: FormData) => registerAction(_prev, formData),
    initialState,
  );

  return (
    <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      {state.error && (
        <div className="mb-5 rounded-lg border border-live/20 bg-live/5 px-3.5 py-2.5 font-body text-sm text-live">{state.error}</div>
      )}
      {state.success && (
        <div className="mb-5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3.5 py-2.5 font-body text-sm text-emerald-400">تم إنشاء الحساب بنجاح!</div>
      )}
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">الاسم الكامل</label>
          <input id="fullName" name="fullName" type="text" required className="input-field" placeholder="محمد أحمد" />
          {state.fieldErrors?.fullName && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.fullName}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">البريد الإلكتروني</label>
          <input id="email" name="email" type="email" required className="input-field" placeholder="example@email.com" />
          {state.fieldErrors?.email && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">كلمة المرور</label>
          <input id="password" name="password" type="password" required className="input-field" placeholder="8 أحرف على الأقل" />
          {state.fieldErrors?.password && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">تأكيد كلمة المرور</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required className="input-field" placeholder="أعد إدخال كلمة المرور" />
          {state.fieldErrors?.confirmPassword && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.confirmPassword}</p>}
        </div>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
        </button>
      </form>
      <p className="mt-5 text-center font-body text-xs text-text-dimmer">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-bold text-gold hover:text-gold-bright transition-colors">سجّل دخولك</Link>
      </p>
    </div>
  );
}

function RegisterFallback() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded-lg bg-surface-elevated" />
        <div className="h-10 animate-pulse rounded-lg bg-surface-elevated" />
        <div className="h-10 animate-pulse rounded-lg bg-surface-elevated" />
        <div className="h-10 animate-pulse rounded-lg bg-gold/15" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/images/league-logo.jpg" alt="شعار الدوري" width={1280} height={698} className="relative h-16 w-16 rounded-full object-cover border border-gold/20 shadow-glow mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text">إنشاء حساب جديد</h1>
          <p className="mt-1.5 font-body text-sm text-text-dim">أنشئ حسابك للبدء.</p>
        </div>
        <Suspense fallback={<RegisterFallback />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
