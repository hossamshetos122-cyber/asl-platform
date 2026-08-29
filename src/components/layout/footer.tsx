import Link from "next/link";
import Image from "next/image";
import { getCurrentCopyrightYear } from "@/lib/season";

export function Footer() {
  const year = getCurrentCopyrightYear();

  return (
    <footer className="border-t border-line-strong bg-bg-deep">
      <div className="gradient-accent" />

      <div className="page-container py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <Image src="/images/league-logo.jpg" alt="شعار الدوري" width={1280} height={698} className="h-9 w-9 rounded-full object-cover border border-gold/20 flex-shrink-0" />
              <div>
                <div className="font-display text-sm font-black text-text">دوري نجوم الإسكندرية</div>
                <div className="font-utility text-[8px] tracking-[0.18em] text-gold/50 uppercase">Alexandria Amateur League</div>
              </div>
            </div>
            <p className="font-body text-xs leading-relaxed text-text-dimmer max-w-xs">
              المنصة الرسمية لإدارة وتنظيم بطولات كرة القدم للهواة في الإسكندرية.
            </p>
            <p className="mt-3 font-utility text-[9px] tracking-[0.18em] text-gold/50 uppercase">الإسكندرية، مصر · Alexandria, Egypt</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-3 font-utility text-[10px] tracking-[0.2em] uppercase text-text-dimmer">روابط سريعة</h4>
            <ul className="space-y-2">
              {[
                { href: "/standings", label: "جدول الترتيب" },
                { href: "/matches", label: "المباريات" },
                { href: "/top-scorers", label: "الهدافين" },
                { href: "/teams", label: "الفرق" },
                { href: "/players", label: "اللاعبون" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="font-body text-sm text-text-dim transition-colors hover:text-gold gold-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Competitions */}
          <div>
            <h4 className="mb-3 font-utility text-[10px] tracking-[0.2em] uppercase text-text-dimmer">البطولات</h4>
            <ul className="space-y-2">
              {[
                { href: "/tournaments", label: "جميع البطولات" },
                { href: "/register", label: "إنشاء حساب" },
                { href: "/login", label: "تسجيل الدخول" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="font-body text-sm text-text-dim transition-colors hover:text-gold gold-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-3 font-utility text-[10px] tracking-[0.2em] uppercase text-text-dimmer">من نحن</h4>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "عن المنصة" },
                { href: "/contact", label: "تواصل معنا" },
                { href: "/privacy", label: "الخصوصية والشروط" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="font-body text-sm text-text-dim transition-colors hover:text-gold gold-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-[11px] text-text-dimmer">
            جميع الحقوق محفوظة © دوري نجوم الإسكندرية للهواة {year}
          </p>
          <span className="font-utility text-[8px] tracking-[0.15em] text-text-faint uppercase">ASL Platform</span>
        </div>
      </div>
    </footer>
  );
}
