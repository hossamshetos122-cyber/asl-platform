"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser, canManageTeam } from "@/lib/auth";
import {
  createMatchSchema,
  updateScoreSchema,
  updateMatchScheduleSchema,
  addMatchEventSchema,
  setTeamSquadSchema,
  setTeamLineupSchema,
  confirmSquadSchema,
  cuid,
} from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";

/**
 * In-app notifications after a FINISHED result is saved: the owners/managers
 * of both teams and all players on a confirmed squad of either side.
 */
async function notifyMatchResult(matchId: string): Promise<void> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        homeScore: true,
        awayScore: true,
        homeTeam: {
          select: {
            name: true,
            ownerId: true,
            managers: { select: { id: true } },
          },
        },
        awayTeam: {
          select: {
            name: true,
            ownerId: true,
            managers: { select: { id: true } },
          },
        },
        tournament: { select: { name: true } },
        squads: {
          select: {
            status: true,
            players: { select: { player: { select: { userId: true } } } },
          },
        },
      },
    });
    if (!match) return;

    const userIds = new Set<string>();
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (team.ownerId) userIds.add(team.ownerId);
      for (const manager of team.managers) userIds.add(manager.id);
    }
    for (const squad of match.squads) {
      if (squad.status === "CONFIRMED") {
        for (const entry of squad.players) {
          if (entry.player.userId) userIds.add(entry.player.userId);
        }
      }
    }

    const title = "تم تسجيل نتيجة المباراة";
    const body = `${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name} (${match.tournament.name})`;

    for (const userId of userIds) {
      await notifyUser(userId, title, body);
    }
  } catch (error) {
    console.error("[notifyMatchResult] failed:", error);
  }
}

export async function createMatch(formData: FormData) {
  const user = await requireAdmin();

  const parsed = createMatchSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    homeTeamId: formData.get("homeTeamId"),
    awayTeamId: formData.get("awayTeamId"),
    refereeId: formData.get("refereeId") || undefined,
    kickoffAt: formData.get("kickoffAt"),
    venue: formData.get("venue") || undefined,
    venueImageUrl: formData.get("venueImageUrl") || undefined,
    round: formData.get("round") || undefined,
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "بيانات غير صالحة");
  }

  const { tournamentId, homeTeamId, awayTeamId, kickoffAt, venue, venueImageUrl, round, status, refereeId } = parsed.data;

  // Verify tournament exists
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true } });
  if (!tournament) throw new Error("البطولة غير موجودة");

  // Verify both teams exist
  const [homeTeam, awayTeam] = await Promise.all([
    prisma.team.findUnique({ where: { id: homeTeamId }, select: { id: true } }),
    prisma.team.findUnique({ where: { id: awayTeamId }, select: { id: true } }),
  ]);
  if (!homeTeam) throw new Error("الفريق المضيف غير موجود");
  if (!awayTeam) throw new Error("الفريق الضيف غير موجود");

  // Verify both teams participate in the tournament
  const [homeEntry, awayEntry] = await Promise.all([
    prisma.tournamentTeam.findUnique({
      where: { tournamentId_teamId: { tournamentId, teamId: homeTeamId } },
      select: { id: true },
    }),
    prisma.tournamentTeam.findUnique({
      where: { tournamentId_teamId: { tournamentId, teamId: awayTeamId } },
      select: { id: true },
    }),
  ]);

  if (!homeEntry) throw new Error("الفريق المضيف غير مسجّل في هذه البطولة");
  if (!awayEntry) throw new Error("الفريق الضيف غير مسجّل في هذه البطولة");

  // Verify the assigned referee exists when provided.
  if (refereeId) {
    const referee = await prisma.referee.findUnique({ where: { id: refereeId }, select: { id: true } });
    if (!referee) throw new Error("الحكم غير موجود");
  }

  const match = await prisma.match.create({
    data: {
      tournamentId,
      homeTeamId,
      awayTeamId,
      refereeId: refereeId ?? null,
      kickoffAt: new Date(kickoffAt),
      venue,
      venueImageUrl: venueImageUrl ?? null,
      round,
      status,
    },
  });

  await auditLog({
    actorId: user.id,
    action: "CREATE_MATCH",
    targetId: match.id,
    metadata: { tournamentId, homeTeamId, awayTeamId, refereeId: refereeId ?? null },
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
  const user = await requireAdmin();

  const parsed = updateScoreSchema.safeParse({
    matchId: id,
    homeScore,
    awayScore,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "بيانات غير صالحة");
  }

  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
    select: { id: true, status: true },
  });
  if (!match) throw new Error("المباراة غير موجودة");

  if (match.status === "CANCELLED") {
    throw new Error("لا يمكن تحديث نتيجة مباراة ملغاة");
  }

  await prisma.match.update({
    where: { id: parsed.data.matchId },
    data: {
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
    },
  });

  await auditLog({
    actorId: user.id,
    action: "UPDATE_SCORE",
    targetId: parsed.data.matchId,
    metadata: { homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore },
  });

  revalidatePath("/matches");
  revalidatePath(`/matches/${parsed.data.matchId}`);
  revalidatePath("/standings");
  revalidatePath("/top-scorers");
  revalidatePath("/");
}

