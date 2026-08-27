"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, getCurrentUser } from "@/lib/auth";
import { getTeamSquadSize } from "@/lib/data/teams";
import {
  createPlayerSchema,
  updatePlayerSchema,
  cuid,
} from "@/lib/validation";
import { auditLog } from "@/lib/audit";

const SQUAD_LIMIT = 20;

async function requireTeamAccess(teamId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  if (user.role === "ADMIN") return user;

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
  if (!team) throw new Error("الفريق غير موجود");
  if (team.ownerId !== user.id) throw new Error("غير مصرح لك بإدارة لاعبي هذا الفريق");

  return user;
}

async function requirePlayerAccess(playerId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  if (user.role === "ADMIN") return user;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { team: { select: { ownerId: true } } },
        take: 1,
      },
    },
  });

  if (!player) throw new Error("اللاعب غير موجود");

  const isOwnedByUser = player.memberships.some((m) => m.team.ownerId === user.id);
  if (!isOwnedByUser) throw new Error("غير مصرح لك بتعديل هذا اللاعب");

  return user;
}

type PlayerActionResult = { success: boolean; error?: string };

export async function createPlayer(
  _prev: PlayerActionResult,
  formData: FormData,
): Promise<PlayerActionResult>;

export async function createPlayer(
  formData: FormData,
): Promise<PlayerActionResult>;

