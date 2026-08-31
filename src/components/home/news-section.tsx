import Link from "next/link";
import { getLatestNews } from "@/lib/data/news";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImageDisplay } from "@/components/ui/image-display";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function NewsSection() {
  const result = await getLatestNews(3);

  return (
    <section className="page-container editorial-section">
      <SectionHeader title="آخر الأخبار" tag="NEWS" href="/news" />

      {result.status === "error" && <ErrorState message={result.message} />}
      {result.status === "empty" && <EmptyState message="لا توجد أخبار منشورة بعد." />}

      {result.status === "success" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {result.data.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface animate-fade-up transition-colors hover:border-accent/40"
            >
              <div className="relative h-40 overflow-hidden">
                {item.imageUrl ? (
                  <ImageDisplay src={item.imageUrl} alt={item.title} type="news" fill className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-elevated/40">
                    <svg className="h-10 w-10 text-text-dimmer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 6h16v12H4zM8 10h8M8 14h5" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-live/60 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2 font-body text-[10px] text-text-dimmer">
                  <span>{formatDate(item.publishedAt)}</span>
                  {item.authorName && (
                    <>
                      <span className="h-0.5 w-0.5 rounded-full bg-text-dimmer" />
                      <span>{item.authorName}</span>
                    </>
                  )}
                </div>
                <h3 className="mt-2 font-display text-[15px] font-black leading-snug text-text group-hover:text-accent transition-colors line-clamp-2">
                  {item.title}
                </h3>
                {item.excerpt && <p className="mt-1.5 font-body text-[12px] text-text-dim line-clamp-2">{item.excerpt}</p>}
                <span className="mt-3 inline-flex items-center gap-1.5 font-utility text-[9px] tracking-[0.15em] text-accent uppercase">
                  اقرأ الخبر
                  <svg className="h-3 w-3 rotate-180 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M7 3l3 3-3 3" /></svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}