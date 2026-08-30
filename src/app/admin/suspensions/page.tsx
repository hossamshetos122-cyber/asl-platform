import Link from "next/link";
import { getSuspendedPlayers } from "@/lib/discipline";
import { formatMatchDateTime } from "@/lib/dates";

export const metadata = {
  title: "الموقوفون | لوحة التحكم",
};

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  RED: "بطاقة حمراء (إيقاف مباراة)",
  SECOND_YELLOW: "كارتان صفراوان في مباراتين (إيقاف مباراة)",
};

export default async function AdminSuspensionsPage() {
  const suspended = await getSuspendedPlayers();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h1 className="font-display text-xl font-black text-text">قائمة الموقوفين</h1>
        <span className={suspended.length > 0 ? "badge-live font-num" : "badge-success font-num"}>
          {suspended.length}
        </span>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-surface px-4 py-3.5">
        <span className="mt-0.5 text-accent">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l9 5v6c0 4-4 6-9 7-5-1-9-3-9-7V8l9-5z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
        </span>
        <p className="font-body text-[12px] text-text-dim">
          الإيقاف يُحسب تلقائياً: البطاقة الحمراء توقيف المباراة التالية مباشرة، وكارتا الصفر تتراكمان فقط عبر مباريات مختلفة. يظهر اللاعب هنا فقط طالما أن المباراة التي ترتّب له الإيقاف ما زالت قادمة — بمجرد لعبها يعود تلقائياً إلى «متاح».
        </p>
      </div>

      {suspended.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-6 py-10 text-center">
          <p className="font-body text-sm font-bold text-emerald-500">لا يوجد لاعبون موقوفون حالياً.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-line bg-surface-elevated/50">
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اللاعب</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الفريق</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">السبب</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الكروت</th>
                <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المباراة القادمة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {suspended.map((row) => (
                <tr key={row.playerId} className="transition-colors hover:bg-surface-elevated/50">
                  <td className="px-4 py-3">
                    <Link href={`/players/${row.playerId}`} className="font-body text-[13px] font-bold text-text transition-colors hover:text-accent">
                      {row.playerName}
                    </Link>
                    {row.jerseyNumber != null && (
                      <span className="mr-1.5 inline-flex h-5 items-center rounded-sm bg-surface-elevated px-1.5 font-num text-[10px] font-bold text-emerald-500">{row.jerseyNumber}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/teams/${row.teamId}`} className="font-body text-[12px] font-bold text-accent transition-colors hover:text-accent-bright">{row.teamName}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 font-body text-[11px] font-bold ${row.reason === "RED" ? "bg-red-500/15 text-red-400" : "bg-yellow-400/15 text-yellow-300"}`}>
                      {REASON_LABELS[row.reason] ?? row.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-num text-[11px] font-bold">
                      <span className="inline-flex h-5 min-w-7 items-center justify-center gap-1 rounded border border-yellow-400/35 bg-yellow-400/10 px-1 text-yellow-300">{row.yellows}</span>
                      <span className="inline-flex h-5 min-w-7 items-center justify-center gap-1 rounded border border-red-500/35 bg-red-500/10 px-1 text-red-400">{row.reds}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.nextFixtureId ? (
                      <Link href={`/matches/${row.nextFixtureId}`} className="font-body text-[12px] font-bold text-accent transition-colors hover:text-accent-bright">
                        {row.nextFixtureKickoffAt ? formatMatchDateTime(row.nextFixtureKickoffAt) : ""}
                      </Link>
                    ) : (
                      <span className="font-body text-[12px] text-text-dim">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}