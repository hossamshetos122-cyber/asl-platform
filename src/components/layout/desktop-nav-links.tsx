"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/tournaments", label: "البطولات" },
  { href: "/matches", label: "المباريات" },
  { href: "/standings", label: "الترتيب" },
  { href: "/top-scorers", label: "الهدافين" },
  { href: "/teams", label: "الفرق" },
  { href: "/players", label: "اللاعبون" },
  { href: "/news", label: "الأخبار" },
] as const;

export function DesktopNavLinks() {
  const pathname = usePathname();

  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {NAV_LINKS.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`relative px-3 py-2 font-body text-[13px] font-bold transition-colors rounded-md ${
                isActive
                  ? "text-text"
                  : "text-text-dim hover:text-text"
              }`}
            >
              {link.label}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-gradient-to-l from-accent to-accent-bright" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
