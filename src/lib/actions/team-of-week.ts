"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { FORMATIONS, getFormationSlots } from "@/lib/formations";
import { LINEUP_SIZE } from "@/lib/team-of-week";
import { getFeaturedTournament, getPlayerAssistCounts, getPlayerGoalCounts } from "@/lib/stats";
import { computePlayerRating } from "@/lib/ratings";

export interface TeamOfTheWeekActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdminOrThrow() {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  if (user.role !== "ADMIN") throw new Error("غير مصرح لك بتنفيذ هذا الإجراء");
  return user;
}

export async function saveTeamOfTheWeek(input: {
  tournamentId: string;
  weekLabel: string;
  weekStart?: Date | string | null;
  weekEnd?: Date | string | null;
  formation: string;
  managerName?: string | null;
  managerPhotoUrl?: string | null;
  slots: { playerId: string; positionSlot: string; captain: boolean }[];
  ratings: { playerId: string; rating: number | null }[];
}): Promise<TeamOfTheWeekActionResult> {
  try {
    const user = await requireAdminOrThrow();

    const parseDate = (value: Date | string | null | undefined): Date | null => {
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const formation = FORMATIONS.find((f) => f.key === input.formation);
    if (!formation) return { ok: false, error: "تشكيلة غير صالحة." };

    if (!input.weekLabel.trim()) return { ok: false, error: "اكتب اسم الأسبوع." };
    if (input.slots.length !== LINEUP_SIZE) {
      return { ok: false, error: `يجب اختيار ${LINEUP_SIZE} لاعب بالضبط.` };
    }

    const validSlots = new Set(getFormationSlots(formation.key).map((s) => s.key));
    const seen = new Set<string>();
    let captains = 0;
    for (const slot of input.slots) {
      if (!slot.playerId) return { ok: false, error: "كل الخانات يجب أن تحتوي على لاعب." };
      if (seen.has(slot.playerId)) return { ok: false, error: "لا يجوز تكرار نفس اللاعب في التشكيلة." };
      seen.add(slot.playerId);
      if (!validSlots.has(slot.positionSlot)) return { ok: false, error: `مركز "${slot.positionSlot}" غير صالح لتشكيلة ${formation.key}.` };
      if (slot.captain) captains++;
    }
    if (captains > 1) return { ok: false, error: "يوجد كابتن واحد فقط." };

    const tournamentTeams = await prisma.tournamentTeam.findMany({
      where: { tournamentId: input.tournamentId },
      select: { teamId: true },
    });
    if (tournamentTeams.length === 0) return { ok: false, error: "لا توجد أندية مسجّلة في هذه البطولة." };
    const teamIds = tournamentTeams.map((t) => t.teamId);

    const legal = await prisma.player.findMany({
      where: {
        id: { in: [...seen] },
        memberships: { some: { status: "ACTIVE", teamId: { in: teamIds } } },
      },
      select: { id: true },
    });
    if (legal.length !== input.slots.length) {
      return { ok: false, error: "أحد اللاعبين غير مسجّل في أندية هذه البطولة." };
    }

    const ratingUpdates = input.ratings
      .filter((r) => r.playerId && typeof r.rating === "number")
      .filter((r) => seen.has(r.playerId))
      .map((r) =>
        prisma.player.update({
          where: { id: r.playerId },
          data: { rating: Math.max(0, Math.min(100, Math.round(r.rating!))) },
        })
      );

    await prisma.$transaction([
      prisma.teamOfTheWeek.create({
        data: {
          weekLabel: input.weekLabel.trim(),
          weekStart: parseDate(input.weekStart),
          weekEnd: parseDate(input.weekEnd),
          formation: formation.key,
          managerName: input.managerName?.trim() || null,
          managerPhotoUrl: input.managerPhotoUrl || null,
          tournamentId: input.tournamentId,
          createdById: user.id,
          slots: {
            create: input.slots.map((slot, index) => ({
              playerId: slot.playerId,
              positionSlot: slot.positionSlot,
              sortOrder: index,
              captain: slot.captain,
            })),
          },
        },
      }),
      ...ratingUpdates,
    ]);

    await auditLog({
      actorId: user.id,
      action: "SET_TEAM_OF_THE_WEEK",
      targetId: input.tournamentId,
      metadata: { formation: formation.key, week: input.weekLabel, players: input.slots.length },
    });

    revalidatePath("/");
    revalidatePath("/admin/team-of-week");

    return { ok: true };
  } catch (error) {
    console.error("[saveTeamOfTheWeek]", error);
    return { ok: false, error: "تعذّر حفظ فريق الأسبوع." };
  }
}

export async function deleteTeamOfTheWeek(id: string): Promise<TeamOfTheWeekActionResult> {
  try {
    const user = await requireAdminOrThrow();
    await prisma.teamOfTheWeek.delete({ where: { id } });

    await auditLog({
      actorId: user.id,
      action: "DELETE_TEAM_OF_THE_WEEK",
      targetId: id,
    });

    revalidatePath("/");
    revalidatePath("/admin/team-of-week");
    return { ok: true };
  } catch (error) {
    console.error("[deleteTeamOfTheWeek]", error);
    return { ok: false, error: "تعذّر حذف فريق الأسبوع." };
  }
}

/** Recomputed stats → rating (0-100) stored on the Player and returned. */
export async function autoRatePlayer(playerId: string): Promise<{ ok: true; rating: number } | { ok: false; error: string }> {
  try {
    const user = await requireAdminOrThrow();
    const featured = await getFeaturedTournament();
    if (featured.status !== "success") return { ok: false, error: "لا توجد بطولة مميزة." };

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        memberships: { where: { status: "ACTIVE" }, take: 1 },
      },
    });
    if (!player) return { ok: false, error: "اللاعب غير موجود." };

    const teamId = player.memberships[0]?.teamId ?? null;
    const [goals, assists] = await Promise.all([
      getPlayerGoalCounts([playerId]),
      getPlayerAssistCounts([playerId]),
    ]);

    let cleanSheets = 0;
    if (teamId && player.position === "GOALKEEPER") {
      const matches = await prisma.match.findMany({
        where: {
          tournamentId: featured.data.id,
          status: "FINISHED",
          OR: [
            { AND: [{ homeTeamId: teamId }, { awayScore: 0 }] },
            { AND: [{ awayTeamId: teamId }, { homeScore: 0 }] },
          ],
        },
        select: { id: true },
      });
      cleanSheets = matches.length;
    }

    const rating = computePlayerRating({
      goals: goals.get(playerId) ?? 0,
      assists: assists.get(playerId) ?? 0,
      cleanSheets,
      isGoalkeeper: player.position === "GOALKEEPER",
    });

    await prisma.player.update({ where: { id: playerId }, data: { rating } });
    return { ok: true, rating };
  } catch (error) {
    console.error("[autoRatePlayer]", error);
    return { ok: false, error: "تعذّر حساب التقييم." };
  }
}