"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";

interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/tournaments", label: "البطولات" },
  { href: "/matches", label: "المباريات" },
  { href: "/standings", label: "الترتيب" },
  { href: "/top-scorers", label: "الهدافين" },
  { href: "/teams", label: "الفرق" },
] as const;

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setAuthLoaded(true));
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.05] lg:hidden"
        aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-text-dim">
          {open ? (
            <>
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </>
          ) : (
            <>
              <line x1="3" y1="5.5" x2="17" y2="5.5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="14.5" x2="17" y2="14.5" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <nav className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-surface border-l border-line-strong overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-line p-4">
              <Image
                src="/images/league-logo.jpg"
                alt="شعار الدوري"
                width={1280}
                height={698}
                className="h-9 w-9 rounded-full object-cover border border-gold/20 flex-shrink-0"
              />
              <div>
                <div className="font-display text-sm font-black text-text">دوري نجوم الإسكندرية</div>
                <div className="font-utility text-[8px] tracking-[0.18em] text-gold/60 uppercase">Alexandria Amateur League</div>
              </div>
            </div>

            {/* Nav Links */}
            <div className="p-2">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center rounded-lg px-4 py-3 font-body text-sm font-bold transition-colors ${
                      isActive
                        ? "bg-gold/8 text-gold border-r-2 border-gold"
                        : "text-text-dim hover:bg-white/[0.03] hover:text-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="mx-4 border-t border-line" />

            {/* Auth Section */}
            <div className="p-2">
              {authLoaded && user ? (
                <>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-4 py-3 font-body text-sm font-bold text-gold hover:bg-white/[0.03]">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                      لوحة التحكم
                    </Link>
                  )}
                  <div className="flex items-center justify-between rounded-lg px-4 py-3">
                    <span className="font-body text-sm font-bold text-text-dim truncate">{user.fullName}</span>
                    <button type="button" onClick={async () => { await logoutAction(); window.location.href = "/"; }} className="font-body text-sm font-bold text-text-dimmer transition-colors hover:text-live">
                      خروج
                    </button>
                  </div>
                </>
              ) : authLoaded ? (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="flex items-center rounded-lg px-4 py-3 font-body text-sm font-bold text-text-dim hover:bg-white/[0.03] hover:text-text">تسجيل الدخول</Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="flex items-center rounded-lg px-4 py-3 font-body text-sm font-bold text-gold hover:bg-white/[0.03]">إنشاء حساب</Link>
                </>
              ) : null}
            </div>

            {/* CTA */}
            <div className="p-3 border-t border-line">
              <Link href="/teams/new" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 font-body text-sm font-extrabold text-bg transition-all hover:bg-gold-bright">
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
                إنشاء فريق
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