export async function setMatchResult(id: string, homeScore: number, awayScore: number) {
  const user = await requireAdmin();

  const parsed = updateScoreSchema.safeParse({
    matchId: id,
    homeScore,
    awayScore,
    status: "FINISHED",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "بيانات غير صالحة");
  }

  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
    select: { id: true, status: true },
  });
  if (!match) throw new Error("المباراة غير موجودة");

  if (match.status === "CANCELLED") {
    throw new Error("لا يمكن إنهاء مباراة ملغاة");
  }

  await prisma.match.update({
    where: { id: parsed.data.matchId },
    data: {
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      status: "FINISHED",
    },
  });

  await auditLog({
    actorId: user.id,
    action: "SET_MATCH_RESULT",
    targetId: parsed.data.matchId,
    metadata: { homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore },
  });

  await notifyMatchResult(parsed.data.matchId);

  revalidatePath("/matches");
  revalidatePath(`/matches/${parsed.data.matchId}`);
  revalidatePath("/standings");
  revalidatePath("/top-scorers");
  revalidatePath("/admin");
  revalidatePath("/admin/matches");
  revalidatePath("/");
}

const SCHEDULE_STATUSES = ["SCHEDULED", "POSTPONED", "CANCELLED"] as const;

const GOAL_TYPE = "GOAL";
const ASSIST_TYPE = "ASSIST";
const YELLOW_CARD_TYPE = "YELLOW_CARD";
const RED_CARD_TYPE = "RED_CARD";

const playerIdToken = /^[a-zA-Z0-9_-]{2,50}$/;

/**
 * Records a FINISHED result together with the goal scorers and any cards.
 * Old GOAL / ASSIST / YELLOW_CARD / RED_CARD events for the match are wiped
 * and recreated from the selections, so re-saving with an edited score stays
 * consistent. Card arrays are optional and default to empty.
 *
 * Each goal can carry its own minute plus an own-goal / penalty flag. Own
 * goals are stored as OWN_GOAL (they do not count toward a scorer's tally);
 * penalties are stored as PENALTY_SCORED (they do count, at the given minute).
 */
