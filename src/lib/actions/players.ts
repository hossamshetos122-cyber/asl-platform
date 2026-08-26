"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { getTeamSquadSize } from "@/lib/data/teams";

const SQUAD_LIMIT = 20;

export async function createPlayer(formData: FormData) {
  await requireAdmin();

  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const phone = String(formData.get("phone") || "").trim() || null;
  const photoUrl = String(formData.get("photoUrl") || "").trim() || null;
  const jerseyNumberStr = String(formData.get("jerseyNumber") || "");
  const position = String(formData.get("position") || "MIDFIELDER");
  const dobStr = String(formData.get("dateOfBirth") || "");
  const teamId = String(formData.get("teamId") || "") || null;

  if (!fullName || !email || !password) {
    throw new Error("الاسم والبريد الإلكتروني وكلمة المرور مطلوبة");
  }

  if (password.length < 6) {
    throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("البريد الإلكتروني مسجّل بالفعل");
  }

  if (teamId) {
    const squadSize = await getTeamSquadSize(teamId);
    if (squadSize >= SQUAD_LIMIT) {
      throw new Error(`الحد الأقصى للاعبين في الفريق هو ${SQUAD_LIMIT} لاعب`);
    }
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, phone, role: "PLAYER" },
  });

  const player = await prisma.player.create({
    data: {
      userId: user.id,
      photoUrl,
      jerseyNumber: jerseyNumberStr ? parseInt(jerseyNumberStr, 10) : null,
      position,
      dateOfBirth: dobStr ? new Date(dobStr) : null,
    },
  });

  if (teamId) {
    await prisma.teamMembership.create({
      data: { teamId, playerId: player.id, status: "ACTIVE" },
    });
  }

  revalidatePath("/teams");
  revalidatePath("/admin/players");
  revalidatePath("/admin");
}

export async function updatePlayer(id: string, formData: FormData) {
  await requireAdmin();

  const fullName = String(formData.get("fullName") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const photoUrl = String(formData.get("photoUrl") || "").trim() || null;
  const jerseyNumberStr = String(formData.get("jerseyNumber") || "");
  const position = String(formData.get("position") || "") || null;
  const dobStr = String(formData.get("dateOfBirth") || "");

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) throw new Error("اللاعب غير موجود");

  if (fullName) {
    await prisma.user.update({
      where: { id: player.userId },
      data: { fullName, phone },
    });
  }

  const data: Record<string, unknown> = {};
  if (photoUrl !== undefined) data.photoUrl = photoUrl || null;
  if (jerseyNumberStr !== "") {
    data.jerseyNumber = jerseyNumberStr ? parseInt(jerseyNumberStr, 10) : null;
  }
  if (position) data.position = position;
  if (dobStr) {
    data.dateOfBirth = new Date(dobStr);
  }

  await prisma.player.update({ where: { id }, data });

  revalidatePath("/teams");
  revalidatePath("/admin/players");
}

export async function deletePlayer(id: string) {
  await requireAdmin();

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) throw new Error("اللاعب غير موجود");

  await prisma.player.delete({ where: { id } });
  await prisma.user.delete({ where: { id: player.userId } });

  revalidatePath("/teams");
  revalidatePath("/admin/players");
  revalidatePath("/admin");
}

export async function addToTeam(teamId: string, playerId: string) {
  await requireAdmin();

  const squadSize = await getTeamSquadSize(teamId);
  if (squadSize >= SQUAD_LIMIT) {
    throw new Error(`الحد الأقصى للاعبين في الفريق هو ${SQUAD_LIMIT} لاعب`);
  }

  const existing = await prisma.teamMembership.findUnique({
    where: { teamId_playerId: { teamId, playerId } },
  });

  if (existing) {
    if (existing.status === "REMOVED" || existing.status === "PENDING") {
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

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/admin/players");
}

export async function removeFromTeam(teamId: string, playerId: string) {
  await requireAdmin();

  await prisma.teamMembership.updateMany({
    where: { teamId, playerId },
    data: { status: "REMOVED" },
  });

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/admin/players");
}
