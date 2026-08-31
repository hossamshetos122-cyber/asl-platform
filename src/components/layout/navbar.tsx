import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./mobile-menu";
import { DesktopNavLinks } from "./desktop-nav-links";
import { AuthNav } from "@/components/auth/auth-nav";
import { NavbarShell } from "./navbar-shell";

export function Navbar() {
  return (
    <NavbarShell>
      <div className="page-container flex items-center justify-between h-14 sm:h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <Image
            src="/images/league-logo.jpg"
            alt="شعار دوري نجوم الإسكندرية"
            width={1280}
            height={698}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-accent/40 shadow-glow-sm"
            priority
          />
          <div className="leading-tight hidden sm:block">
            <div className="font-display text-[13px] font-black text-text leading-tight group-hover:text-accent-bright transition-colors">
              دوري نجوم الإسكندرية
            </div>
            <div className="font-utility text-[8px] tracking-[0.18em] text-text-dim uppercase">
              Alexandria Amateur League
            </div>
          </div>
        </Link>

        {/* Nav Links */}
        <DesktopNavLinks />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <AuthNav />
          <Link
            href="/teams/new"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 font-body text-[12px] font-extrabold text-[#1d1400] transition-all hover:bg-accent-bright active:scale-[0.98]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            إنشاء فريق
          </Link>
          <MobileMenu />
        </div>
      </div>
    </NavbarShell>
  );
}
