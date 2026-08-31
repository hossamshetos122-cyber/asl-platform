"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { TEAM_OF_WEEK_POSITIONS, LINEUP_SIZE } from "@/lib/team-of-week";

async function requireAdminOrThrow() {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  if (user.role !== "ADMIN") throw new Error("غير مصرح لك بتنفيذ هذا الإجراء");
  return user;
}

export interface TeamOfWeekActionResult {
  ok: boolean;
  error?: string;
}

export async function setTeamOfWeekPlayers(input: {
  tournamentId: string;
  players: { playerId: string; position: string }[];
}): Promise<TeamOfWeekActionResult> {
  try {
    const user = await requireAdminOrThrow();
    const { tournamentId, players } = input;

    if (!tournamentId) {
      return { ok: false, error: "اختر البطولة." };
    }

    if (players.length !== LINEUP_SIZE) {
      return { ok: false, error: `يجب اختيار ${LINEUP_SIZE} لاعب بالضبط.` };
    }

    const seen = new Set<string>();
    for (const entry of players) {
      if (!entry.playerId) {
        return { ok: false, error: "كل الخانات يجب أن تحتوي على لاعب." };
      }
      if (seen.has(entry.playerId)) {
        return { ok: false, error: "لا يجوز تكرار نفس اللاعب في التشكيلة." };
      }
      seen.add(entry.playerId);
      if (!(TEAM_OF_WEEK_POSITIONS as readonly string[]).includes(entry.position)) {
        return { ok: false, error: "مركز غير صالح." };
      }
    }

    const tournamentTeams = await prisma.tournamentTeam.findMany({
      where: { tournamentId },
      select: { teamId: true },
    });
    if (tournamentTeams.length === 0) {
      return { ok: false, error: "لا توجد أندية مسجّلة في هذه البطولة." };
    }
    const teamIds = tournamentTeams.map((t) => t.teamId);

    const legal = await prisma.player.findMany({
      where: {
        id: { in: [...seen] },
        memberships: {
          some: { status: "ACTIVE", teamId: { in: teamIds } },
        },
      },
      select: { id: true },
    });
    if (legal.length !== players.length) {
      return { ok: false, error: "أحد اللاعبين غير مسجّل في أندية هذه البطولة." };
    }

    await prisma.$transaction([
      prisma.teamOfWeekPlayer.deleteMany({ where: { tournamentId } }),
      prisma.teamOfWeekPlayer.createMany({
        data: players.map((entry, index) => ({
          tournamentId,
          playerId: entry.playerId,
          position: entry.position,
          sortOrder: index + 1,
        })),
      }),
    ]);

    await auditLog({
      actorId: user.id,
      action: "SET_TEAM_OF_WEEK",
      targetId: tournamentId,
      metadata: { players: players.length },
    });

    revalidatePath("/");
    revalidatePath("/admin/team-of-week");

    return { ok: true };
  } catch (error) {
    console.error("[setTeamOfWeekPlayers]", error);
    return { ok: false, error: "تعذّر حفظ فريق الأسبوع." };
  }
}

export async function clearTeamOfWeekPlayers(tournamentId: string): Promise<TeamOfWeekActionResult> {
  try {
    const user = await requireAdminOrThrow();
    if (!tournamentId) return { ok: false, error: "البطولة مطلوبة." };

    await prisma.teamOfWeekPlayer.deleteMany({ where: { tournamentId } });

    await auditLog({
      actorId: user.id,
      action: "CLEAR_TEAM_OF_WEEK",
      metadata: { tournamentId },
    });

    revalidatePath("/");
    revalidatePath("/admin/team-of-week");

    return { ok: true };
  } catch (error) {
    console.error("[clearTeamOfWeekPlayers]", error);
    return { ok: false, error: "تعذّر إزالة فريق الأسبوع." };
  }
}