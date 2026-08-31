import { prisma } from "@/lib/prisma";
import type { NewsVM, Result } from "@/lib/types";

function toNewsVM(n: {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  imageUrl: string | null;
  authorName: string | null;
  publishedAt: Date;
  createdAt: Date;
}): NewsVM {
  return {
    id: n.id,
    title: n.title,
    excerpt: n.excerpt,
    body: n.body,
    imageUrl: n.imageUrl,
    authorName: n.authorName,
    publishedAt: n.publishedAt,
    createdAt: n.createdAt,
  };
}

/** Home section: the N newest published articles. */
export async function getLatestNews(limit = 3): Promise<Result<NewsVM[]>> {
  try {
    const items = await prisma.news.findMany({
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    if (items.length === 0) return { status: "empty" };
    return { status: "success", data: items.map(toNewsVM) };
  } catch (error) {
    console.error("[getLatestNews]", error);
    return { status: "error", message: "تعذّر تحميل آخر الأخبار." };
  }
}

export type NewsPageVM = {
  items: NewsVM[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
};

/** Paginated list for /news. Uses date-based cursor for stable ordering. */
export async function getNewsPage(page = 1, perPage = 9): Promise<Result<NewsPageVM>> {
  try {
    const safePage = Math.max(1, Math.floor(page));
    const skip = (safePage - 1) * perPage;

    const [items, total] = await Promise.all([
      prisma.news.findMany({
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        skip,
        take: perPage,
      }),
      prisma.news.count(),
    ]);

    return {
      status: "success",
      data: {
        items: items.map(toNewsVM),
        total,
        page: safePage,
        perPage,
        pages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  } catch (error) {
    console.error("[getNewsPage]", error);
    return { status: "error", message: "تعذّر تحميل مجلة الأخبار." };
  }
}

export async function getNewsById(id: string): Promise<Result<NewsVM>> {
  try {
    const item = await prisma.news.findUnique({ where: { id } });
    if (!item) return { status: "empty" };
    return { status: "success", data: toNewsVM(item) };
  } catch (error) {
    console.error("[getNewsById]", error);
    return { status: "error", message: "تعذّر تحميل الخبر." };
  }
}