"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { newsSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

export type NewsActionResult = { ok: boolean; error?: string };

export async function createNews(formData: FormData): Promise<NewsActionResult> {
  const user = await requireAdmin();

  const parsed = newsSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    imageUrl: formData.get("imageUrl"),
    authorName: formData.get("authorName"),
    publishedAt: formData.get("publishedAt"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const { title, excerpt, body, imageUrl, authorName, publishedAt } = parsed.data;
  const when = publishedAt && publishedAt.trim() ? new Date(publishedAt) : new Date();
  if (isNaN(when.getTime())) return { ok: false, error: "تاريخ النشر غير صالح" };

  try {
    const news = await prisma.news.create({
      data: {
        title,
        excerpt: excerpt || null,
        body,
        imageUrl: imageUrl || null,
        authorName: authorName || user.fullName,
        publishedAt: when,
      },
    });
    await auditLog({
      actorId: user.id,
      action: "CREATE_NEWS",
      targetId: news.id,
      metadata: { title },
    });
  } catch (error) {
    console.error("[createNews]", error);
    return { ok: false, error: "تعذّر نشر الخبر. حاول مرة أخرى." };
  }

  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/");
  return { ok: true };
}

export async function updateNews(formData: FormData): Promise<NewsActionResult> {
  const user = await requireAdmin();

  const parsed = newsSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    imageUrl: formData.get("imageUrl"),
    authorName: formData.get("authorName"),
    publishedAt: formData.get("publishedAt"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const { id, title, excerpt, body, imageUrl, authorName, publishedAt } = parsed.data;
  if (!id) return { ok: false, error: "معرف الخبر مفقود" };

  const when = publishedAt && publishedAt.trim() ? new Date(publishedAt) : new Date();
  if (isNaN(when.getTime())) return { ok: false, error: "تاريخ النشر غير صالح" };

  try {
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "الخبر غير موجود" };

    await prisma.news.update({
      where: { id },
      data: {
        title,
        excerpt: excerpt || null,
        body,
        imageUrl: imageUrl || null,
        authorName: authorName || user.fullName,
        publishedAt: when,
      },
    });
    await auditLog({
      actorId: user.id,
      action: "UPDATE_NEWS",
      targetId: id,
      metadata: { title },
    });
  } catch (error) {
    console.error("[updateNews]", error);
    return { ok: false, error: "تعذّر تعديل الخبر. حاول مرة أخرى." };
  }

  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteNews(formData: FormData): Promise<NewsActionResult> {
  const user = await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, error: "معرف الخبر مفقود" };

  try {
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "الخبر غير موجود" };

    await prisma.news.delete({ where: { id } });
    await auditLog({
      actorId: user.id,
      action: "DELETE_NEWS",
      targetId: id,
      metadata: { title: existing.title },
    });
  } catch (error) {
    console.error("[deleteNews]", error);
    return { ok: false, error: "تعذّر حذف الخبر." };
  }

  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/");
  return { ok: true };
}