"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNav({ href, children }: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link href={href} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 font-body text-[13px] font-bold transition-colors ${isActive ? "bg-accent/10 text-accent" : "text-text-dim hover:bg-surface-elevated hover:text-text"}`}>
      {children}
    </Link>
  );
}
