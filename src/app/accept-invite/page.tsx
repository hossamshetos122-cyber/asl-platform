"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { acceptAdminInviteAction, type AdminActionResult } from "@/lib/actions/admin-admins";

const initialState: AdminActionResult = { ok: false };

function InviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, formAction, pending] = useActionState(acceptAdminInviteAction, initialState);

  if (state.ok) {
    return (
      <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-6 text-center">
        <h2 className="font-display text-lg font-black text-emerald-400">تم تفعيل حسابك!</h2>
        <p className="mt-1.5 font-body text-sm text-text-dim">يمكنك الآن تسجيل الدخول كأدمن بنفس الصلاحيات الكاملة.</p>
        <div className="mt-4">
          <Link href="/login" className="btn-primary inline-flex">تسجيل الدخول</Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <p className="font-body text-sm text-live">الرابط غير صالح. اطلب دعوة جديدة من صفحة إعدادات الأدمن.</p>
        <div className="mt-4">
          <Link href="/login" className="font-body text-xs font-bold text-accent hover:text-accent-bright transition-colors">
            العودة لتسجيل الدخول
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
          <label htmlFor="fullName" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">الاسم الكامل</label>
          <input id="fullName" name="fullName" type="text" required className="input-field" placeholder="محمد أحمد" />
          {state.fieldErrors?.fullName && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.fullName}</p>}
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">كلمة المرور</label>
          <input id="password" name="password" type="password" required minLength={8} className="input-field" placeholder="8 أحرف على الأقل" />
          {state.fieldErrors?.password && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block font-utility text-[9px] tracking-[0.12em] text-text-dimmer uppercase">تأكيد كلمة المرور</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className="input-field" placeholder="أعد كتابة كلمة المرور" />
          {state.fieldErrors?.confirmPassword && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.confirmPassword}</p>}
        </div>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "جارٍ التفعيل..." : "تفعيل حساب الأدمن"}
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

export default function AdminInvitePage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/images/league-logo.jpg" alt="شعار الدوري" width={1280} height={698} className="relative h-16 w-16 rounded-full object-cover border border-accent/20 shadow-glow mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text">انضم إلى الإدارة</h1>
          <p className="mt-1.5 font-body text-sm text-text-dim">حدد كلمة مرور خاصة بك لإكمال حساب الأدمن.</p>
        </div>
        <Suspense fallback={<Fallback />}>
          <InviteForm />
        </Suspense>
      </div>
    </div>
  );
}
