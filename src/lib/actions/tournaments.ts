"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createTournamentSchema, updateTournamentSchema, cuid } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

// ---------------------------------------------------------------------------
// Tournament-team association
// ---------------------------------------------------------------------------

export async function addTeamToTournament(tournamentId: string, teamId: string) {
  await requireAdmin();

  const tIdParsed = cuid.safeParse(tournamentId);
  if (!tIdParsed.success) throw new Error("معرف البطولة غير صالح");
  const teamIdParsed = cuid.safeParse(teamId);
  if (!teamIdParsed.success) throw new Error("معرف الفريق غير صالح");

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true, name: true } });
  if (!tournament) throw new Error("البطولة غير موجودة");

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } });
  if (!team) throw new Error("الفريق غير موجود");

  const existing = await prisma.tournamentTeam.findUnique({
    where: { tournamentId_teamId: { tournamentId, teamId } },
  });
  if (existing) throw new Error(`${team.name} مسجّل بالفعل في ${tournament.name}`);

  await prisma.tournamentTeam.create({ data: { tournamentId, teamId } });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/standings");
}

export async function removeTeamFromTournament(tournamentId: string, teamId: string) {
  await requireAdmin();

  const tIdParsed = cuid.safeParse(tournamentId);
  if (!tIdParsed.success) throw new Error("معرف البطولة غير صالح");
  const teamIdParsed = cuid.safeParse(teamId);
  if (!teamIdParsed.success) throw new Error("معرف الفريق غير صالح");

  const entry = await prisma.tournamentTeam.findUnique({
    where: { tournamentId_teamId: { tournamentId, teamId } },
  });
  if (!entry) throw new Error("الفريق غير مسجّل في هذه البطولة");

  await prisma.tournamentTeam.delete({ where: { tournamentId_teamId: { tournamentId, teamId } } });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/standings");
}

export async function createTournament(formData: FormData) {
  const user = await requireAdmin();

  const parsed = createTournamentSchema.safeParse({
    name: formData.get("name"),
    format: formData.get("format") || undefined,
    status: formData.get("status") || undefined,
    startDate: formData.get("startDate") || new Date().toISOString(),
    logoUrl: formData.get("logoUrl") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "بيانات غير صالحة");
  }

  const { name, format, status, startDate, logoUrl, coverUrl } = parsed.data;

  const tournament = await prisma.tournament.create({
    data: {
      name,
      format,
      status,
      startDate: new Date(startDate),
      logoUrl: logoUrl ?? null,
      coverUrl: coverUrl ?? null,
    },
  });

  await auditLog({
    actorId: user.id,
    action: "CREATE_TOURNAMENT",
    targetId: tournament.id,
    metadata: { name, format },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  revalidatePath("/tournaments");
  revalidatePath("/");
}

export async function updateTournament(formData: FormData) {
  const user = await requireAdmin();

  const rawId = String(formData.get("id") || "");
  if (!rawId) throw new Error("معرف البطولة مطلوب");

  const idParsed = cuid.safeParse(rawId);
  if (!idParsed.success) throw new Error("معرف البطولة غير صالح");

  const parsed = updateTournamentSchema.safeParse({
    id: rawId,
    name: formData.get("name"),
    format: formData.get("format") || undefined,
    status: formData.get("status") || undefined,
    startDate: formData.get("startDate") || new Date().toISOString(),
    logoUrl: formData.get("logoUrl") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "بيانات غير صالحة");
  }

  const { name, format, status, startDate, logoUrl, coverUrl } = parsed.data;

  await prisma.tournament.update({
    where: { id: rawId },
    data: { name, format, status, startDate: new Date(startDate), logoUrl: logoUrl ?? null, coverUrl: coverUrl ?? null },
  });

  await auditLog({
    actorId: user.id,
    action: "UPDATE_TOURNAMENT",
    targetId: rawId,
    metadata: { name, format, status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${rawId}`);
}

export async function deleteTournament(formData: FormData) {
  const user = await requireAdmin();

  const rawId = String(formData.get("id") || "");
  if (!rawId) throw new Error("معرف البطولة مطلوب");

  const idParsed = cuid.safeParse(rawId);
  if (!idParsed.success) throw new Error("معرف البطولة غير صالح");

  await prisma.tournament.delete({ where: { id: rawId } });

  await auditLog({
    actorId: user.id,
    action: "DELETE_TOURNAMENT",
    targetId: rawId,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tournaments");
  revalidatePath("/tournaments");
  revalidatePath("/");
}
