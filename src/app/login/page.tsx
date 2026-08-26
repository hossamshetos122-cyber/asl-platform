"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { loginAction, type AuthResult } from "@/lib/actions/auth";

const initialState: AuthResult = { success: false };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/images/league-logo.jpg"
            alt="شعار الدوري"
            width={1280}
            height={698}
            className="mx-auto h-14 w-auto object-contain rounded-xl border border-line mb-4"
          />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text">
            تسجيل الدخول
          </h1>
          <p className="mt-2 font-body text-sm text-text-dim">
            سجّل دخولك للوصول إلى لوحة التحكم.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {state.error && (
            <div className="mb-6 rounded-lg border border-live/30 bg-live/10 px-4 py-3 font-body text-sm text-live">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block font-body text-sm font-bold text-text-dim">
                البريد الإلكتروني
              </label>
              <input id="email" name="email" type="email" required className="input-field" placeholder="example@email.com" />
              {state.fieldErrors?.email && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block font-body text-sm font-bold text-text-dim">
                كلمة المرور
              </label>
              <input id="password" name="password" type="password" required className="input-field" placeholder="••••••••" />
              {state.fieldErrors?.password && <p className="mt-1 font-body text-xs text-live">{state.fieldErrors.password}</p>}
            </div>

            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-xs text-text-dimmer">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="font-bold text-gold hover:text-gold-bright">أنشئ حساباً جديداً</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
