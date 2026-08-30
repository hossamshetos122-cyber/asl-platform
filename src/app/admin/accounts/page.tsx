import { prisma } from "@/lib/prisma";
import AccountsTable from "./accounts-table";

export const metadata = {
  title: "حسابات الفرق | لوحة التحكم",
};

export default async function AdminAccountsPage() {
  const [teams, managers] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h1 className="font-display text-xl font-black text-text">حسابات مديري الفرق</h1>
          <p className="mt-1 font-body text-[12px] text-text-dim">
            أنشئ حساباً لكل مدير فريق ورابطه بفريقه. سيدخل المدير عبر هذه الصفحة.
          </p>
        </div>
        <span className="badge-accent font-num">{managers.length}</span>
      </div>
      <AccountsTable teams={teams} managers={managers} />
    </div>
  );
}