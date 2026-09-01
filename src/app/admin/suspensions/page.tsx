import { getSuspendedPlayers } from "@/lib/discipline";
import { SuspensionsTable } from "./suspensions-table";

export const metadata = {
  title: "الموقوفون | لوحة التحكم",
};

export const dynamic = "force-dynamic";

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

      <SuspensionsTable rows={suspended} />
    </div>
  );
}
