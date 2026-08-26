import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./mobile-menu";
import { AuthNav } from "@/components/auth/auth-nav";

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/tournaments", label: "البطولات" },
  { href: "/matches", label: "المباريات" },
  { href: "/standings", label: "الترتيب" },
  { href: "/top-scorers", label: "الهدافين" },
  { href: "/teams", label: "الفرق" },
] as const;

export function Navbar() {
  return (
    <nav aria-label="القائمة الرئيسية" className="sticky top-0 z-50 border-b border-line bg-bg/95 backdrop-blur-md">
      <div className="page-container flex items-center justify-between py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/images/league-logo.jpg"
            alt="شعار دوري نجوم الإسكندرية"
            width={1280}
            height={698}
            className="h-10 w-auto sm:h-12 object-contain rounded-lg border border-line transition-transform group-hover:scale-105 flex-shrink-0"
            priority
          />
          <div className="leading-tight hidden sm:block">
            <div className="font-display text-sm sm:text-base font-extrabold text-text leading-tight">
              دوري نجوم الإسكندرية
            </div>
            <div className="font-utility text-[9px] sm:text-[10px] tracking-[0.15em] text-text-dimmer">
              ALEXANDRIA AMATEUR LEAGUE
            </div>
          </div>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-3 py-2 font-body text-[13px] sm:text-[14px] font-bold text-text-dim transition-colors hover:bg-white/[0.04] hover:text-text"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <AuthNav />
          <Link
            href="/teams/new"
            className="hidden rounded-lg bg-gold px-5 py-2 font-body text-[12px] sm:text-[13px] font-extrabold text-bg transition-all hover:bg-gold-bright hover:shadow-glow-sm sm:inline"
          >
            إنشاء فريق
          </Link>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
