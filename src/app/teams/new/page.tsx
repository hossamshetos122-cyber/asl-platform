"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createTeam } from "@/lib/actions/teams";
import { ImageUpload } from "@/components/ui/image-upload";
import type { Result } from "@/lib/types";

type TeamResult = Result<{ id: string }>;

const initialState: TeamResult = { status: "empty" };

interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function NewTeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createTeam, initialState);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setAuthLoaded(true));
  }, []);

  useEffect(() => {
    if (state.status === "success" && state.data) {
      router.push(`/teams/${state.data.id}`);
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    formData.set("logoUrl", logoUrl || "");
    formAction(formData);
  };

  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-surface-elevated" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="relative mb-5 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gold/20 blur-xl" />
            <Image
              src="/images/league-logo.jpg"
              alt="شعار الدوري"
              width={1280}
              height={698}
              className="relative h-16 w-16 mx-auto rounded-full object-cover border-2 border-gold/30 shadow-glow-lg"
            />
          </div>
          <h1 className="font-display text-2xl font-black text-text mb-4">إنشاء فريق</h1>
          <p className="font-body text-sm text-text-dim mb-6">يجب تسجيل الدخول أولاً لإنشاء فريق.</p>
          <Link href="/login?redirect=/teams/new" className="btn-primary inline-block">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-gold/20 blur-xl" />
            <Image
              src="/images/league-logo.jpg"
              alt="شعار الدوري"
              width={1280}
              height={698}
              className="relative h-16 w-16 rounded-full object-cover border-2 border-gold/30 shadow-glow-lg"
            />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text">إنشاء فريق</h1>
          <p className="mt-2 font-body text-sm text-text-dim">سجّل فريقك للمشاركة في البطولات.</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6 sm:p-8 shadow-deep">
          {state.status === "error" && (
            <div className="mb-6 rounded-lg border border-live/30 bg-live/10 px-4 py-3 font-body text-sm text-live">
              {state.message}
            </div>
          )}

          {state.status === "success" ? (
            <div className="text-center py-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 mx-auto">
                <svg className="h-6 w-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="font-body text-sm text-text mb-4">تم إنشاء الفريق بنجاح!</p>
              <Link href={`/teams/${state.data.id}`} className="btn-primary">عرض الفريق</Link>
            </div>
          ) : (
            <form ref={formRef} action={handleSubmit} className="space-y-5">
              <ImageUpload
                name="logoUrl"
                purpose="team-logo"
                label="شعار الفريق"
                value={logoUrl}
                onChange={setLogoUrl}
              />
              <div>
                <label htmlFor="name" className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم الفريق</label>
                <input id="name" name="name" type="text" required className="input-field" placeholder="اسم الفريق" />
              </div>
              <div>
                <label htmlFor="shortName" className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الاسم المختصر</label>
                <input id="shortName" name="shortName" type="text" required className="input-field" placeholder="2-3 حروف" maxLength={5} />
              </div>
              <div>
                <label htmlFor="city" className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المدينة</label>
                <input id="city" name="city" type="text" className="input-field" placeholder="الإسكندرية" defaultValue="الإسكندرية" />
              </div>
              <button type="submit" disabled={pending} className="btn-primary w-full">
                {pending ? "جارٍ الإنشاء..." : "إنشاء الفريق"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
