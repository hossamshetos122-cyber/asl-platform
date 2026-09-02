"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/matches", label: "المباريات", icon: "matches" },
  { href: "/standings", label: "الترتيب", icon: "standings" },
  { href: "/top-scorers", label: "الهدافين", icon: "scorers" },
  { href: "/teams", label: "الفرق", icon: "teams" },
] as const;

function NavIcon({ name }: { name: (typeof NAV_ITEMS)[number]["icon"] }) {
  const common = {
    className: "h-[21px] w-[21px]",
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M2.8 8.6 10 2.8l7.2 5.8V16a1.4 1.4 0 0 1-1.4 1.4H4.2A1.4 1.4 0 0 1 2.8 16V8.6Z" />
          <path d="M7.8 17.4v-5h4.4v5" />
        </svg>
      );
    case "matches":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="10" cy="10" r="7.2" />
          <path d="M10 2.8c1.2 1.8 1.2 12.6 0 14.4M2.8 10c1.8-1.2 12.6-1.2 14.4 0" />
        </svg>
      );
    case "standings":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3.5 4.5h13M3.5 10h13M3.5 15.5h13" />
          <circle cx="10" cy="4.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="10" cy="10" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="10" cy="15.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "scorers":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="10" cy="10" r="7.2" />
          <circle cx="10" cy="10" r="3.4" />
          <circle cx="10" cy="10" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "teams":
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M10 1.8 15.5 4v5.1c0 3.3-2.3 6.1-5.5 7.8-3.2-1.7-5.5-4.5-5.5-7.8V4L10 1.8Z" />
        </svg>
      );
  }
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="التنقل السريع"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="relative flex-1">
              {isActive && (
                <span className="absolute right-1/2 top-0 h-[2px] w-8 translate-x-1/2 rounded-full bg-accent" />
              )}
              <Link
                href={item.href}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-lg transition-colors ${
                  isActive ? "text-accent" : "text-text-dimmer hover:text-text"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <NavIcon name={item.icon} />
                <span className="font-utility text-[9px] font-bold leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}