import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getNewsById, getLatestNews } from "@/lib/data/news";
import { ImageDisplay } from "@/components/ui/image-display";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

interface NewsDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params;
  const result = await getNewsById(id);

  if (result.status === "error" || result.status === "empty") notFound();

  const item = result.data;
  const related = await getLatestNews(3);

  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <Link href="/news" className="mb-5 inline-flex items-center gap-1.5 py-2 -my-2 font-body text-sm font-bold text-accent hover:text-accent-bright transition-colors">
          <svg className="h-3.5 w-3.5 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6h8M7 3l3 3-3 3" /></svg>
          العودة للأخبار
        </Link>

        <article className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center gap-2 font-body text-[11px] text-text-dimmer">
            <span className="badge-accent">خبر</span>
            <span>{formatDate(item.publishedAt)}</span>
            {item.authorName && (
              <>
                <span className="h-0.5 w-0.5 rounded-full bg-text-dimmer" />
                <span>{item.authorName}</span>
              </>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-black leading-tight text-text">{item.title}</h1>

          {item.excerpt && (
            <p className="mt-3 border-r-2 border-accent/50 pr-4 font-body text-[14px] leading-relaxed text-text-dim">
              {item.excerpt}
            </p>
          )}

          <div className="mt-6 overflow-hidden rounded-xl border border-line">
            <div className="relative h-56 sm:h-80">
              {item.imageUrl ? (
                <ImageDisplay src={item.imageUrl} alt={item.title} type="news" fill className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-elevated/40">
                  <svg className="h-16 w-16 text-text-dimmer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h16v12H4zM8 10h8M8 14h5" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {item.body
              .split(/\n+/)
              .filter((p) => p.trim().length > 0)
              .map((paragraph, i) => (
                <p key={i} className="font-body text-[15px] leading-loose text-text">
                  {paragraph}
                </p>
              ))}
          </div>
        </article>

        {related.status === "success" && related.data.length > 1 && (
          <section className="mt-12 border-t border-line pt-8">
            <h2 className="mb-4 font-display text-lg font-black text-text">مواضيع ذات صلة</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {related.data
                .filter((r) => r.id !== item.id)
                .slice(0, 3)
                .map((r) => (
                  <Link
                    key={r.id}
                    href={`/news/${r.id}`}
                    className="group rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/40"
                  >
                    <div className="flex items-center gap-2 font-body text-[10px] text-text-dimmer">
                      <span>{formatDate(r.publishedAt)}</span>
                    </div>
                    <h3 className="mt-1.5 font-display text-[13px] font-black leading-snug text-text group-hover:text-accent transition-colors line-clamp-2">
                      {r.title}
                    </h3>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}