"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import { formatRelativeTime } from "@/lib/dates";
import type { NotificationVM } from "@/lib/types";

export function NotificationsList({ notifications }: { notifications: NotificationVM[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const unread = notifications.filter((n) => !n.readAt).length;

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center">
        <p className="font-body text-[12px] text-text-dim">لا توجد إشعارات لك حالياً.</p>
      </div>
    );
  }

  return (
    <div>
      {unread > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 font-body text-[11px] font-bold text-accent">
            {unread} غير مقروء
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markAllNotificationsRead();
                router.refresh();
              })
            }
            className="font-body text-[11px] font-bold text-text-dimmer transition-colors hover:text-accent disabled:opacity-50"
          >
            تعليم الكل كمقروء
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border px-3 py-2.5 transition-colors ${n.readAt ? "border-line/40 bg-surface" : "border-accent/25 bg-accent/5"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`font-body text-[12px] font-bold ${n.readAt ? "text-text-dim" : "text-text"}`}>{n.title}</p>
                <p className="mt-0.5 font-body text-[11px] leading-relaxed text-text-dimmer">{n.body}</p>
                <p className="mt-1 font-utility text-[9px] tracking-wider text-text-dimmer uppercase">{formatRelativeTime(n.createdAt)}</p>
              </div>
              {!n.readAt && (
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => {
                      await markNotificationRead(n.id);
                      router.refresh();
                    })
                  }
                  disabled={pending}
                  className="mt-0.5 inline-flex items-center gap-1 rounded-md border border-accent/25 bg-accent/10 px-2 py-1 font-body text-[10px] font-bold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
                >
                  <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 13V7M8 13V3M12 13V9" />
                  </svg>
                  مقروء
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}