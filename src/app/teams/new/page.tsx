"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createTeam } from "@/lib/actions/teams";
import type { Result } from "@/lib/types";

type TeamResult = Result<{ id: string }>;

const initialState: TeamResult = { status: "empty" };

export default function NewTeamPage() {
  const [state, formAction, pending] = useActionState(createTeam, initialState);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Image
            src="/images/league-logo.jpg"
            alt="شعار الدوري"
            width={1280}
            height={698}
            className="mx-auto h-12 w-auto object-contain rounded-xl border border-line mb-4"
          />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text">إنشاء فريق</h1>
          <p className="mt-2 font-body text-sm text-text-dim">سجّل فريقك للمشاركة في البطولات.</p>
        </div>

        <div className="card p-6 sm:p-8">
          {state.status === "error" && (
            <div className="mb-6 rounded-lg border border-live/30 bg-live/10 px-4 py-3 font-body text-sm text-live">
              {state.message}
            </div>
          )}

          {state.status === "success" ? (
            <div className="text-center py-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 mx-auto">
                <svg className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="font-body text-sm text-text mb-4">تم إنشاء الفريق بنجاح!</p>
              <Link href={`/teams/${state.data.id}`} className="btn-primary">عرض الفريق</Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-1.5 block font-body text-sm font-bold text-text-dim">اسم الفريق</label>
                <input id="name" name="name" type="text" required className="input-field" placeholder="اسم الفريق" />
              </div>
              <div>
                <label htmlFor="shortName" className="mb-1.5 block font-body text-sm font-bold text-text-dim">الاسم المختصر</label>
                <input id="shortName" name="shortName" type="text" required className="input-field" placeholder="2-3 حروف" maxLength={5} />
              </div>
              <div>
                <label htmlFor="city" className="mb-1.5 block font-body text-sm font-bold text-text-dim">المدينة</label>
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
