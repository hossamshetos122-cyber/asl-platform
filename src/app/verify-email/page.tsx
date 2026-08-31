"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { verifyEmailAction, type RecoveryResult } from "@/lib/actions/recovery";

const initialState: RecoveryResult = { success: false };

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, formAction, pending] = useActionState(verifyEmailAction, initialState);

  if (!token) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <p className="font-body text-sm text-live">الرابط غير صالح. اطلب رابط تأكيد جديداً من لوحة التحكم.</p>
        <div className="mt-4">
          <Link href="/dashboard" className="font-body text-xs font-bold text-accent hover:text-accent-bright transition-colors">
            الذهاب إلى لوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <svg className="h-8 w-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>
        <h2 className="font-display text-lg font-black text-text">تم تأكيد بريدك الإلكتروني</h2>
        <p className="mt-2 font-body text-sm text-text-dim">حسابك الآن مفعّل بالكامل.</p>
        <div className="mt-5">
          <Link href="/dashboard" className="btn-primary inline-block">الذهاب إلى لوحة التحكم</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-6 text-center">
      <p className="font-body text-sm text-text-dim">اضغط الزر لتأكيد بريدك الإلكتروني.</p>
      <form action={formAction} className="mt-5">
        <input type="hidden" name="token" value={token} />
        {state.error && <p className="mb-4 font-body text-xs text-live">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "جارٍ التأكيد..." : "تأكيد البريد الإلكتروني"}
        </button>
      </form>
    </div>
  );
}

function Fallback() {
  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-surface-elevated" />
      <div className="mx-auto mt-4 h-4 w-40 animate-pulse rounded bg-surface-elevated" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/images/league-logo.jpg" alt="شعار الدوري" width={1280} height={698} className="relative h-16 w-16 rounded-full object-cover border border-accent/20 shadow-glow mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text">تأكيد البريد الإلكتروني</h1>
        </div>
        <Suspense fallback={<Fallback />}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}