import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ImageDisplay } from "@/components/ui/image-display";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ownedTeams = await prisma.team.findMany({
    where: { ownerId: user.id },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
      tournamentEntries: {
        include: { tournament: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden bg-surface border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-elevated/50 to-surface" />
        <div className="page-container relative py-8 sm:py-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 border border-accent/25">
              <span className="font-display text-xl font-black text-accent">{user.fullName.charAt(0)}</span>
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-black text-text">مرحباً، {user.fullName}</h1>
              <p className="mt-1 font-body text-[13px] text-text-dim">لوحة التحكم الشخصية</p>
            </div>
          </div>
        </div>
      </section>

      <main className="page-container page-padding">
        <div className="mb-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-line bg-surface p-4 text-center">
            <div className="font-body text-[11px] font-bold text-accent">{user.fullName}</div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">الاسم</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 text-center">
            <div className="font-body text-[11px] font-bold text-text truncate" dir="ltr">{user.email}</div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">البريد</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 text-center">
            <div className="font-body text-[11px] font-bold text-accent">{user.role === "ADMIN" ? "مدير" : user.role === "PLAYER" ? "لاعب" : "مشجع"}</div>
            <div className="font-utility text-[8px] tracking-[0.12em] text-text-dimmer uppercase mt-0.5">النوع</div>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-line bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h2 className="font-display text-base font-black text-text">فرقلي</h2>
            <Link href="/teams/new" className="btn-primary text-[11px] px-3 py-1.5">
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
              إنشاء فريق
            </Link>
          </div>
          <div className="p-4">
            {ownedTeams.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-body text-[13px] text-text-dim mb-3">لم تإنشاء أي فريق بعد.</p>
                <Link href="/teams/new" className="btn-primary inline-block">إنشاء فريقك الأول</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {ownedTeams.map((team) => (
                  <Link key={team.id} href={`/teams/${team.id}`} className="group flex items-center gap-3 rounded-lg border border-line/40 px-3 py-2.5 transition-all hover:bg-surface-elevated hover:border-line">
                    <ImageDisplay src={team.crestUrl} alt={`شعار ${team.name}`} type="team-logo" size="md" shortCode={team.shortName} />
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-[13px] font-bold text-text group-hover:text-accent transition-colors truncate">{team.name}</div>
                      <div className="font-utility text-[8px] tracking-wider text-text-dimmer uppercase">{team.memberships.length} لاعب · {team.city}</div>
                    </div>
                    {team.tournamentEntries.length > 0 && team.tournamentEntries[0] && (
                      <span className="badge-accent text-[10px]">{team.tournamentEntries[0].tournament.name}</span>
                    )}
                    <svg className="h-3.5 w-3.5 text-text-dimmer rotate-180 flex-shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M7 3l3 3-3 3" /></svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { href: "/tournaments", label: "البطولات" },
            { href: "/matches", label: "المباريات" },
            { href: "/standings", label: "الترتيب" },
            { href: "/teams", label: "الفرق" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="group rounded-xl border border-line bg-surface p-4 text-center premier-card">
              <div className="font-body text-[13px] font-bold text-text group-hover:text-accent transition-colors">{link.label}</div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
