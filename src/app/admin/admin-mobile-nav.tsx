"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";

interface NavItem {
  label: string;
  href: string;
}

const PRIMARY: NavItem[] = [
  { label: "لوحة", href: "/admin" },
  { label: "المباريات", href: "/admin/matches" },
  { label: "اللاعبون", href: "/admin/players" },
  { label: "الفرق", href: "/admin/teams" },
];

const MORE: NavItem[] = [
  { label: "البطولات", href: "/admin/tournaments" },
  { label: "الموقوفون", href: "/admin/suspensions" },
  { label: "فريق الأسبوع", href: "/admin/team-of-week" },
  { label: "حسابات الفرق", href: "/admin/accounts" },
  { label: "الأخبار", href: "/admin/news" },
  { label: "الإعدادات", href: "/admin/settings" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        {PRIMARY.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[56px] items-center justify-center py-1.5 font-body text-[12px] font-bold transition-colors ${active ? "bg-accent/[0.08] text-accent-bright" : "text-text-dim hover:text-text"}`}
            >
              <span className={`text-center leading-tight ${active ? "" : ""}`}>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 font-body text-[12px] font-bold transition-colors text-text-dim hover:text-text`}
        >
          <span className="text-[12px] leading-none">⁞</span>
          <span>المزيد</span>
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
              <span className="font-display text-sm font-black text-text">المزيد</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="flex h-9 w-9 items-center justify-center rounded-lg font-body text-lg text-text-dim transition-colors hover:bg-surface-elevated hover:text-text"
              >
                ×
              </button>
            </div>
            <div className="p-2">
              {MORE.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-[48px] items-center rounded-lg px-4 py-3 font-body text-[14px] font-bold transition-colors ${
                      active ? "bg-accent/10 text-accent-bright border-r-2 border-accent" : "text-text-dim hover:bg-white/[0.03] hover:text-text"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-line p-3">
              <LogoutButton className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-3 font-body text-[14px] font-bold text-text-dim hover:bg-surface-elevated hover:text-text transition-colors">
                تسجيل الخروج
              </LogoutButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
