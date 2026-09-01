"use client";

import { useActionState, useState } from "react";
import {
  inviteAdminAction,
  removeAdminAction,
  type AdminActionResult,
} from "@/lib/actions/admin-admins";

interface AdminRow {
  id: string;
  fullName: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

const inviteInitial: AdminActionResult = { ok: false };

export function AdminsPanel({ currentAdminId, admins: initial }: { currentAdminId: string; admins: AdminRow[] }) {
  const [admins, setAdmins] = useState<AdminRow[]>(initial);
  const [inviteState, inviteAction, invitePending] = useActionState(inviteAdminAction, inviteInitial);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function handleRemove(id: string) {
    setRemoveError(null);
    const fd = new FormData();
    fd.set("adminId", id);
    const res = await removeAdminAction(fd);
    if (!res.ok) {
      setRemoveError(res.error || "حدث خطأ");
      return;
    }
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    setConfirmingId(null);
  }

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-display text-base font-black text-text">إدارة الأدمن</h2>
        <p className="mt-0.5 font-body text-[12px] text-text-dim">
          كل الأدمن يشاركون نفس بيانات الدوري ولهم نفس الصلاحيات الكاملة — إضافة وتعديل وحذف أي شيء،
          بما في ذلك دعوة أو إزالة أدمن آخر.
        </p>
      </div>

      <div className="p-4 space-y-5">
        {/* Current admins list */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-body text-[12px] font-bold text-text">الأدمن الحاليون ({admins.length})</p>
          </div>
          <div className="divide-y divide-line/60 rounded-lg border border-line/60 bg-surface-elevated/30">
            {admins.map((admin) => {
              const isSelf = admin.id === currentAdminId;
              return (
                <div key={admin.id} className="flex items-center gap-3 px-3.5 py-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-body text-sm font-bold text-accent">
                    {(admin.fullName || admin.email).charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[13px] font-bold text-text">
                      {admin.fullName || "لم يُحدِّد الاسم بعد"}
                      {isSelf && <span className="mr-1.5 font-body text-[11px] font-normal text-text-dimmer">(أنت)</span>}
                    </p>
                    <p className="truncate font-body text-[12px] text-text-dim" dir="ltr">{admin.email}</p>
                  </div>
                  {confirmingId === admin.id ? (
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[11px] text-live">متأكد؟</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(admin.id)}
                        className="rounded-lg bg-live px-3 min-h-11 font-body text-[11px] font-bold text-white transition-colors hover:bg-live/85"
                      >
                        إزالة
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="rounded-lg border border-line px-3 min-h-11 font-body text-[11px] font-bold text-text-dim"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => setConfirmingId(admin.id)}
                      className="btn-danger-outline text-[12px] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      إزالة الصلاحية
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {removeError && <p className="mt-2 font-body text-[12px] text-live">{removeError}</p>}
        </div>

        {/* Invite form */}
        <div className="rounded-lg border border-line bg-surface-elevated/30 p-3.5">
          <p className="mb-2 font-body text-[12px] font-bold text-text">دعوة أدمن جديد</p>
          {inviteState.ok && (
            <div className="mb-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2.5 font-body text-[12px] text-emerald-400">
              تم إرسال الدعوة إلى البريد المحدد.
              {inviteState.inviteLink && (
                <span className="mt-1 block break-all font-body text-[12px] text-emerald-400" dir="ltr">
                  رابط الدعوة (وضع تجريبي): {inviteState.inviteLink}
                </span>
              )}
            </div>
          )}
          {inviteState.error && (
            <div className="mb-3 rounded-lg border border-live/20 bg-live/5 px-3 py-2.5 font-body text-[12px] text-live">{inviteState.error}</div>
          )}
          <form action={inviteAction} className="flex flex-col gap-2 sm:flex-row">
            <input
              name="email"
              type="email"
              required
              placeholder="بريد الأدمن الجديد"
              className="input-field min-h-11 flex-1"
            />
            <button type="submit" disabled={invitePending} className="btn-primary min-h-11 whitespace-nowrap">
              {invitePending ? "جارٍ الإرسال..." : "إرسال الدعوة"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
