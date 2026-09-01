"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createManagerAccount, unlinkManager } from "@/lib/actions/accounts";
import { SearchInput } from "@/components/ui/search-input";
import { normalizeArabic } from "@/lib/search";

interface TeamOption {
  id: string;
  name: string;
  shortName: string;
  managers: { id: string; fullName: string; email: string }[];
}

interface ManagerRow {
  id: string;
  fullName: string;
  email: string;
  managedTeams: { id: string; name: string; shortName: string }[];
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? pendingLabel : label}
    </button>
  );
}

function CreateAccountForm({ teams, onCreated }: { teams: TeamOption[]; onCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-5 py-2.5 font-body text-[12px] font-bold text-accent transition-all hover:bg-accent/20"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8 3v10M3 8h10" />
        </svg>
        إنشاء حساب مدير فريق
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        setError(null);
        const res = await createManagerAccount(formData);
        if (res.ok) {
          setIsOpen(false);
          onCreated();
        } else {
          setError(res.error || "حدث خطأ");
        }
      }}
      className="rounded-xl border border-accent/20 bg-surface p-5"
    >
      {error && <div className="mb-4 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">{error}</div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم المدير</label>
          <input
            name="fullName"
            required
            minLength={2}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            placeholder="أحمد محمود"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">البريد الإلكتروني</label>
          <input
            name="email"
            type="email"
            required
            dir="ltr"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            placeholder="manager@example.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">كلمة المرور</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            dir="ltr"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            placeholder="8 أحرف على الأقل"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الفريق</label>
          <select
            name="teamId"
            required
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
          >
            <option value="">اختر الفريق...</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <SubmitButton label="إنشاء الحساب" pendingLabel="جارٍ الإنشاء..." />
        <button
          type="button"
          onClick={() => { setIsOpen(false); setError(null); }}
          className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

export default function AccountsTable({ teams, managers }: { teams: TeamOption[]; managers: ManagerRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const query = normalizeArabic(search.trim());
  const filtered = query
    ? managers.filter((m) => {
        const name = normalizeArabic(m.fullName);
        const email = normalizeArabic(m.email);
        const teamsList = m.managedTeams.map((t) => normalizeArabic(t.name)).join(" ");
        return name.includes(query) || email.includes(query) || teamsList.includes(query);
      })
    : managers;

  const hasResults = filtered.length > 0;

  return (
    <>
      <CreateAccountForm teams={teams} onCreated={() => router.refresh()} />
      <div className="max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="ابحث باسم المدير أو البريد أو الفريق..."
          label="بحث في حسابات المديرين"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-line bg-surface-elevated/50">
              <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">المدير</th>
              <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">الفريق المرتبط</th>
              <th className="px-4 py-3 font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/50">
            {managers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center">
                  <p className="font-body text-sm text-text-dim">لا توجد حسابات مديري فرق بعد.</p>
                </td>
              </tr>
            )}
            {search.trim() && !hasResults && managers.length > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center">
                  <p className="font-body text-sm font-bold text-text-dim">لا توجد نتائج مطابقة لبحثك.</p>
                  <p className="mt-1 font-body text-[12px] text-text-dimmer">جرّب كتابة اسم أو بريد أو فريق آخر.</p>
                </td>
              </tr>
            )}
            {filtered.map((manager) => (
              <tr key={manager.id} className="transition-colors hover:bg-surface-elevated/50">
                <td className="px-4 py-3">
                  <div className="font-body text-sm font-bold text-text">{manager.fullName}</div>
                  <div className="mt-0.5 font-body text-[11px] text-text-dimmer" dir="ltr">{manager.email}</div>
                </td>
                <td className="px-4 py-3">
                  {manager.managedTeams.length === 0 ? (
                    <span className="font-body text-[11px] text-text-dimmer">غير مرتبط بفريق</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {manager.managedTeams.map((team) => (
                        <span key={team.id} className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 font-body text-[11px] font-bold text-accent">
                          {team.name}
                          <form
                            action={async (formData) => {
                              const res = await unlinkManager(formData);
                              if (res.ok) router.refresh();
                            }}
                          >
                            <input type="hidden" name="userId" value={manager.id} />
                            <input type="hidden" name="teamId" value={team.id} />
                            <button type="submit" title="فك الارتباط" className="text-text-dimmer transition-colors hover:text-live">
                              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 8h10" /></svg>
                            </button>
                          </form>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="badge-muted">مدير فريق</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-body text-[11px] text-text-dimmer">
        الفرق غير المنسوبة: {teams.filter((t) => t.managers.length === 0).map((t) => t.name).join("، ") || "—"}.
        يمكن ربط فريق واحد بأكثر من حساب.
      </p>
      <p className="font-body text-[11px] text-text-dimmer">
        يصل المدير للبوابة عبر بوابة الفريق «/manage»: يعرض مباريات فريقه القادمة وآخر النتائج ويتيح تأكيد قوائم المباريات فقط.
      </p>
    </>
  );
}