"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, getCurrentUser, createVerificationToken, canManageTeam } from "@/lib/auth";
import { getTeamSquadSize } from "@/lib/data/teams";
import { sendMail } from "@/lib/mail";
import { auditLog } from "@/lib/audit";
import { notifyUser, notifyTeamContacts } from "@/lib/notify";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSiteConfig } from "@/lib/data/site-config";
import {
  createPlayerSchema,
  updatePlayerSchema,
  claimPlayerSchema,
  cuid,
} from "@/lib/validation";

const SQUAD_LIMIT = 20;

const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";

const FAKE_EMAIL_SUFFIX = "@asl-platform.local";

function isFakePlayerEmail(email: string): boolean {
  return email.toLowerCase().endsWith(FAKE_EMAIL_SUFFIX);
}

/**
 * Emails the player a one-time password setup link (a standard PASSWORD_RESET
 * token), so newly created players can log in without knowing a password.
 * Returns { delivered, resetLink } so callers can surface the link in the UI
 * when no mail transport is configured.
 */
async function sendPlayerSetupMail(
  userId: string,
  email: string,
  fullName: string,
): Promise<{ delivered: boolean; resetLink: string }> {
  try {
    await prisma.verificationToken.deleteMany({
      where: { userId, type: "PASSWORD_RESET", usedAt: null },
    });
    const token = await createVerificationToken(userId, "PASSWORD_RESET");
    const resetLink = `${APP_ORIGIN}/reset-password?token=${token}`;
    const leagueName = (await getSiteConfig()).leagueName;

    const mail = await sendMail({
      to: email,
      subject: `تفعيل حسابك — ${leagueName}`,
      text: `مرحباً ${fullName}،\n\nتم إنشاء ملفك كلاعب في منصة ${leagueName}.\n\nافتح الرابط التالي لتحديد كلمة مرور لحسابك (صالح لمدة ساعة واحدة):\n${resetLink}`,
      html: `<div dir="rtl" style="font-family:system-ui,sans-serif;line-height:1.7"><h2>تفعيل حساب اللاعب</h2><p>مرحباً ${fullName}،</p><p>تم إنشاء ملفك كلاعب في ${leagueName}. حدّد كلمة مرور لحسابك بالضغط على الزر التالي (صالح لمدة ساعة واحدة):</p><p><a href="${resetLink}" style="background:#1d6ff2;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">تحديد كلمة المرور</a></p></div>`,
    });
    return { delivered: mail.delivered, resetLink };
  } catch (error) {
    console.error("[sendPlayerSetupMail] failed:", error);
    return { delivered: false, resetLink: "" };
  }
}

async function requireTeamAccess(teamId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  if (user.role === "ADMIN") return user;

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
  if (!team) throw new Error("الفريق غير موجود");
  if (team.ownerId !== user.id) throw new Error("غير مصرح لك بإدارة لاعبي هذا الفريق");

  return user;
}

/**
 * Team owners and linked team managers may manage roster membership requests.
 */
async function requireTeamManageAccess(teamId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  if (user.role === "ADMIN") return user;
  if (user.role === "TEAM_MANAGER" && (await canManageTeam(user, teamId))) return user;

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
  if (team?.ownerId === user.id) return user;

  throw new Error("غير مصرح لك بتنفيذ هذا الإجراء");
}

async function requirePlayerAccess(playerId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  if (user.role === "ADMIN") return user;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { team: { select: { ownerId: true } } },
        take: 1,
      },
    },
  });

  if (!player) throw new Error("اللاعب غير موجود");

  const isOwnedByUser = player.memberships.some((m) => m.team.ownerId === user.id);
  if (!isOwnedByUser) throw new Error("غير مصرح لك بتعديل هذا اللاعب");

  return user;
}

type PlayerActionResult = { success: boolean; error?: string; info?: string; setupLink?: string };

export async function createPlayer(
  _prev: PlayerActionResult,
  formData: FormData,
): Promise<PlayerActionResult>;

