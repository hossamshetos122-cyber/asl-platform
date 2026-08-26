"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function createMatch(formData: FormData) {
  await requireAdmin();

  const tournamentId = String(formData.get("tournamentId") || "");
  const homeTeamId = String(formData.get("homeTeamId") || "");
  const awayTeamId = String(formData.get("awayTeamId") || "");
  const kickoffAtStr = String(formData.get("kickoffAt") || "");
  const venue = String(formData.get("venue") || "").trim() || null;
  const round = String(formData.get("round") || "").trim() || null;
  const status = String(formData.get("status") || "SCHEDULED");

  if (!tournamentId || !homeTeamId || !awayTeamId || !kickoffAtStr) {
    throw new Error("جميع الحقول المطلوبة يجب ملؤها");
  }

  if (homeTeamId === awayTeamId) {
    throw new Error("يجب أن تكون الفريقان مختلفين");
  }

  await prisma.match.create({
    data: {
      tournamentId,
      homeTeamId,
      awayTeamId,
      kickoffAt: new Date(kickoffAtStr),
      venue,
      round,
      status,
    },
  });

  revalidatePath("/matches");
  revalidatePath("/admin/matches");
  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function updateScore(
  id: string,
  homeScore: number,
  awayScore: number,
) {
  await requireAdmin();

  await prisma.match.update({
    where: { id },
    data: { homeScore, awayScore, status: "FINISHED" },
  });

  revalidatePath("/matches");
  revalidatePath(`/matches/${id}`);
  revalidatePath("/standings");
  revalidatePath("/top-scorers");
  revalidatePath("/");
}

