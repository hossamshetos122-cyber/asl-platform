import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import type { ReactNode } from "react";

const SIDEBAR_LINKS = [
  { href: "/admin", label: "لوحة التحكم", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", exact: true },
  { href: "/admin/tournaments", label: "البطولات", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", exact: false },
  { href: "/admin/teams", label: "الفرق", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", exact: false },
  { href: "/admin/players", label: "اللاعبين", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", exact: false },
  { href: "/admin/matches", label: "المباريات", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", exact: false },
] as const;

async function SidebarNavWithActive() {
  const { headers } = await import("next/headers");
  const hdrs = await headers();
  const pathname = hdrs.get("x-invoke-path") ?? "";

  return (
    <div className="sticky top-24 rounded-xl border border-line bg-bg-raised p-3">
      <div className="mb-3 flex items-center gap-3 border-b border-line px-4 pb-3">
        <Image
          src="/images/league-logo.jpg"
          alt="شعار الدوري"
          width={1280}
          height={698}
          className="h-8 w-auto object-contain rounded-lg border border-line flex-shrink-0"
        />
        <div>
          <span className="font-display text-xs font-extrabold text-text block">لوحة التحكم</span>
          <span className="font-utility text-[9px] tracking-wider text-text-dimmer">ADMIN PANEL</span>
        </div>
      </div>
      <nav aria-label="لوحة التحكم" className="flex flex-col gap-1">
        {SIDEBAR_LINKS.map((link) => {
          const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 font-body text-sm font-bold transition-all ${
                isActive
                  ? "bg-gold/10 text-gold border-r-2 border-gold"
                  : "text-text-dim hover:bg-white/[0.03] hover:text-text"
              }`}
            >
              <svg className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-gold" : "text-text-dimmer"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={link.icon} />
              </svg>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 pt-6 pb-12 sm:px-6 lg:px-8">
        <aside className="hidden w-60 flex-shrink-0 lg:block">
          <SidebarNavWithActive />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
