"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendVerificationEmailAction } from "@/lib/actions/recovery";

export function VerifyEmailBanner() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const router = useRouter();

  const send = async () => {
    setSending(true);
    setMessage(null);
    setLink(null);
    const res = await sendVerificationEmailAction();
    if (res.resetLink) {
      setMessage("لم يتم تفعيل خدمة البريد بعد — استخدم الرابط أدناه لتأكيد بريدك.");
      setLink(res.resetLink);
    } else if (res.success) {
      setMessage("تم إرسال رابط التأكيد إلى بريدك الإلكتروني.");
    } else {
      setMessage(res.error || "حدث خطأ");
    }
    setSending(false);
    router.refresh();
  };

  return (
    <div className="mb-5 flex flex-col gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16v12H4zM4 6l8 7 8-7" />
        </svg>
        <div>
          <p className="font-body text-[13px] font-bold text-text">بريدك الإلكتروني غير مؤكّد</p>
          <p className="mt-0.5 font-body text-[11px] text-text-dim">أكّد بريدك الإلكتروني لتفعيل الحساب بالكامل.</p>
          {message && <p className="mt-1.5 font-body text-[11px] text-amber-300">{message}</p>}
          {link && (
            <a
              href={link}
              onClick={(e) => e.preventDefault()}
              className="mt-2 inline-block max-w-full break-all rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 font-body text-[10px] font-bold text-accent transition-colors hover:bg-accent/20"
            >
              {link}
            </a>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={send}
        disabled={sending}
        className="shrink-0 rounded-lg border border-amber-400/40 px-4 py-2 font-body text-[12px] font-bold text-amber-300 transition-colors hover:bg-amber-400/10 disabled:opacity-50"
      >
        {sending ? "جارٍ الإرسال..." : "إرسال رابط التأكيد"}
      </button>
    </div>
  );
}