export async function createPlayer(
  formData: FormData,
): Promise<PlayerActionResult>;

export async function createPlayer(
  prevOrFormData: PlayerActionResult | FormData,
  maybeFormData?: FormData,
): Promise<PlayerActionResult> {
  const formData = prevOrFormData instanceof FormData ? prevOrFormData : maybeFormData!;
  if (!formData) return { success: false, error: "بيانات غير صالحة" };

  const parsed = createPlayerSchema.safeParse({
    teamId: formData.get("teamId"),
    fullName: formData.get("fullName"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    photoUrl: formData.get("photoUrl") || undefined,
    jerseyNumber: formData.get("jerseyNumber") || undefined,
    position: formData.get("position") || undefined,
    dateOfBirth: formData.get("dateOfBirth") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const { teamId, fullName, email, phone, photoUrl, jerseyNumber, position, dateOfBirth } = parsed.data;
  const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

  const dateOfBirthDate = dateOfBirth ? new Date(dateOfBirth + "T00:00:00.000Z") : null;

  const user = await requireTeamAccess(teamId);

  const squadSize = await getTeamSquadSize(teamId);
  if (squadSize >= SQUAD_LIMIT) {
    return { success: false, error: `الحد الأقصى للاعبين في الفريق هو ${SQUAD_LIMIT} لاعب` };
  }

  if (normalizedEmail) {
    const conflict = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (conflict) {
      return { success: false, error: "البريد الإلكتروني مستخدم من حساب آخر" };
    }
  }

  const fakeEmail = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@asl-platform.local`;
  const password = Math.random().toString(36).slice(2, 10);
  const passwordHash = await hashPassword(password);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail ?? fakeEmail,
          passwordHash,
          fullName,
          phone,
          role: "PLAYER",
        },
      });

      const player = await tx.player.create({
        data: {
          userId: createdUser.id,
          photoUrl: photoUrl ?? null,
          jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : null,
          position,
          dateOfBirth: dateOfBirthDate,
        },
      });

      await tx.teamMembership.create({
        data: { teamId, playerId: player.id, status: "ACTIVE" },
      });

      return { player, userId: createdUser.id };
    });

    await auditLog({
      actorId: user.id,
      action: "CREATE_PLAYER",
      targetId: result.player.id,
      metadata: { fullName, teamId, email: normalizedEmail ?? null },
    });

    if (normalizedEmail) {
      const setup = await sendPlayerSetupMail(result.userId, normalizedEmail, fullName);
      if (setup.delivered) {
        return {
          success: true,
          info: "تم إرسال رابط تفعيل لإيميل اللاعب لتحديد كلمة المرور",
        };
      }
    }

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/teams");
    revalidatePath("/admin/players");
    revalidatePath("/players");

    return { success: true };
  } catch (error) {
    console.error("[createPlayer]", error);
    return { success: false, error: "تعذّر إضافة اللاعب" };
  }
}

export async function updatePlayer(
  _prev: PlayerActionResult,
  formData: FormData,
): Promise<PlayerActionResult>;

export async function updatePlayer(
  id: string,
  formData: FormData,
): Promise<PlayerActionResult>;

export async function updatePlayer(
  prevOrId: PlayerActionResult | string,
  formData: FormData,
): Promise<PlayerActionResult> {
  const id = typeof prevOrId === "string" ? prevOrId : String(formData.get("playerId") || "");
  if (!id) return { success: false, error: "معرف اللاعب مطلوب" };

  const idParsed = cuid.safeParse(id);
  if (!idParsed.success) return { success: false, error: "معرف اللاعب غير صالح" };

  const user = await requirePlayerAccess(id);

  const parsed = updatePlayerSchema.safeParse({
    id,
    fullName: formData.get("fullName"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    photoUrl: formData.get("photoUrl") || undefined,
    jerseyNumber: formData.get("jerseyNumber") || undefined,
    position: formData.get("position") || undefined,
    dateOfBirth: formData.get("dateOfBirth") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const { fullName, email, phone, photoUrl, jerseyNumber, position, dateOfBirth } = parsed.data;
  const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

  const player = await prisma.player.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!player) return { success: false, error: "اللاعب غير موجود" };

  if (normalizedEmail && normalizedEmail !== player.user.email.toLowerCase()) {
    const conflict = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (conflict) {
      return { success: false, error: "البريد الإلكتروني مستخدم من حساب آخر" };
    }
  }

  const emailChanged = normalizedEmail && normalizedEmail !== player.user.email.toLowerCase();
  const oldEmailFake = isFakePlayerEmail(player.user.email);

  try {
    await prisma.$transaction(async (tx) => {
      if (fullName) {
        await tx.user.update({
          where: { id: player.userId },
          data: {
            fullName,
            phone,
            ...(normalizedEmail ? { email: normalizedEmail, role: "PLAYER" } : {}),
          },
        });
      }

      const data: Record<string, unknown> = {};
      if (photoUrl !== undefined) data.photoUrl = photoUrl || null;
      if (jerseyNumber !== undefined) {
        data.jerseyNumber = jerseyNumber ? parseInt(jerseyNumber, 10) : null;
      }
      if (position) data.position = position;
      if (dateOfBirth !== undefined) {
        data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth + "T00:00:00.000Z") : null;
      }

      await tx.player.update({ where: { id }, data });
    });

    if (emailChanged) {
      const setup = await sendPlayerSetupMail(player.userId, normalizedEmail!, fullName);
      if (setup.delivered) {
        return {
          success: true,
          info: "تم التحديث وإرسال رابط تفعيل لإيميل اللاعب",
        };
      }
    }

    const membership = await prisma.teamMembership.findFirst({
      where: { playerId: id, status: "ACTIVE" },
      select: { teamId: true },
    });

    await auditLog({
      actorId: user.id,
      action: "UPDATE_PLAYER",
      targetId: id,
      metadata: { fullName, email: normalizedEmail ?? null },
    });

    if (membership) {
      revalidatePath(`/teams/${membership.teamId}`);
    }
    revalidatePath("/teams");
    revalidatePath("/admin/players");

    return { success: true };
  } catch (error) {
    console.error("[updatePlayer]", error);
    return { success: false, error: "تعذّر تعديل اللاعب" };
  }
}

export async function deletePlayer(playerId: string): Promise<PlayerActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "يجب تسجيل الدخول" };

    const idParsed = cuid.safeParse(playerId);
    if (!idParsed.success) return { success: false, error: "معرف اللاعب غير صالح" };

    if (user.role !== "ADMIN") {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: { team: { select: { ownerId: true } } },
            take: 1,
          },
        },
      });

      if (!player) return { success: false, error: "اللاعب غير موجود" };

      const isOwnedByUser = player.memberships.some((m) => m.team.ownerId === user.id);
      if (!isOwnedByUser) return { success: false, error: "غير مصرح لك بحذف هذا اللاعب" };
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return { success: false, error: "اللاعب غير موجود" };

    const memberships = await prisma.teamMembership.findMany({
      where: { playerId },
      select: { teamId: true },
    });

    // Deleting a player silently cascades their match events (goals, assists,
    // cards), which would retroactively rewrite the top-scorers and discipline
    // tables. Refuse when any recorded match involvement exists.
    const eventCount = await prisma.matchEvent.count({ where: { playerId } });
    if (eventCount > 0) {
      return {
        success: false,
        error: "لا يمكن حذف اللاعب لأنه لديه أحداث مسجلة في المباريات (أهداف/كروت). احذف مبارياته أو عدّل بياناته بدلاً من ذلك.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.player.delete({ where: { id: playerId } });
      try {
        await tx.user.delete({ where: { id: player.userId } });
      } catch {
        // User may have AuditLog FK Restrict — leave orphaned user record
      }
    });

    await auditLog({
      actorId: user.id,
      action: "DELETE_PLAYER",
      targetId: playerId,
    });

    for (const m of memberships) {
      revalidatePath(`/teams/${m.teamId}`);
    }
    revalidatePath("/teams");
    revalidatePath("/admin/players");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("[deletePlayer]", error);
    return { success: false, error: "تعذّر حذف اللاعب" };
  }
}

export async function addToTeam(teamId: string, playerId: string) {
  const teamIdParsed = cuid.safeParse(teamId);
  if (!teamIdParsed.success) throw new Error("معرف الفريق غير صالح");
  const playerIdParsed = cuid.safeParse(playerId);
  if (!playerIdParsed.success) throw new Error("معرف اللاعب غير صالح");

  const user = await requireTeamAccess(teamId);

  const squadSize = await getTeamSquadSize(teamId);
  if (squadSize >= SQUAD_LIMIT) {
    throw new Error(`الحد الأقصى للاعبين في الفريق هو ${SQUAD_LIMIT} لاعب`);
  }

  // Verify player exists
  const playerExists = await prisma.player.findUnique({ where: { id: playerId }, select: { id: true } });
  if (!playerExists) throw new Error("اللاعب غير موجود");

  // A player may only be ACTIVE on one team at a time — activating them here
  // while they are already an ACTIVE member elsewhere would corrupt squads,
  // match scoring and the standings roster attribution.
  const otherActive = await prisma.teamMembership.findFirst({
    where: { playerId, status: "ACTIVE", teamId: { not: teamId } },
    select: { team: { select: { name: true } } },
  });
  if (otherActive) {
    throw new Error(`اللاعب عضو فعلي بالفعل في فريق ${otherActive.team.name} — أزله من فريقه الحالي أولاً`);
  }

  const existing = await prisma.teamMembership.findUnique({
    where: { teamId_playerId: { teamId, playerId } },
  });

  if (existing) {
    if (existing.status === "ACTIVE") {
      return;
    }
    if (existing.status === "REMOVED" || existing.status === "PENDING" || existing.status === "REJECTED") {
      await prisma.teamMembership.update({
        where: { id: existing.id },
        data: { status: "ACTIVE" },
      });
    }
  } else {
    await prisma.teamMembership.create({
      data: { teamId, playerId, status: "ACTIVE" },
    });
  }

  await auditLog({
    actorId: user.id,
    action: "ADD_PLAYER_TO_TEAM",
    targetId: teamId,
    metadata: { playerId },
  });

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/admin/players");
}

export async function removeFromTeam(teamId: string, playerId: string) {
  const teamIdParsed = cuid.safeParse(teamId);
  if (!teamIdParsed.success) throw new Error("معرف الفريق غير صالح");
  const playerIdParsed = cuid.safeParse(playerId);
  if (!playerIdParsed.success) throw new Error("معرف اللاعب غير صالح");

  const user = await requireTeamAccess(teamId);

  try {
    await prisma.teamMembership.updateMany({
      where: { teamId, playerId },
      data: { status: "REMOVED" },
    });

    await auditLog({
      actorId: user.id,
      action: "REMOVE_PLAYER_FROM_TEAM",
      targetId: teamId,
      metadata: { playerId },
    });

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/admin/players");
  } catch (error) {
    console.error("[removeFromTeam]", error);
    throw new Error("تعذّر إزالة اللاعب من الفريق");
  }
}

// ---------------------------------------------------------------------------
// Player account claim (self-service)
// ---------------------------------------------------------------------------

export type ClaimPlayerResult = { success: boolean; error?: string; setupLink?: string };

/**
 * "أنا هذا اللاعب" — binds a real email to the player's placeholder user
 * account and emails them a one-time password-setup link. Only works while the
 * account still has the generated placeholder email. When a phone is on file
 * it must match, which prevents strangers from claiming a profile.
 */
export async function claimPlayerAccount(
  _prev: ClaimPlayerResult,
  formData: FormData,
): Promise<ClaimPlayerResult> {
  const parsed = claimPlayerSchema.safeParse({
    playerId: formData.get("playerId"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const { playerId, email: rawEmail, phone } = parsed.data;
  const email = rawEmail.trim().toLowerCase();

  const rateCheck = checkRateLimit({
    key: `claim:${playerId}`,
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateCheck.ok) {
    const retryMinutes = Math.ceil(rateCheck.retryAfterMs / 60_000);
    return { success: false, error: `حاول مرة أخرى بعد ${retryMinutes} دقيقة.` };
  }

  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });
    if (!player) return { success: false, error: "اللاعب غير موجود" };

    if (!isFakePlayerEmail(player.user.email)) {
      return { success: false, error: "هذا اللاعب يملك حساباً بالفعل؛ استخدم استعادة كلمة المرور من صفحة تسجيل الدخول." };
    }

    if (player.user.phone) {
      if (!phone) {
        return { success: false, error: "أدخل رقم الهاتف المسجل لهذا اللاعب." };
      }
      const normalizedPhone = phone.replace(/[\s-]/g, "").replace(/^\+/, "");
      const normalizedStored = (player.user.phone ?? "").replace(/[\s-]/g, "").replace(/^\+/, "");
      if (normalizedStored && normalizedPhone !== normalizedStored) {
        return { success: false, error: "رقم الهاتف غير مطابق لبيانات اللاعب." };
      }
    }

    const conflict = await prisma.user.findUnique({ where: { email } });
    if (conflict) {
      return { success: false, error: "البريد الإلكتروني مستخدم من حساب آخر." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: player.user.id },
        data: { email, role: "PLAYER", phone: phone || player.user.phone },
      });
      await tx.session.deleteMany({ where: { userId: player.user.id } });
    });

    await auditLog({
      actorId: player.user.id,
      action: "CLAIM_PLAYER_ACCOUNT",
      targetId: playerId,
    });

    const setup = await sendPlayerSetupMail(player.user.id, email, player.user.fullName);

    revalidatePath(`/players/${playerId}`);
    revalidatePath("/admin/players");

    if (!setup.delivered) {
      return { success: true, setupLink: setup.resetLink };
    }
    return { success: true };
  } catch (error) {
    console.error("[claimPlayerAccount]", error);
    return { success: false, error: "تعذّر تفعيل الحساب. حاول مرة أخرى." };
  }
}

// ---------------------------------------------------------------------------
// Join-team requests (self-service onboarding)
// ---------------------------------------------------------------------------

/**
 * A logged-in user asks to join a team. If they don't have a player profile yet
 * one is created for them (linked to their account) as PENDING until the team
 * owner/manager approves it.
 */
export async function requestTeamJoin(teamId: string): Promise<PlayerActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "يجب تسجيل الدخول أولاً" };

    const idParsed = cuid.safeParse(teamId);
    if (!idParsed.success) return { success: false, error: "معرف الفريق غير صالح" };

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    });
    if (!team) return { success: false, error: "الفريق غير موجود" };

    const rateCheck = checkRateLimit({
      key: `teamjoin:${user.id}:${teamId}`,
      maxAttempts: 3,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateCheck.ok) {
      const retryMinutes = Math.ceil(rateCheck.retryAfterMs / 60_000);
      return { success: false, error: `حاول مرة أخرى بعد ${retryMinutes} دقيقة.` };
    }

    let player = await prisma.player.findUnique({ where: { userId: user.id } });
    if (!player) {
      player = await prisma.player.create({
        data: { userId: user.id, position: "MIDFIELDER", photoUrl: user.avatarUrl ?? null },
      });
    }

    const existing = await prisma.teamMembership.findUnique({
      where: { teamId_playerId: { teamId, playerId: player.id } },
    });
    if (existing?.status === "ACTIVE") {
      return { success: false, error: "أنت بالفعل عضو في هذا الفريق" };
    }
    if (existing?.status === "PENDING") {
      return { success: true, info: "طلبك قيد المراجعة بالفعل" };
    }

    if (existing) {
      await prisma.teamMembership.update({
        where: { id: existing.id },
        data: { status: "PENDING" },
      });
    } else {
      await prisma.teamMembership.create({
        data: { teamId, playerId: player.id, status: "PENDING" },
      });
    }

    await auditLog({
      actorId: user.id,
      action: "REQUEST_TEAM_JOIN",
      targetId: teamId,
      metadata: { playerId: player.id },
    });

    await notifyTeamContacts(teamId, "طلب انضمام جديد", `${user.fullName} قدّم طلب انضمام لفريق ${team.name}`);

    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("[requestTeamJoin]", error);
    return { success: false, error: "تعذّر إرسال الطلب. حاول مرة أخرى." };
  }
}

/**
 * Approve or reject a pending join request. Owners, linked team managers and
 * admins may respond.
 */
export async function respondTeamJoin(
  teamId: string,
  membershipId: string,
  approve: boolean,
): Promise<PlayerActionResult> {
  try {
    const user = await requireTeamManageAccess(teamId);

    const idParsed = cuid.safeParse(teamId);
    const membershipIdParsed = cuid.safeParse(membershipId);
    if (!idParsed.success || !membershipIdParsed.success) {
      return { success: false, error: "معرف غير صالح" };
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    });
    if (!team) return { success: false, error: "الفريق غير موجود" };

    const membership = await prisma.teamMembership.findUnique({
      where: { id: membershipId },
      include: { player: { include: { user: { select: { id: true, fullName: true } } } } },
    });
    if (!membership || membership.teamId !== teamId) {
      return { success: false, error: "طلب الانضمام غير موجود" };
    }
    if (membership.status !== "PENDING") {
      return { success: false, error: "تمت معالجة هذا الطلب بالفعل" };
    }

    const requester = membership.player.user;

    if (approve) {
      const squadSize = await getTeamSquadSize(teamId);
      if (squadSize >= SQUAD_LIMIT) {
        return { success: false, error: `القائمة ممتلئة (الحد الأقصى ${SQUAD_LIMIT} لاعب)` };
      }

      // Same single-team rule as addToTeam: approving must not put a player on
      // two ACTIVE rosters at once.
      const otherActive = await prisma.teamMembership.findFirst({
        where: { playerId: membership.playerId, status: "ACTIVE", teamId: { not: teamId } },
        select: { team: { select: { name: true } } },
      });
      if (otherActive) {
        return {
          success: false,
          error: `اللاعب عضو فعلي بالفعل في فريق ${otherActive.team.name} — أزله من فريقه الحالي أولاً`,
        };
      }

      await prisma.teamMembership.update({
        where: { id: membershipId },
        data: { status: "ACTIVE", joinedAt: new Date() },
      });

      await auditLog({
        actorId: user.id,
        action: "ACCEPT_TEAM_JOIN",
        targetId: teamId,
        metadata: { membershipId, playerId: membership.playerId },
      });

      await notifyUser(
        requester.id,
        "تمت الموافقة على طلبك",
        `تم قبول انضمامك لفريق ${team.name}. أصبحت الآن ضمن القائمة.`,
      );
    } else {
      await prisma.teamMembership.update({
        where: { id: membershipId },
        data: { status: "REJECTED" },
      });

      await auditLog({
        actorId: user.id,
        action: "REJECT_TEAM_JOIN",
        targetId: teamId,
        metadata: { membershipId, playerId: membership.playerId },
      });

      await notifyUser(
        requester.id,
        "تم رفض طلب الانضمام",
        `تم رفض طلب انضمامك لفريق ${team.name}.`,
      );
    }

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/teams");
    revalidatePath("/players");

    return { success: true };
  } catch (error) {
    console.error("[respondTeamJoin]", error);
    return { success: false, error: "تعذّر معالجة الطلب. حاول مرة أخرى." };
  }
}