export async function addMatchEvent(matchId: string, formData: FormData) {
  await requireAdmin();

  const playerId = String(formData.get("playerId") || "");
  const teamId = String(formData.get("teamId") || "");
  const type = String(formData.get("type") || "");
  const minuteStr = String(formData.get("minute") || "0");

  if (!playerId || !teamId || !type) {
    throw new Error("جميع الحقول مطلوبة");
  }

  await prisma.matchEvent.create({
    data: {
      matchId,
      playerId,
      teamId,
      type,
      minute: parseInt(minuteStr, 10) || 0,
    },
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/top-scorers");
  revalidatePath("/");
}

export async function deleteMatch(id: string) {
  await requireAdmin();

  const match = await prisma.match.findUnique({
    where: { id },
    select: { tournamentId: true },
  });

  await prisma.match.delete({ where: { id } });

  revalidatePath("/matches");
  revalidatePath("/admin/matches");
  revalidatePath("/standings");
  revalidatePath("/top-scorers");
  revalidatePath("/");
  if (match) {
    revalidatePath(`/tournaments/${match.tournamentId}`);
  }
}

// ---------------------------------------------------------------------------
// Match squad management
// ---------------------------------------------------------------------------

export type SetTeamSquadResult = { ok: boolean; error?: string };

export async function setTeamSquad(
  matchId: string,
  teamId: string,
  playerIds: string[]
): Promise<SetTeamSquadResult> {
  await requireAdmin();

  if (playerIds.length > 20) {
    return { ok: false, error: "لا يمكن أن يتجاوز عدد لاعبي المباراة 20 لاعبًا." };
  }

  if (playerIds.length === 0) {
    return { ok: false, error: "يجب اختيار لاعب واحد على الأقل." };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { id: true } });
  if (!match) return { ok: false, error: "المباراة غير موجودة." };

  const allPlayers = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { id: true },
  });
  if (allPlayers.length !== playerIds.length) {
    return { ok: false, error: "أحد اللاعبين المختارين غير موجود." };
  }

  await prisma.$transaction(async (tx) => {
    const squad = await tx.matchSquad.upsert({
      where: { matchId_teamId: { matchId, teamId } },
      create: { matchId, teamId, status: "PENDING" },
      update: {},
    });

    const existingEntries = await tx.matchSquadPlayer.findMany({
      where: { squadId: squad.id },
      select: { playerId: true, isStarter: true },
    });
    const existingMap = new Map(existingEntries.map((e) => [e.playerId, e.isStarter]));

    const toRemove = existingEntries.filter((e) => !playerIds.includes(e.playerId));
    if (toRemove.length > 0) {
      await tx.matchSquadPlayer.deleteMany({
        where: { squadId: squad.id, playerId: { in: toRemove.map((e) => e.playerId) } },
      });
    }

    const toAdd = playerIds.filter((pid) => !existingMap.has(pid));
    if (toAdd.length > 0) {
      await tx.matchSquadPlayer.createMany({
        data: toAdd.map((pid, idx) => ({
          squadId: squad.id,
          playerId: pid,
          isStarter: false,
          sortOrder: idx,
        })),
      });
    }

    const allSquadPlayers = await tx.matchSquadPlayer.findMany({
      where: { squadId: squad.id },
      select: { playerId: true },
    });
    const squadPlayerIds = new Set(allSquadPlayers.map((sp) => sp.playerId));
    const orphans = [...squadPlayerIds].filter((pid) => !playerIds.includes(pid));
    if (orphans.length > 0) {
      await tx.matchSquadPlayer.deleteMany({
        where: { squadId: squad.id, playerId: { in: orphans } },
      });
    }
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath(`/admin/matches`);
  revalidatePath(`/admin/matches/${matchId}/squads`);
  return { ok: true };
}

export async function setTeamLineup(
  squadId: string,
  starterIds: string[]
): Promise<SetTeamSquadResult> {
  await requireAdmin();

  if (starterIds.length > 11) {
    return { ok: false, error: "لا يمكن أن يتجاوز عدد لاعبي الأساس 11 لاعبًا." };
  }

  const squad = await prisma.matchSquad.findUnique({
    where: { id: squadId },
    select: { id: true, matchId: true },
  });
  if (!squad) return { ok: false, error: "قائمة المباراة غير موجودة." };

  const squadPlayers = await prisma.matchSquadPlayer.findMany({
    where: { squadId },
    select: { playerId: true },
  });
  const validIds = new Set(squadPlayers.map((sp) => sp.playerId));
  const invalid = starterIds.filter((sid) => !validIds.has(sid));
  if (invalid.length > 0) {
    return { ok: false, error: "أحد لاعبي الأساس غير موجود في قائمة المباراة." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.matchSquadPlayer.updateMany({
      where: { squadId },
      data: { isStarter: false },
    });

    if (starterIds.length > 0) {
      await tx.matchSquadPlayer.updateMany({
        where: { squadId, playerId: { in: starterIds } },
        data: { isStarter: true },
      });
    }

    const allSquadPlayers = await tx.matchSquadPlayer.findMany({
      where: { squadId },
      orderBy: { sortOrder: "asc" },
    });
    let sortIdx = 0;
    for (const sp of allSquadPlayers) {
      if (!starterIds.includes(sp.playerId)) {
        await tx.matchSquadPlayer.update({
          where: { id: sp.id },
          data: { sortOrder: sortIdx++ },
        });
      }
    }
  });

  revalidatePath(`/matches/${squad.matchId}`);
  revalidatePath(`/admin/matches/${squad.matchId}/squads`);
  return { ok: true };
}

export async function confirmTeamSquad(
  squadId: string,
  status: "CONFIRMED" | "PENDING" | "ABSENT"
): Promise<SetTeamSquadResult> {
  await requireAdmin();

  const squad = await prisma.matchSquad.findUnique({
    where: { id: squadId },
    select: { id: true, matchId: true },
  });
  if (!squad) return { ok: false, error: "قائمة المباراة غير موجودة." };

  await prisma.matchSquad.update({
    where: { id: squadId },
    data: { status },
  });

  revalidatePath(`/matches/${squad.matchId}`);
  revalidatePath(`/admin/matches/${squad.matchId}/squads`);
  return { ok: true };
}
