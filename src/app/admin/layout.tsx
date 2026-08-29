import { redirect } from "next/navigation";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { SidebarNav } from "./sidebar-nav";
import { LogoutButton } from "@/components/auth/logout-button";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { label: "لوحة التحكم", href: "/admin", icon: "dashboard" },
  { label: "البطولات", href: "/admin/tournaments", icon: "tournaments" },
  { label: "المباريات", href: "/admin/matches", icon: "matches" },
  { label: "الفرق", href: "/admin/teams", icon: "teams" },
  { label: "اللاعبون", href: "/admin/players", icon: "players" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await requireAdmin();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "";
    if (message.startsWith("[ASL]")) {
      throw e;
    }
    redirect("/login?redirect=/admin");
  }
  if (!user) redirect("/login?redirect=/admin");

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:border-l lg:border-line lg:bg-surface">
        <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
          <Image src="/images/league-logo.jpg" alt="شعار الدوري" width={1280} height={698} className="h-8 w-8 rounded-full object-cover border border-accent/20" />
          <span className="font-display text-sm font-black text-text">لوحة التحكم</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2.5">
          {NAV_ITEMS.map((item) => (
            <SidebarNav key={item.href} href={item.href} icon={item.icon}>{item.label}</SidebarNav>
          ))}
        </nav>
        <div className="border-t border-line p-2.5">
          <LogoutButton className="w-full rounded-lg px-3 py-2 font-body text-[13px] font-bold text-text-dim hover:bg-surface-elevated hover:text-text transition-colors text-left flex items-center gap-2">
            <svg className="h-4 w-4 rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3" /><path d="M11 11l3-3-3-3" /><path d="M14 8H6" /></svg>
            تسجيل الخروج
          </LogoutButton>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface/95 backdrop-blur px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Image src="/images/league-logo.jpg" alt="شعار الدوري" width={1280} height={698} className="h-8 w-8 rounded-full object-cover border border-accent/20" />
          <span className="font-display text-sm font-black text-text">لوحة التحكم</span>
        </div>
        <LogoutButton className="rounded-lg px-2.5 py-1.5 font-body text-[11px] font-bold text-text-dim hover:bg-surface-elevated transition-colors">
          خروج
        </LogoutButton>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        {NAV_ITEMS.map((item) => (
          <SidebarNav key={item.href} href={item.href} icon={item.icon} mobile>{item.label}</SidebarNav>
        ))}
      </nav>

      <div className="flex flex-1 flex-col lg:static">
        <div className="h-14 lg:hidden" />
        <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