export async function createPlayer(
  prevOrFormData: PlayerActionResult | FormData,
  maybeFormData?: FormData,
): Promise<PlayerActionResult> {
  const formData = prevOrFormData instanceof FormData ? prevOrFormData : maybeFormData!;
  if (!formData) return { success: false, error: "بيانات غير صالحة" };

  const parsed = createPlayerSchema.safeParse({
    teamId: formData.get("teamId"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    photoUrl: formData.get("photoUrl") || undefined,
    jerseyNumber: formData.get("jerseyNumber") || undefined,
    position: formData.get("position") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const { teamId, fullName, phone, photoUrl, jerseyNumber, position } = parsed.data;

  const user = await requireTeamAccess(teamId);

  const squadSize = await getTeamSquadSize(teamId);
  if (squadSize >= SQUAD_LIMIT) {
    return { success: false, error: `الحد الأقصى للاعبين في الفريق هو ${SQUAD_LIMIT} لاعب` };
  }

  const email = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@asl-platform.local`;
  const password = Math.random().toString(36).slice(2, 10);
  const passwordHash = await hashPassword(password);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { email, passwordHash, fullName, phone, role: "PLAYER" },
      });

      const player = await tx.player.create({
        data: {
          userId: createdUser.id,
          photoUrl: photoUrl ?? null,
          jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : null,
          position,
        },
      });

      await tx.teamMembership.create({
        data: { teamId, playerId: player.id, status: "ACTIVE" },
      });

      return player;
    });

    await auditLog({
      actorId: user.id,
      action: "CREATE_PLAYER",
      targetId: result.id,
      metadata: { fullName, teamId },
    });

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/teams");
    revalidatePath("/admin/players");

    return { success: true };
  } catch (error) {
    console.error("[createPlayer]", error);
    return { success: false, error: "تعذّر إضافة اللاعب" };
  }
}

export async function updatePlayer(
  _prev: PlayerActionResult,
  formData: FormData,
): Promise<PlayerActionResult>;

export async function updatePlayer(
  id: string,
  formData: FormData,
): Promise<PlayerActionResult>;

export async function updatePlayer(
  prevOrId: PlayerActionResult | string,
  formData: FormData,
): Promise<PlayerActionResult> {
  const id = typeof prevOrId === "string" ? prevOrId : String(formData.get("playerId") || "");
  if (!id) return { success: false, error: "معرف اللاعب مطلوب" };

  const idParsed = cuid.safeParse(id);
  if (!idParsed.success) return { success: false, error: "معرف اللاعب غير صالح" };

  const user = await requirePlayerAccess(id);

  const parsed = updatePlayerSchema.safeParse({
    id,
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    photoUrl: formData.get("photoUrl") || undefined,
    jerseyNumber: formData.get("jerseyNumber") || undefined,
    position: formData.get("position") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const { fullName, phone, photoUrl, jerseyNumber, position } = parsed.data;

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) return { success: false, error: "اللاعب غير موجود" };

  try {
    await prisma.$transaction(async (tx) => {
      if (fullName) {
        await tx.user.update({
          where: { id: player.userId },
          data: { fullName, phone },
        });
      }

      const data: Record<string, unknown> = {};
      if (photoUrl !== undefined) data.photoUrl = photoUrl || null;
      if (jerseyNumber !== undefined) {
        data.jerseyNumber = jerseyNumber ? parseInt(jerseyNumber, 10) : null;
      }
      if (position) data.position = position;

      await tx.player.update({ where: { id }, data });
    });

    const membership = await prisma.teamMembership.findFirst({
      where: { playerId: id, status: "ACTIVE" },
      select: { teamId: true },
    });

    await auditLog({
      actorId: user.id,
      action: "UPDATE_PLAYER",
      targetId: id,
      metadata: { fullName },
    });

    if (membership) {
      revalidatePath(`/teams/${membership.teamId}`);
    }
    revalidatePath("/teams");
    revalidatePath("/admin/players");

    return { success: true };
  } catch (error) {
    console.error("[updatePlayer]", error);
    return { success: false, error: "تعذّر تعديل اللاعب" };
  }
}

export async function deletePlayer(playerId: string): Promise<PlayerActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "يجب تسجيل الدخول" };

    const idParsed = cuid.safeParse(playerId);
    if (!idParsed.success) return { success: false, error: "معرف اللاعب غير صالح" };

    if (user.role !== "ADMIN") {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: { team: { select: { ownerId: true } } },
            take: 1,
          },
        },
      });

      if (!player) return { success: false, error: "اللاعب غير موجود" };

      const isOwnedByUser = player.memberships.some((m) => m.team.ownerId === user.id);
      if (!isOwnedByUser) return { success: false, error: "غير مصرح لك بحذف هذا اللاعب" };
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return { success: false, error: "اللاعب غير موجود" };

    const memberships = await prisma.teamMembership.findMany({
      where: { playerId },
      select: { teamId: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.player.delete({ where: { id: playerId } });
      try {
        await tx.user.delete({ where: { id: player.userId } });
      } catch {
        // User may have AuditLog FK Restrict — leave orphaned user record
      }
    });

    await auditLog({
      actorId: user.id,
      action: "DELETE_PLAYER",
      targetId: playerId,
    });

    for (const m of memberships) {
      revalidatePath(`/teams/${m.teamId}`);
    }
    revalidatePath("/teams");
    revalidatePath("/admin/players");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("[deletePlayer]", error);
    return { success: false, error: "تعذّر حذف اللاعب" };
  }
}

export async function addToTeam(teamId: string, playerId: string) {
  const teamIdParsed = cuid.safeParse(teamId);
  if (!teamIdParsed.success) throw new Error("معرف الفريق غير صالح");
  const playerIdParsed = cuid.safeParse(playerId);
  if (!playerIdParsed.success) throw new Error("معرف اللاعب غير صالح");

  const user = await requireTeamAccess(teamId);

  const squadSize = await getTeamSquadSize(teamId);
  if (squadSize >= SQUAD_LIMIT) {
    throw new Error(`الحد الأقصى للاعبين في الفريق هو ${SQUAD_LIMIT} لاعب`);
  }

  // Verify player exists
  const playerExists = await prisma.player.findUnique({ where: { id: playerId }, select: { id: true } });
  if (!playerExists) throw new Error("اللاعب غير موجود");

  const existing = await prisma.teamMembership.findUnique({
    where: { teamId_playerId: { teamId, playerId } },
  });

  if (existing) {
    if (existing.status === "ACTIVE") {
      return;
    }
    if (existing.status === "REMOVED" || existing.status === "PENDING" || existing.status === "REJECTED") {
      await prisma.teamMembership.update({
        where: { id: existing.id },
        data: { status: "ACTIVE" },
      });
    }
  } else {
    await prisma.teamMembership.create({
      data: { teamId, playerId, status: "ACTIVE" },
    });
  }

  await auditLog({
    actorId: user.id,
    action: "ADD_PLAYER_TO_TEAM",
    targetId: teamId,
    metadata: { playerId },
  });

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/admin/players");
}

export async function removeFromTeam(teamId: string, playerId: string) {
  const teamIdParsed = cuid.safeParse(teamId);
  if (!teamIdParsed.success) throw new Error("معرف الفريق غير صالح");
  const playerIdParsed = cuid.safeParse(playerId);
  if (!playerIdParsed.success) throw new Error("معرف اللاعب غير صالح");

  const user = await requireTeamAccess(teamId);

  try {
    await prisma.teamMembership.updateMany({
      where: { teamId, playerId },
      data: { status: "REMOVED" },
    });

    await auditLog({
      actorId: user.id,
      action: "REMOVE_PLAYER_FROM_TEAM",
      targetId: teamId,
      metadata: { playerId },
    });

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/admin/players");
  } catch (error) {
    console.error("[removeFromTeam]", error);
    throw new Error("تعذّر إزالة اللاعب من الفريق");
  }
}