export async function setMatchResultWithGoals(
  id: string,
  homeScore: number,
  awayScore: number,
  homeGoalPlayerIds: string[],
  awayGoalPlayerIds: string[],
  homeGoalMinutes: number[] = [],
  awayGoalMinutes: number[] = [],
  homeOwnGoalFlags: boolean[] = [],
  awayOwnGoalFlags: boolean[] = [],
  homePenaltyFlags: boolean[] = [],
  awayPenaltyFlags: boolean[] = [],
  homeYellowPlayerIds: string[] = [],
  awayYellowPlayerIds: string[] = [],
  homeRedPlayerIds: string[] = [],
  awayRedPlayerIds: string[] = [],
  homeAssistPlayerIds: string[] = [],
  awayAssistPlayerIds: string[] = [],
) {
  const user = await requireAdmin();

  const parsed = updateScoreSchema.safeParse({
    matchId: id,
    homeScore,
    awayScore,
    status: "FINISHED",
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "بيانات غير صالحة");
  }

  const matchId = parsed.data.matchId;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, status: true, homeTeamId: true, awayTeamId: true },
  });
  if (!match) throw new Error("المباراة غير موجودة");
  if (match.status === "CANCELLED") throw new Error("لا يمكن إنهاء مباراة ملغاة");

  const homeGoalIds = Array.isArray(homeGoalPlayerIds) ? homeGoalPlayerIds : [];
  const awayGoalIds = Array.isArray(awayGoalPlayerIds) ? awayGoalPlayerIds : [];
  const homeYellowIds = Array.isArray(homeYellowPlayerIds) ? homeYellowPlayerIds : [];
  const awayYellowIds = Array.isArray(awayYellowPlayerIds) ? awayYellowPlayerIds : [];
  const homeRedIds = Array.isArray(homeRedPlayerIds) ? homeRedPlayerIds : [];
  const awayRedIds = Array.isArray(awayRedPlayerIds) ? awayRedPlayerIds : [];
  const homeAssistIds = Array.isArray(homeAssistPlayerIds) ? homeAssistPlayerIds.filter((s) => s !== "") : [];
  const awayAssistIds = Array.isArray(awayAssistPlayerIds) ? awayAssistPlayerIds.filter((s) => s !== "") : [];

  const homeGoalMins = Array.isArray(homeGoalMinutes) ? homeGoalMinutes : [];
  const awayGoalMins = Array.isArray(awayGoalMinutes) ? awayGoalMinutes : [];
  const homeOwn = Array.isArray(homeOwnGoalFlags) ? homeOwnGoalFlags : [];
  const awayOwn = Array.isArray(awayOwnGoalFlags) ? awayOwnGoalFlags : [];
  const homePens = Array.isArray(homePenaltyFlags) ? homePenaltyFlags : [];
  const awayPens = Array.isArray(awayPenaltyFlags) ? awayPenaltyFlags : [];

  const clampMinute = (m: number): number => {
    if (typeof m !== "number" || Number.isNaN(m)) return 0;
    return Math.min(120, Math.max(0, Math.round(m)));
  };

  const goalEvent = (playerId: string, teamId: string, idx: number, own: boolean[], pens: boolean[], mins: number[]) => ({
    matchId,
    playerId,
    teamId,
    type: own[idx] ? "OWN_GOAL" : pens[idx] ? "PENALTY_SCORED" : "GOAL",
    minute: clampMinute(mins[idx] ?? 0),
  });

  // A card that has no player selected (placeholder "اختر اللاعب") must block the
  // save instead of being silently dropped or reaching the DB with a bad id.
  const missingCardPlayer =
    (Array.isArray(homeYellowPlayerIds) && homeYellowPlayerIds.some((s) => !s)) ||
    (Array.isArray(awayYellowPlayerIds) && awayYellowPlayerIds.some((s) => !s)) ||
    (Array.isArray(homeRedPlayerIds) && homeRedPlayerIds.some((s) => !s)) ||
    (Array.isArray(awayRedPlayerIds) && awayRedPlayerIds.some((s) => !s));
  if (missingCardPlayer) {
    throw new Error("حدّد لاعباً لكل كارت (أصفر/أحمر) قبل الحفظ، أو احذف الكارت الفارغ");
  }

  if (homeGoalIds.length !== parsed.data.homeScore) {
    throw new Error(`حدّد لاعباً لكل هدف من أهداف الفريق المضيف (${parsed.data.homeScore} أهداف) أو اضغط «حفظ النتيجة فقط»`);
  }
  if (awayGoalIds.length !== parsed.data.awayScore) {
    throw new Error("حدّد لاعباً لكل هدف من أهداف الفريق الضيف أو اضغط «حفظ النتيجة فقط»");
  }

  const allIds = [
    ...homeGoalIds,
    ...awayGoalIds,
    ...homeYellowIds,
    ...awayYellowIds,
    ...homeRedIds,
    ...awayRedIds,
    ...homeAssistIds,
    ...awayAssistIds,
  ];
  if (allIds.some((pid) => typeof pid !== "string" || !playerIdToken.test(pid))) {
    throw new Error("اختيار اللاعب غير صالح");
  }

  if (allIds.length > 0) {
    const players = await prisma.player.findMany({
      where: { id: { in: allIds } },
      select: { id: true },
    });
    if (players.length !== allIds.length) throw new Error("أحد اللاعبين غير موجود");

    const memberships = await prisma.teamMembership.findMany({
      where: { playerId: { in: allIds }, status: "ACTIVE" },
      select: { playerId: true, teamId: true },
    });
    const membershipByPlayer = new Map(memberships.map((m) => [m.playerId, m.teamId]));
    const assertOfTeam = (pid: string, teamId: string, teamLabel: string) => {
      if (membershipByPlayer.get(pid) !== teamId) {
        throw new Error(`أحد اللاعبين المختارين ليس من ${teamLabel}`);
      }
    };
    for (const pid of [...homeGoalIds, ...homeYellowIds, ...homeRedIds, ...homeAssistIds]) {
      assertOfTeam(pid, match.homeTeamId, "الفريق المضيف");
    }
    for (const pid of [...awayGoalIds, ...awayYellowIds, ...awayRedIds, ...awayAssistIds]) {
      assertOfTeam(pid, match.awayTeamId, "الفريق الضيف");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        homeScore: parsed.data.homeScore,
        awayScore: parsed.data.awayScore,
        status: "FINISHED",
      },
    });

    await tx.matchEvent.deleteMany({
      where: {
        matchId,
        type: { in: [GOAL_TYPE, ASSIST_TYPE, YELLOW_CARD_TYPE, RED_CARD_TYPE, "OWN_GOAL", "PENALTY_SCORED"] },
      },
    });

    const events: {
      matchId: string;
      playerId: string;
      teamId: string;
      type: string;
      minute: number;
    }[] = [
      ...homeGoalIds.map((playerId, i) => goalEvent(playerId, match.homeTeamId, i, homeOwn, homePens, homeGoalMins)),
      ...awayGoalIds.map((playerId, i) => goalEvent(playerId, match.awayTeamId, i, awayOwn, awayPens, awayGoalMins)),
      ...homeAssistIds.map((playerId) => ({
        matchId, playerId, teamId: match.homeTeamId, type: ASSIST_TYPE, minute: 0,
      })),
      ...awayAssistIds.map((playerId) => ({
        matchId, playerId, teamId: match.awayTeamId, type: ASSIST_TYPE, minute: 0,
      })),
      ...homeYellowIds.map((playerId) => ({
        matchId, playerId, teamId: match.homeTeamId, type: YELLOW_CARD_TYPE, minute: 0,
      })),
      ...awayYellowIds.map((playerId) => ({
        matchId, playerId, teamId: match.awayTeamId, type: YELLOW_CARD_TYPE, minute: 0,
      })),
      ...homeRedIds.map((playerId) => ({
        matchId, playerId, teamId: match.homeTeamId, type: RED_CARD_TYPE, minute: 0,
      })),
      ...awayRedIds.map((playerId) => ({
        matchId, playerId, teamId: match.awayTeamId, type: RED_CARD_TYPE, minute: 0,
      })),
    ];

    if (events.length > 0) {
      await tx.matchEvent.createMany({ data: events });
    }
  });

  await auditLog({
    actorId: user.id,
    action: "SET_MATCH_RESULT",
    targetId: matchId,
    metadata: {
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      homeGoalPlayerIds,
      awayGoalPlayerIds,
      homeAssistPlayerIds,
      awayAssistPlayerIds,
      homeYellowPlayerIds,
      awayYellowPlayerIds,
      homeRedPlayerIds,
      awayRedPlayerIds,
    },
  });

  await notifyMatchResult(matchId);

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/standings");
  revalidatePath("/top-scorers");
  revalidatePath("/admin");
  revalidatePath("/admin/matches");
  revalidatePath("/admin/suspensions");
  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath("/teams");
}

