import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getNewsPage } from "@/lib/data/news";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImageDisplay } from "@/components/ui/image-display";

export const dynamic = "force-dynamic";

const PER_PAGE = 9;

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

async function NewsGrid({ page }: { page: number }) {
  const result = await getNewsPage(page, PER_PAGE);

  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا توجد أخبار منشورة بعد." />;

  const { items, pages, page: current } = result.data;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.id}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface animate-fade-up transition-colors hover:border-accent/40"
          >
            <div className="relative h-44 overflow-hidden">
              {item.imageUrl ? (
                <ImageDisplay src={item.imageUrl} alt={item.title} type="news" fill className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-elevated/40">
                  <svg className="h-12 w-12 text-text-dimmer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
              <h3 className="mt-2 font-display text-[15px] font-black leading-snug text-text group-hover:text-accent transition-colors line-clamp-2">{item.title}</h3>
              {item.excerpt && <p className="mt-1.5 font-body text-[12px] text-text-dim line-clamp-3">{item.excerpt}</p>}
            </div>
          </Link>
        ))}
      </div>

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {current > 1 && (
            <Link href={`/news?page=${current - 1}`} className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:border-accent/40 hover:text-accent">
              السابق
            </Link>
          )}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: pages }).map((_, i) => {
              const p = i + 1;
              const active = p === current;
              return (
                <Link
                  key={p}
                  href={`/news?page=${p}`}
                  className={`h-9 w-9 rounded-lg border font-num text-[12px] font-bold transition-colors flex items-center justify-center ${
                    active ? "border-accent bg-accent text-[#0b1220]" : "border-line text-text-dim hover:border-accent/40 hover:text-accent"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>
          {current < pages && (
            <Link href={`/news?page=${current + 1}`} className="rounded-lg border border-line px-4 py-2 font-body text-[12px] font-bold text-text-dim transition-colors hover:border-accent/40 hover:text-accent">
              التالي
            </Link>
          )}
        </div>
      )}
    </>
  );
}

interface NewsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="مجلة الأخبار" tag="NEWS" bordered={false} />
        <NewsGrid page={page} />
      </main>
      <Footer />
    </>
  );
}