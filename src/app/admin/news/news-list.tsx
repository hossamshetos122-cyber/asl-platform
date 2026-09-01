"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createNews, deleteNews, updateNews } from "@/lib/actions/news";
import { ImageUpload } from "@/components/ui/image-upload";

type NewsRow = {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  imageUrl: string | null;
  authorName: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? pendingLabel : label}
    </button>
  );
}

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function NewsFormFields({ row }: { row?: NewsRow | null }) {
  const [imageUrl, setImageUrl] = useState<string | null>(row?.imageUrl ?? null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">عنوان الخبر</label>
          <input
            name="title"
            required
            minLength={3}
            defaultValue={row?.title}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            placeholder="عنوان الخبر"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">تاريخ النشر</label>
          <input
            name="publishedAt"
            type="datetime-local"
            defaultValue={row ? toDateTimeLocal(row.publishedAt) : ""}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            dir="ltr"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">ملخص قصير</label>
        <input
          name="excerpt"
          maxLength={400}
          defaultValue={row?.excerpt ?? ""}
          className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
          placeholder="جملة أو جملتان يظهران في بطاقة الخبر"
        />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">محتوى الخبر</label>
          <span className="font-body text-[10px] text-text-dimmer">يدعم فقرات متعددة بفواصل أسطر</span>
        </div>
        <textarea
          name="body"
          required
          minLength={10}
          rows={6}
          defaultValue={row?.body}
          className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent leading-relaxed"
          placeholder="اكتب تفاصيل الخبر هنا..."
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ImageUpload
          name="imageUrl"
          purpose="general"
          label="صورة الغلاف"
          value={imageUrl}
          onChange={setImageUrl}
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <label className="mb-1.5 block font-utility text-[9px] tracking-[0.15em] text-text-dimmer uppercase">اسم الكاتب</label>
          <input
            name="authorName"
            maxLength={100}
            defaultValue={row?.authorName ?? ""}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 font-body text-sm text-text outline-none transition-colors focus:border-accent"
            placeholder="يُستخدم اسم المدير افتراضياً"
          />
        </div>
        <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
        <input type="hidden" name="id" value={row?.id ?? ""} />
      </div>
    </>
  );
}

function CreateForm({ onDone }: { onDone: () => void }) {
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
        نشر خبر جديد
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        setError(null);
        const res = await createNews(formData);
        if (res.ok) {
          setIsOpen(false);
          onDone();
        } else {
          setError(res.error || "حدث خطأ");
        }
      }}
      className="rounded-xl border border-accent/20 bg-surface p-5"
    >
      {error && <div className="mb-4 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">{error}</div>}
      <NewsFormFields />
      <div className="mt-5 flex items-center gap-3">
        <SubmitButton label="نشر الخبر" pendingLabel="جارٍ النشر..." />
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

function EditForm({ row, onDone }: { row: NewsRow; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        const res = await updateNews(formData);
        if (res.ok) onDone();
        else setError(res.error || "حدث خطأ");
      }}
      className="rounded-xl border border-line bg-surface p-5"
    >
      {error && <div className="mb-4 rounded-lg border border-live/30 bg-live/10 px-4 py-2 font-body text-[12px] text-live">{error}</div>}
      <NewsFormFields row={row} />
      <div className="mt-5 flex items-center gap-3">
        <SubmitButton label="حفظ التعديلات" pendingLabel="جارٍ الحفظ..." />
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:text-text"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

function NewsCard({ row, onEdit, onDeleted }: { row: NewsRow; onEdit: () => void; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="font-display text-[14px] font-black text-text leading-snug">{row.title}</div>
          {row.excerpt && <p className="mt-1 font-body text-[11px] text-text-dim line-clamp-2">{row.excerpt}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 font-body text-[10px] text-text-dimmer">
            <span>{row.authorName || "مجهول"}</span>
            <span dir="ltr">{new Date(row.publishedAt).toLocaleString("ar-EG")}</span>
            <span className="badge-muted">منشور</span>
          </div>
        </div>
        {row.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.imageUrl} alt="" loading="lazy" width={96} height={64} className="h-16 w-24 shrink-0 rounded-lg border border-line object-cover" />
        )}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
        <button onClick={onEdit} className="rounded-lg border border-line px-3 font-body text-[11px] font-bold text-text-dim transition-colors hover:border-accent/40 hover:text-accent min-h-11">
          تعديل
        </button>
        {confirming ? (
          <form
            action={async (formData) => {
              const res = await deleteNews(formData);
              if (res.ok) onDeleted();
              setConfirming(false);
            }}
            className="flex items-center gap-2"
          >
            <input type="hidden" name="id" value={row.id} />
            <span className="font-body text-[11px] text-live">متأكد؟</span>
            <button className="rounded-lg bg-live px-3 font-body text-[11px] font-bold text-white transition-colors hover:bg-live/85 min-h-11">حذف</button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-line px-3 font-body text-[11px] font-bold text-text-dim min-h-11">إلغاء</button>
          </form>
        ) : (
          <button onClick={() => setConfirming(true)} className="rounded-lg border border-live/30 px-3 font-body text-[11px] font-bold text-live transition-colors hover:bg-live/10 min-h-11">
            حذف
          </button>
        )}
      </div>
    </div>
  );
}

export default function NewsList({ items }: { items: NewsRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <CreateForm onDone={() => router.refresh()} />
      {items.length === 0 && (
        <div className="rounded-xl border border-line bg-surface p-10 text-center">
          <p className="font-body text-sm text-text-dim">لا توجد أخبار بعد. انشر أول خبر ليفاجيء زوّار الصفحة الرئيسية.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map((row) =>
          editingId === row.id ? (
            <div key={row.id} className="lg:col-span-2">
              <EditForm row={row} onDone={() => setEditingId(null)} />
            </div>
          ) : (
            <NewsCard key={row.id} row={row} onEdit={() => setEditingId(row.id)} onDeleted={() => router.refresh()} />
          ),
        )}
      </div>
    </div>
  );
}