export async function updateMatchSchedule(
  id: string,
  kickoffAt: string,
  venue?: string | null,
  status?: string,
  venueImageUrl?: string | null,
) {
  const user = await requireAdmin();

  const parsed = updateMatchScheduleSchema.safeParse({
    matchId: id,
    kickoffAt,
    venue: venue || undefined,
    status: status || undefined,
    venueImageUrl: venueImageUrl || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "بيانات غير صالحة");
  }

  if (parsed.data.status && !SCHEDULE_STATUSES.includes(parsed.data.status as (typeof SCHEDULE_STATUSES)[number])) {
    throw new Error("حالة المباراة غير صالحة لهذه العملية");
  }

  const kickoffDate = new Date(parsed.data.kickoffAt);
  if (isNaN(kickoffDate.getTime())) throw new Error("موعد المباراة غير صالح");

  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
    select: { id: true, tournamentId: true },
  });
  if (!match) throw new Error("المباراة غير موجودة");

  await prisma.match.update({
    where: { id: parsed.data.matchId },
    data: {
      kickoffAt: kickoffDate,
      venue: parsed.data.venue,
      ...(parsed.data.venueImageUrl !== undefined ? { venueImageUrl: parsed.data.venueImageUrl || null } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    },
  });

  await auditLog({
    actorId: user.id,
    action: "UPDATE_MATCH_SCHEDULE",
    targetId: parsed.data.matchId,
    metadata: { kickoffAt, venue: parsed.data.venue, status: parsed.data.status },
  });

  revalidatePath("/matches");
  revalidatePath(`/matches/${parsed.data.matchId}`);
  revalidatePath("/admin/matches");
  revalidatePath("/");
  if (match) {
    revalidatePath(`/tournaments/${match.tournamentId}`);
  }
}

