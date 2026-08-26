"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export function AuthNav() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        setUser(data?.user ?? null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="hidden h-8 w-24 animate-pulse rounded-sm bg-bg-raised sm:block" />
    );
  }

  if (user) {
    return (
      <div className="hidden items-center gap-4 sm:flex">
        <span className="font-body text-sm font-bold text-text-dim">
          {user.fullName}
        </span>
        <form
          action={async () => {
            await logoutAction();
            setUser(null);
          }}
        >
          <button
            type="submit"
            className="font-body text-sm font-bold text-text-dimmer transition-colors hover:text-live"
          >
            خروج
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-4 sm:flex">
      <Link
        href="/login"
        className="font-body text-sm font-bold text-text-dim transition-colors hover:text-text"
      >
        تسجيل الدخول
      </Link>
      <Link
        href="/register"
        className="rounded-sm bg-gold px-6 py-2.5 font-body text-[13.5px] font-extrabold text-bg transition-colors hover:bg-gold-bright"
      >
        إنشاء حساب
      </Link>
    </div>
  );
}
