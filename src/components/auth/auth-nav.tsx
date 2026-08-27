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
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="hidden h-8 w-24 animate-pulse rounded-md bg-surface sm:block" />;
  }

  if (user) {
    return (
      <div className="hidden items-center gap-2.5 sm:flex">
        {user.role === "ADMIN" && (
          <Link href="/admin" className="rounded-lg border border-gold/20 bg-gold/5 px-3 py-1.5 font-body text-[12px] font-bold text-gold transition-all hover:bg-gold/10">
            التحكم
          </Link>
        )}
        {(user.role === "FAN" || user.role === "PLAYER") && (
          <Link href="/dashboard" className="rounded-lg border border-gold/20 bg-gold/5 px-3 py-1.5 font-body text-[12px] font-bold text-gold transition-all hover:bg-gold/10">
            لوحة التحكم
          </Link>
        )}
        <div className="h-4 w-px bg-line-strong" />
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/10 border border-gold/20">
            <span className="font-display text-[10px] font-bold text-gold">{user.fullName.charAt(0)}</span>
          </div>
          <span className="font-body text-[12px] font-bold text-text-dim max-w-[90px] truncate">{user.fullName}</span>
        </div>
        <button type="button" onClick={async () => { await logoutAction(); window.location.href = "/"; }} className="font-body text-[12px] font-bold text-text-dimmer transition-colors hover:text-live">
          خروج
        </button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Link href="/login" className="rounded-lg px-3 py-2 font-body text-[12px] font-bold text-text-dim transition-all hover:text-text">
        تسجيل الدخول
      </Link>
      <Link href="/register" className="rounded-lg bg-gold px-4 py-2 font-body text-[12px] font-extrabold text-bg transition-all hover:bg-gold-bright">
        إنشاء حساب
      </Link>
    </div>
  );
}
