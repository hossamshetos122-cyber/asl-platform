"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { createManagerAccountSchema, createRefereeAccountSchema, cuid } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

export type AccountActionResult = { ok: boolean; error?: string };

export async function createManagerAccount(formData: FormData): Promise<AccountActionResult> {
  const user = await requireAdmin();

  const parsed = createManagerAccountSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    teamId: formData.get("teamId"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const { fullName, email, password, teamId } = parsed.data;

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } });
  if (!team) return { ok: false, error: "الفريق غير موجود" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "هذا البريد مسجّل بالفعل" };

  const passwordHash = await hashPassword(password);

  try {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: "TEAM_MANAGER",
        managedTeams: { connect: { id: teamId } },
      },
    });
  } catch (error) {
    console.error("[createManagerAccount]", error);
    return { ok: false, error: "تعذّر إنشاء الحساب. حاول مرة أخرى." };
  }

  await auditLog({
    actorId: user.id,
    action: "CREATE_TEAM_MANAGER",
    targetId: teamId,
    metadata: { email, teamName: team.name, fullName },
  });

  revalidatePath("/admin/accounts");
  return { ok: true };
}

export async function createRefereeAccount(formData: FormData): Promise<AccountActionResult> {
  const user = await requireAdmin();

  const parsed = createRefereeAccountSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    licenseNo: formData.get("licenseNo"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const { fullName, email, password, licenseNo } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "هذا البريد مسجّل بالفعل" };

  const passwordHash = await hashPassword(password);

  try {
    const refereeUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: "REFEREE",
        refereeProfile: { create: { licenseNo: licenseNo || null } },
      },
    });
    await auditLog({
      actorId: user.id,
      action: "CREATE_REFEREE",
      targetId: refereeUser.id,
      metadata: { email, fullName, licenseNo: licenseNo || null },
    });
  } catch (error) {
    console.error("[createRefereeAccount]", error);
    return { ok: false, error: "تعذّر إنشاء الحساب. حاول مرة أخرى." };
  }

  revalidatePath("/admin/accounts");
  revalidatePath("/admin/matches");
  return { ok: true };
}

export async function unlinkManager(formData: FormData): Promise<AccountActionResult> {
  const user = await requireAdmin();

  const userId = String(formData.get("userId") || "");
  const teamId = String(formData.get("teamId") || "");

  const [userIdOk, teamIdOk] = await Promise.all([
    cuid.safeParse(userId),
    cuid.safeParse(teamId),
  ]);
  if (!userIdOk.success || !teamIdOk.success) return { ok: false, error: "بيانات غير صالحة" };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { managedTeams: { disconnect: { id: teamId } } },
    });
  } catch (error) {
    console.error("[unlinkManager]", error);
    return { ok: false, error: "تعذّر إلغاء الربط." };
  }

  await auditLog({
    actorId: user.id,
    action: "UNLINK_TEAM_MANAGER",
    targetId: teamId,
    metadata: { userId },
  });

  revalidatePath("/admin/accounts");
  return { ok: true };
}