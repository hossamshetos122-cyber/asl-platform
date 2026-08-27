"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createTeamSchema, updateTeamSchema, cuid } from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import type { Result } from "@/lib/types";

type TeamResult = Result<{ id: string }>;

async function requireTeamOwner(teamId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  if (user.role === "ADMIN") return user;

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
  if (!team) throw new Error("الفريق غير موجود");
  if (team.ownerId !== user.id) throw new Error("غير مصرح لك بتعديل هذا الفريق");

  return user;
}

export async function createTeam(
  _prev: TeamResult,
  formData: FormData,
): Promise<TeamResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "يجب تسجيل الدخول أولاً" };

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    city: formData.get("city") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { status: "error", message: first?.message ?? "بيانات غير صالحة" };
  }

  const { name, shortName, city, logoUrl } = parsed.data;

  try {
    const team = await prisma.team.create({
      data: {
        name,
        shortName,
        city,
        crestUrl: logoUrl ?? null,
        ownerId: user.id,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "CREATE_TEAM",
      targetId: team.id,
      metadata: { name },
    });

    revalidatePath("/teams");
    revalidatePath("/dashboard");

    return { status: "success", data: { id: team.id } };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { status: "error", message: "يوجد فريق بنفس الاسم مسبقاً" };
    }
    return { status: "error", message: "تعذّر إنشاء الفريق" };
  }
}

export async function updateTeam(formData: FormData) {
  const rawId = String(formData.get("id") || "");
  if (!rawId) throw new Error("معرف الفريق مطلوب");

  const idParsed = cuid.safeParse(rawId);
  if (!idParsed.success) throw new Error("معرف الفريق غير صالح");

  const user = await requireTeamOwner(idParsed.data);

  const parsed = updateTeamSchema.safeParse({
    id: rawId,
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    city: formData.get("city") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "بيانات غير صالحة");
  }

  const { name, shortName, city, logoUrl } = parsed.data;

  await prisma.team.update({
    where: { id: rawId },
    data: { name, shortName, city, crestUrl: logoUrl ?? null },
  });

  await auditLog({
    actorId: user.id,
    action: "UPDATE_TEAM",
    targetId: rawId,
    metadata: { name },
  });

  revalidatePath("/teams");
  revalidatePath(`/teams/${rawId}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/teams");
}

export async function deleteTeam(formData: FormData) {
  const rawId = String(formData.get("id") || "");
  if (!rawId) throw new Error("معرف الفريق مطلوب");

  const idParsed = cuid.safeParse(rawId);
  if (!idParsed.success) throw new Error("معرف الفريق غير صالح");

  const user = await requireTeamOwner(rawId);

  await prisma.team.delete({ where: { id: rawId } });

  await auditLog({
    actorId: user.id,
    action: "DELETE_TEAM",
    targetId: rawId,
  });

  revalidatePath("/teams");
  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/teams");
}
