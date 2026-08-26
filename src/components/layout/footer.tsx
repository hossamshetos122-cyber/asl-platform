import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-bg-raised/50">
      <div className="page-container py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/league-logo.jpg"
                alt="شعار الدوري"
                width={1280}
                height={698}
                className="h-9 w-auto object-contain rounded-lg border border-line flex-shrink-0"
              />
              <div>
                <div className="font-display text-sm font-extrabold text-text">دوري نجوم الإسكندرية</div>
                <div className="font-utility text-[8px] tracking-[0.15em] text-text-dimmer">ALEXANDRIA AMATEUR LEAGUE</div>
              </div>
            </div>
            <p className="font-body text-xs leading-relaxed text-text-dimmer max-w-xs">
              المنصة الرسمية لإدارة وتنظيم بطولات كرة القدم للهواة في الإسكندرية.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-utility text-[11px] tracking-wider uppercase text-text-dimmer">روابط سريعة</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/standings", label: "جدول الترتيب" },
                { href: "/matches", label: "المباريات" },
                { href: "/top-scorers", label: "الهدافين" },
                { href: "/teams", label: "الفرق" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="font-body text-sm text-text-dim transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Competitions */}
          <div>
            <h4 className="mb-4 font-utility text-[11px] tracking-wider uppercase text-text-dimmer">البطولات</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/tournaments", label: "جميع البطولات" },
                { href: "/register", label: "إنشاء حساب" },
                { href: "/login", label: "تسجيل الدخول" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="font-body text-sm text-text-dim transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-utility text-[11px] tracking-wider uppercase text-text-dimmer">تواصل معنا</h4>
            <p className="font-body text-sm text-text-dim leading-relaxed">
              الإسكندرية، مصر
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-center">
          <p className="font-body text-[11px] text-text-dimmer">
            جميع الحقوق محفوظة © دوري نجوم الإسكندرية للهواة {year}
          </p>
        </div>
      </div>
    </footer>
  );
}
