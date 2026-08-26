"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function createTournament(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const format = String(formData.get("format") || "LEAGUE");
  const status = String(formData.get("status") || "UPCOMING");
  const startDate = String(formData.get("startDate") || new Date().toISOString());

  if (!name) {
    throw new Error("اسم البطولة مطلوب");
  }

  await prisma.tournament.create({
    data: {
      name,
      format,
      status,
      startDate: new Date(startDate),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  revalidatePath("/tournaments");
  revalidatePath("/");
}

export async function updateTournament(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const format = String(formData.get("format") || "LEAGUE");
  const status = String(formData.get("status") || "UPCOMING");
  const startDate = String(formData.get("startDate") || new Date().toISOString());

  if (!id || !name) {
    throw new Error("بيانات غير صالحة");
  }

  await prisma.tournament.update({
    where: { id },
    data: { name, format, status, startDate: new Date(startDate) },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${id}`);
}

export async function deleteTournament(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("معرف البطولة مطلوب");

  await prisma.tournament.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  revalidatePath("/tournaments");
  revalidatePath("/");
}
