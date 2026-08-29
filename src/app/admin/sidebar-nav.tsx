"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNav({ href, icon, mobile, children }: {
  href: string;
  icon: string;
  mobile?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  if (mobile) {
    return (
      <Link href={href} className={`flex flex-1 flex-col items-center gap-0.5 py-2 font-body text-[9px] font-bold transition-colors ${isActive ? "text-accent" : "text-text-dim"}`}>
        <span className="h-1 w-1 rounded-full bg-current" />
        {children}
      </Link>
    );
  }

  return (
    <Link href={href} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 font-body text-[13px] font-bold transition-colors ${isActive ? "bg-accent/10 text-accent" : "text-text-dim hover:bg-surface-elevated hover:text-text"}`}>
      {children}
    </Link>
  );
}
