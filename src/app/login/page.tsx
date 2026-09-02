"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { loginAction, type AuthResult } from "@/lib/actions/auth";

const initialState: AuthResult = { success: false };

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";
  const message = searchParams.get("message") || "";
  const [state, formAction, pending] = useActionState(
    (_prev: AuthResult, formData: FormData) => loginAction(_prev, formData, redirect),
    initialState,
  );

  return (
    <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      {message && (
        <div className="mb-5 rounded-lg border border-accent/30 bg-accent/10 px-3.5 py-2.5 font-body text-sm text-accent">{message}</div>
      )}
      {state.error && (
        <div className="mb-5 rounded-lg border border-live/20 bg-live/5 px-3.5 py-2.5 font-body text-sm text-live">{state.error}</div>
      )}
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">البريد الإلكتروني</label>
          <input id="email" name="email" type="email" required className="input-field" placeholder="example@email.com" />
          {state.fieldErrors?.email && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">كلمة المرور</label>
          <input id="password" name="password" type="password" required className="input-field" placeholder="••••••••" />
          {state.fieldErrors?.password && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.password}</p>}
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 font-body text-xs text-text-dim cursor-pointer select-none">
            <input type="checkbox" name="remember" className="h-3.5 w-3.5 accent-accent" />
            تذكرني
          </label>
          <Link href="/forgot-password" className="inline-block font-body text-xs font-bold text-accent hover:text-accent-bright transition-colors">
            نسيت كلمة المرور؟
          </Link>
        </div>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
      <p className="mt-5 text-center font-body text-xs text-text-dimmer">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="inline-block py-2.5 font-bold text-accent hover:text-accent-bright transition-colors">أنشئ حساباً جديداً</Link>
      </p>
    </div>
  );
}

function LoginFallback() {
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

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg flex items-center justify-center px-4">
      {/* Brand stage */}
      <div className="hero-glow-orb -top-40 right-[-120px] h-96 w-96 bg-accent/10" />
      <div className="hero-glow-orb bottom-[-160px] left-[-120px] h-96 w-96 bg-accent/[0.07]" />

      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-body text-sm font-bold text-text-dim transition-colors hover:text-accent"
      >
        <svg className="h-4 w-4" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M7 3l3 3-3 3" /></svg>
        الرئيسية
      </Link>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/images/league-logo.jpg" alt="شعار الدوري" width={1280} height={698} className="relative h-16 w-16 rounded-full object-cover border-2 border-accent/30 shadow-glow mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text">تسجيل الدخول</h1>
          <p className="mt-1.5 font-body text-sm text-text-dim">سجّل دخولك للوصول إلى لوحة التحكم.</p>
        </div>
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
