"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getTeamSquadSize } from "@/lib/data/teams";
import type { Result } from "@/lib/types";

const SQUAD_LIMIT = 20;

type TeamResult = Result<{ id: string }>;

export async function createTeam(
  _prev: TeamResult,
  formData: FormData,
): Promise<TeamResult> {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const shortName = String(formData.get("shortName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const logoUrl = String(formData.get("logoUrl") || "").trim() || null;

  if (!name || !shortName) {
    return { status: "error", message: "اسم الفريق والاسم المختصر مطلوبان" };
  }

  const team = await prisma.team.create({
    data: { name, shortName, city: city || "الإسكندرية", crestUrl: logoUrl },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/teams");
  revalidatePath("/teams");

  return { status: "success", data: { id: team.id } };
}

export async function updateTeam(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const shortName = String(formData.get("shortName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const logoUrl = String(formData.get("logoUrl") || "").trim() || null;

  if (!id || !name || !shortName) {
    throw new Error("بيانات غير صالحة");
  }

  await prisma.team.update({
    where: { id },
    data: { name, shortName, city: city || undefined, crestUrl: logoUrl },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  revalidatePath(`/teams/${id}`);
}

export async function deleteTeam(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("معرف الفريق مطلوب");

  await prisma.team.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  revalidatePath("/");
}