export async function addMatchEvent(matchId: string, formData: FormData) {
  const user = await requireAdmin();

  const matchIdParsed = cuid.safeParse(matchId);
  if (!matchIdParsed.success) throw new Error("معرف المباراة غير صالح");

  const rawType = String(formData.get("type") || "");
  const rawMinute = String(formData.get("minute") || "0");

  // Pre-validate minute as number before passing to schema
  const minuteNum = parseInt(rawMinute, 10);
  if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 120) {
    throw new Error("الدقيقة يجب أن تكون بين 0 و 120");
  }

  const parsed = addMatchEventSchema.safeParse({
    matchId,
    playerId: formData.get("playerId"),
    teamId: formData.get("teamId"),
    type: rawType,
    minute: minuteNum,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "بيانات غير صالحة");
  }

  const { playerId, teamId, type, minute } = parsed.data;

  // Verify match exists
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, homeTeamId: true, awayTeamId: true, status: true },
  });
  if (!match) throw new Error("المباراة غير موجودة");

  if (match.status === "CANCELLED") {
    throw new Error("لا يمكن إضافة أحداث لمباراة ملغاة");
  }

  // Verify team belongs to this match
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("الفريق غير مشارك في هذه المباراة");
  }

  // Verify player exists
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true },
  });
  if (!player) throw new Error("اللاعب غير موجود");

  // Verify player belongs to the specified team via active membership
  const membership = await prisma.teamMembership.findUnique({
    where: { teamId_playerId: { teamId, playerId } },
    select: { status: true },
  });
  if (!membership || membership.status !== "ACTIVE") {
    throw new Error("اللاعب غير مسجّل في هذا الفريق");
  }

  await prisma.matchEvent.create({
    data: {
      matchId,
      playerId,
      teamId,
      type,
      minute,
    },
  });

  await auditLog({
    actorId: user.id,
    action: "ADD_MATCH_EVENT",
    targetId: matchId,
    metadata: { playerId, teamId, type, minute },
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/top-scorers");
  revalidatePath("/");
}

export async function deleteMatch(id: string) {
  const user = await requireAdmin();

  const idParsed = cuid.safeParse(id);
  if (!idParsed.success) throw new Error("معرف المباراة غير صالح");

  const match = await prisma.match.findUnique({
    where: { id },
    select: { tournamentId: true },
  });

  if (!match) throw new Error("المباراة غير موجودة");

  await prisma.match.delete({ where: { id } });

  await auditLog({
    actorId: user.id,
    action: "DELETE_MATCH",
    targetId: id,
  });

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

export type SetTeamSquadResult = { ok: boolean; error?: string; squadId?: string };

export async function setTeamSquad(
  matchId: string,
  teamId: string,
  playerIds: string[]
): Promise<SetTeamSquadResult> {
  const user = await requireAdmin();

  const parsed = setTeamSquadSchema.safeParse({ matchId, teamId, playerIds });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  // Verify match exists
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, homeTeamId: true, awayTeamId: true },
  });
  if (!match) return { ok: false, error: "المباراة غير موجودة." };

  // Verify team belongs to this match
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    return { ok: false, error: "الفريق غير مشارك في هذه المباراة." };
  }

  // Verify all players exist and belong to this team
  const allPlayers = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { id: true },
  });
  if (allPlayers.length !== playerIds.length) {
    return { ok: false, error: "أحد اللاعبين المختارين غير موجود." };
  }

  // Check each player has an active membership with this team
  const memberships = await prisma.teamMembership.findMany({
    where: {
      teamId,
      playerId: { in: playerIds },
      status: "ACTIVE",
    },
    select: { playerId: true },
  });
  const validPlayerIds = new Set(memberships.map((m) => m.playerId));
  const invalidPlayers = playerIds.filter((pid) => !validPlayerIds.has(pid));
  if (invalidPlayers.length > 0) {
    return { ok: false, error: "بعض اللاعبين غير مسجّلين في هذا الفريق." };
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

  // Fetch the squad ID after transaction (upsert guarantees it exists)
  const squadRecord = await prisma.matchSquad.findUnique({
    where: { matchId_teamId: { matchId, teamId } },
    select: { id: true },
  });

  await auditLog({
    actorId: user.id,
    action: "SET_TEAM_SQUAD",
    targetId: matchId,
    metadata: { teamId, playerCount: playerIds.length },
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath(`/admin/matches`);
  revalidatePath(`/admin/matches/${matchId}/squads`);
  return { ok: true, squadId: squadRecord?.id };
}

export async function setTeamLineup(
  squadId: string,
  starterIds: string[]
): Promise<SetTeamSquadResult> {
  const user = await requireAdmin();

  const parsed = setTeamLineupSchema.safeParse({ squadId, starterIds });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
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

  await auditLog({
    actorId: user.id,
    action: "SET_TEAM_LINEUP",
    targetId: squadId,
    metadata: { matchId: squad.matchId, starterCount: starterIds.length },
  });

  revalidatePath(`/matches/${squad.matchId}`);
  revalidatePath(`/admin/matches/${squad.matchId}/squads`);
  return { ok: true };
}

export async function confirmTeamSquad(
  squadId: string,
  status: "CONFIRMED" | "PENDING" | "ABSENT"
): Promise<SetTeamSquadResult> {
  const user = await requireUser();

  const parsed = confirmSquadSchema.safeParse({ squadId, status });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const squad = await prisma.matchSquad.findUnique({
    where: { id: squadId },
    select: { id: true, matchId: true, teamId: true },
  });
  if (!squad) return { ok: false, error: "قائمة المباراة غير موجودة." };

  // Admins may confirm any squad; team managers only their own team's.
  const isOwnTeam = await canManageTeam(user, squad.teamId);
  if (!isOwnTeam) return { ok: false, error: "ليس لديك صلاحية لتأكيد هذه القائمة." };

  await prisma.matchSquad.update({
    where: { id: squadId },
    data: { status: parsed.data.status },
  });

  await auditLog({
    actorId: user.id,
    action: "CONFIRM_SQUAD",
    targetId: squadId,
    metadata: { matchId: squad.matchId, status: parsed.data.status },
  });

  revalidatePath(`/matches/${squad.matchId}`);
  revalidatePath(`/admin/matches/${squad.matchId}/squads`);
  revalidatePath("/manage");
  return { ok: true };
}
