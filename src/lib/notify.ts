import { prisma } from "@/lib/prisma";
import type { NotificationVM } from "@/lib/types";
import type { Prisma } from "@prisma/client";

/**
 * In-app notifications for users (captains/managers/players).
 *
 * A safe alias around the Notification table: never throws, so a notification
 * failure can never break the business action that triggered it.
 */
export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    await (tx ?? prisma).notification.create({
      data: { userId, title, body },
    });
  } catch (error) {
    console.error("[notifyUser] failed:", error);
  }
}

/** Notify every user linked to a team: the owner and every manager. */
export async function notifyTeamContacts(
  teamId: string,
  title: string,
  body: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const team = await (tx ?? prisma).team.findUnique({
      where: { id: teamId },
      select: {
        ownerId: true,
        managers: { select: { id: true } },
      },
    });
    if (!team) return;

    const userIds = new Set<string>();
    if (team.ownerId) userIds.add(team.ownerId);
    for (const m of team.managers) userIds.add(m.id);

    for (const userId of userIds) {
      await notifyUser(userId, title, body, tx);
    }
  } catch (error) {
    console.error("[notifyTeamContacts] failed:", error);
  }
}

export async function getUserNotifications(
  userId: string,
  limit = 20,
): Promise<NotificationVM[]> {
  try {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, body: true, readAt: true, createdAt: true },
    });
    return rows;
  } catch (error) {
    console.error("[getUserNotifications] failed:", error);
    return [];
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: { userId, readAt: null },
    });
  } catch (error) {
    console.error("[getUnreadNotificationCount] failed:", error);
    return 0;
  }
}