import { getSiteConfig } from "@/lib/data/site-config";
import { getCurrentUser } from "@/lib/auth";
import { getAdmins } from "@/lib/actions/admin-admins";
import SettingsForm from "./settings-form";
import { AdminsPanel } from "./admins-panel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إعدادات المنصة | لوحة التحكم",
};

export default async function AdminSettingsPage() {
  const [cfg, currentUser, admins] = await Promise.all([
    getSiteConfig(),
    getCurrentUser(),
    getAdmins(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h1 className="font-display text-xl font-black text-text">إعدادات المنصة</h1>
          <p className="mt-1 font-body text-[12px] text-text-dim">
            غيّر اسم الدوري والشعار والألوان لتكيّف المنصة مع أي مدينة أو حي. تُطبق التغييرات
            فوراً على الموقع بالكامل.
          </p>
        </div>
      </div>

      <SettingsForm
        leagueName={cfg.leagueName}
        leagueNameEn={cfg.leagueNameEn}
        cityName={cfg.cityName}
        logoUrl={cfg.logoUrl}
        accentColor={cfg.accentColor}
        bgColor={cfg.primaryColor}
      />

      <AdminsPanel currentAdminId={currentUser?.id ?? ""} admins={admins} />
    </div>
  );
}
