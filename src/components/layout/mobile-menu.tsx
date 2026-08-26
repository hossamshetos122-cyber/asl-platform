"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.05] lg:hidden"
        aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-text-dim"
        >
          {open ? (
            <>
              <line x1="4" y1="4" x2="18" y2="18" />
              <line x1="18" y1="4" x2="4" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="19" y2="6" />
              <line x1="3" y1="11" x2="19" y2="11" />
              <line x1="3" y1="16" x2="19" y2="16" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 top-[57px] z-40 bg-bg/98 backdrop-blur-lg lg:hidden">
          <nav className="flex flex-col gap-1 px-6 py-8">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-4 py-3 font-body text-base font-bold transition-colors ${
                    isActive
                      ? "bg-gold/10 text-gold border-r-2 border-gold"
                      : "text-text-dim hover:bg-white/[0.04] hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="my-4 border-t border-line" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 font-body text-base font-bold text-text-dim hover:bg-white/[0.04] hover:text-text"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/teams/new"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-gold px-6 py-3 text-center font-body text-sm font-extrabold text-bg transition-all hover:bg-gold-bright"
            >
              إنشاء فريق
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  );
}
