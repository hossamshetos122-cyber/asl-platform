import { prisma } from "@/lib/prisma";
import AccountsTable from "./accounts-table";
import RefereesTable from "./referees-table";

export const metadata = {
  title: "الحسابات | لوحة التحكم",
};

export default async function AdminAccountsPage() {
  const [teams, managers, refereeRows] = await Promise.all([
    prisma.team.findMany({
      orderBy: { name: "asc" },
      include: {
        managers: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "TEAM_MANAGER" },
      orderBy: { createdAt: "asc" },
      include: {
        managedTeams: {
          select: { id: true, name: true, shortName: true },
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.referee.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        _count: { select: { matches: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const referees = refereeRows.map((r) => ({
    id: r.id,
    fullName: r.user.fullName,
    email: r.user.email,
    licenseNo: r.licenseNo,
    assignments: r._count.matches,
  }));

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h1 className="font-display text-xl font-black text-text">حسابات مديري الفرق</h1>
            <p className="mt-1 font-body text-[12px] text-text-dim">
              أنشئ حساباً لكل مدير فريق ورابطه بفريقه. سيدخل المدير عبر هذه الصفحة.
            </p>
          </div>
          <span className="badge-accent font-num">{managers.length}</span>
        </div>
        <div className="pt-5">
          <AccountsTable teams={teams} managers={managers} />
        </div>
      </div>
      <RefereesTable referees={referees} />
    </div>
  );
}