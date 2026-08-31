import { prisma } from "@/lib/prisma";
import NewsList from "./news-list";

export const metadata = {
  title: "الأخبار | لوحة التحكم",
};

export default async function AdminNewsPage() {
  const items = await prisma.news.findMany({
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      excerpt: true,
      body: true,
      imageUrl: true,
      authorName: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h1 className="font-display text-xl font-black text-text">الأخبار</h1>
          <p className="mt-1 font-body text-[12px] text-text-dim">
            انشر أخبار البطولة والمباريات. تظهر مباشرة في صفحة الأخبار وعلى الصفحة الرئيسية.
          </p>
        </div>
        <span className="badge-accent font-num">{items.length}</span>
      </div>
      <NewsList items={items.map((n) => ({ ...n, publishedAt: n.publishedAt.toISOString(), createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() }))} />
    </div>
  );
}