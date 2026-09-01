"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cuid } from "@/lib/validation";

export type NotificationActionResult = { success: boolean; error?: string };

/** Mark a single notification as read. */
export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationActionResult> {
  try {
    const user = await requireUser();

    const idParsed = cuid.safeParse(notificationId);
    if (!idParsed.success) return { success: false, error: "معرف غير صالح" };

    await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { readAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("[markNotificationRead]", error);
    return { success: false, error: "تعذّر تنفيذ العملية" };
  }
}

/** Mark every notification of the current user as read. */
export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  try {
    const user = await requireUser();

    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    revalidatePath("/dashboard");
    revalidatePath("/manage");
    return { success: true };
  } catch (error) {
    console.error("[markAllNotificationsRead]", error);
    return { success: false, error: "تعذّر تنفيذ العملية" };
  }
}