"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireReferee } from "@/lib/auth";
import { updateScoreSchema, addMatchEventSchema, MatchStatus, MatchEventType, cuid } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

export type RefereeActionResult = { ok: boolean; error?: string };

/**
 * Referees may only touch matches explicitly assigned to them.
 * Admins may drive any match from the referee portal as well.
 */
async function assertRefereeForMatch(user: Awaited<ReturnType<typeof requireReferee>>, matchId: string) {
  if (user.role === "ADMIN") return;

  const profile = await prisma.referee.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!profile) throw new Error("لا يوجد ملف حكم لهذا الحساب");

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { refereeId: true },
  });
  if (!match) throw new Error("المباراة غير موجودة");
  if (match.refereeId !== profile.id) throw new Error("هذه المباراة غير مسندة إليك");
}

const REFEREE_STATUSES = new Set(["LIVE", "HALFTIME", "FINISHED"]);

export async function refereeSetScore(formData: FormData): Promise<RefereeActionResult> {
  const user = await requireReferee();

  const rawStatus = String(formData.get("status") || "LIVE");
  const matchId = String(formData.get("matchId") || "");
  const homeScore = parseInt(String(formData.get("homeScore") || "0"), 10);
  const awayScore = parseInt(String(formData.get("awayScore") || "0"), 10);
  const minuteRaw = String(formData.get("minute") || "");
  const minute = minuteRaw === "" ? null : parseInt(minuteRaw, 10);

  const status = MatchStatus.safeParse(rawStatus);
  if (!status.success || !REFEREE_STATUSES.has(status.data)) {
    return { ok: false, error: "حالة المباراة غير صالحة" };
  }
  if (minute !== null && (isNaN(minute) || minute < 0 || minute > 120)) {
    return { ok: false, error: "الدقيقة يجب أن تكون بين 0 و 120" };
  }

  const parsed = updateScoreSchema.safeParse({ matchId, homeScore, awayScore });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
    select: { id: true, status: true, tournamentId: true },
  });
  if (!match) return { ok: false, error: "المباراة غير موجودة" };
  if (match.status === "CANCELLED") return { ok: false, error: "لا يمكن تعديل مباراة ملغاة" };

  try {
    await assertRefereeForMatch(user, parsed.data.matchId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "غير مصرح" };
  }

  await prisma.match.update({
    where: { id: parsed.data.matchId },
    data: {
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      status: status.data,
      minute: minute === null && status.data === "LIVE" ? null : minute,
    },
  });

  await auditLog({
    actorId: user.id,
    action: "REFEREE_SET_SCORE",
    targetId: parsed.data.matchId,
    metadata: { homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore, status: status.data, minute },
  });

  revalidatePath("/matches");
  revalidatePath(`/matches/${parsed.data.matchId}`);
  revalidatePath("/standings");
  revalidatePath("/top-scorers");
  revalidatePath("/referee");
  revalidatePath("/");
  revalidatePath(`/tournaments/${match.tournamentId}`);
  return { ok: true };
}

export async function refereeAddEvent(formData: FormData): Promise<RefereeActionResult> {
  const user = await requireReferee();

  const matchId = String(formData.get("matchId") || "");
  const rawMinute = String(formData.get("minute") || "0");
  const minuteNum = parseInt(rawMinute, 10);
  if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 120) {
    return { ok: false, error: "الدقيقة يجب أن تكون بين 0 و 120" };
  }

  const type = MatchEventType.safeParse(String(formData.get("type") || ""));
  if (!type.success) return { ok: false, error: "نوع الحدث غير صالح" };

  const parsed = addMatchEventSchema.safeParse({
    matchId,
    playerId: formData.get("playerId"),
    teamId: formData.get("teamId"),
    type: type.data,
    minute: minuteNum,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  try {
    await assertRefereeForMatch(user, parsed.data.matchId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "غير مصرح" };
  }

  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
    select: { id: true, homeTeamId: true, awayTeamId: true, status: true },
  });
  if (!match) return { ok: false, error: "المباراة غير موجودة" };
  if (match.status === "CANCELLED") return { ok: false, error: "لا يمكن إضافة أحداث لمباراة ملغاة" };
  if (match.status === "FINISHED") {
    return { ok: false, error: "لا يمكن إضافة أحداث لمباراة منتهية" };
  }
  if (parsed.data.teamId !== match.homeTeamId && parsed.data.teamId !== match.awayTeamId) {
    return { ok: false, error: "الفريق غير مشارك في هذه المباراة" };
  }

  const membership = await prisma.teamMembership.findUnique({
    where: { teamId_playerId: { teamId: parsed.data.teamId, playerId: parsed.data.playerId } },
    select: { status: true },
  });
  if (!membership || membership.status !== "ACTIVE") {
    return { ok: false, error: "اللاعب غير مسجّل في هذا الفريق" };
  }

  await prisma.matchEvent.create({
    data: {
      matchId: parsed.data.matchId,
      playerId: parsed.data.playerId,
      teamId: parsed.data.teamId,
      type: parsed.data.type,
      minute: parsed.data.minute,
    },
  });

  await auditLog({
    actorId: user.id,
    action: "REFEREE_ADD_EVENT",
    targetId: parsed.data.matchId,
    metadata: { playerId: parsed.data.playerId, teamId: parsed.data.teamId, type: parsed.data.type, minute: parsed.data.minute },
  });

  revalidatePath("/matches");
  revalidatePath(`/matches/${parsed.data.matchId}`);
  revalidatePath("/referee");
  revalidatePath("/top-scorers");
  revalidatePath("/");
  return { ok: true };
}

export async function refereeRemoveEvent(formData: FormData): Promise<RefereeActionResult> {
  const user = await requireReferee();

  const matchId = String(formData.get("matchId") || "");
  const eventId = String(formData.get("eventId") || "");
  if (!cuid.safeParse(matchId).success || !cuid.safeParse(eventId).success) {
    return { ok: false, error: "بيانات غير صالحة" };
  }

  try {
    await assertRefereeForMatch(user, matchId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "غير مصرح" };
  }

  const event = await prisma.matchEvent.findUnique({ where: { id: eventId } });
  if (!event || event.matchId !== matchId) {
    return { ok: false, error: "الحدث غير موجود" };
  }

  await prisma.matchEvent.delete({ where: { id: eventId } });

  await auditLog({
    actorId: user.id,
    action: "REFEREE_REMOVE_EVENT",
    targetId: matchId,
    metadata: { eventId, type: event.type },
  });

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/referee");
  revalidatePath("/top-scorers");
  revalidatePath("/");
  return { ok: true };
}