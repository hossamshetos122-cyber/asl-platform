"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  createVerificationToken,
  consumeVerificationToken,
  hashPassword,
} from "@/lib/auth";
import { adminInviteSchema, acceptAdminInviteSchema, cuid } from "@/lib/validation";
import { sendMail } from "@/lib/mail";
import { auditLog } from "@/lib/audit";
import { getSiteConfig } from "@/lib/data/site-config";

export type AdminActionResult = {
  ok: boolean;
  error?: string;
  inviteLink?: string;
  fieldErrors?: Record<string, string>;
};

const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3389";

export interface AdminRow {
  id: string;
  fullName: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

/**
 * Every admin account (role = ADMIN). All admins share the same league data
 * and have identical, unrestricted permissions.
 */
export async function getAdmins(): Promise<AdminRow[]> {
  return prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, fullName: true, email: true, emailVerifiedAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Invite a new admin. Creates the account immediately (role ADMIN) with an
 * unusable placeholder password, then emails a one-time link so the invitee
 * can set their own password and confirm access.
 */
export async function inviteAdminAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const actor = await requireAdmin();

  const parsed = adminInviteSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "بيانات غير صالحة" };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "ADMIN") {
      return { ok: false, error: "هذا البريد هو أدمن بالفعل" };
    }
    return { ok: false, error: "هذا البريد مسجّل بحساب آخر. استخدم بريداً مختلفاً." };
  }

  // Placeholder hash — cannot be used to log in until the invitee sets a password.
  const placeholderHash = await hashPassword(crypto.randomBytes(48).toString("hex"));

  let newAdmin: { id: string; email: string; fullName: string };
  try {
    newAdmin = await prisma.user.create({
      data: {
        email,
        passwordHash: placeholderHash,
        fullName: "",
        role: "ADMIN",
      },
      select: { id: true, email: true, fullName: true },
    });
  } catch (error) {
    console.error("[inviteAdmin]", error);
    return { ok: false, error: "تعذّر إنشاء الحساب. حاول مرة أخرى." };
  }

  // Invalidate any previous unused invite tokens for this user.
  await prisma.verificationToken.deleteMany({
    where: { userId: newAdmin.id, type: "ADMIN_INVITE", usedAt: null },
  });

  const token = await createVerificationToken(newAdmin.id, "ADMIN_INVITE");
  const inviteLink = `${APP_ORIGIN}/accept-invite?token=${token}`;

  const leagueName = (await getSiteConfig()).leagueName;

  const mail = await sendMail({
    to: email,
    subject: `دعوة للانضمام إلى لوحة تحكم ${leagueName}`,
    text: `مرحباً،\n\nتمت دعوتك للانضمام إلى فريق الإدارة في ${leagueName}.\n\nلإكمال حسابك وتحديد كلمة مرور خاصة بك، افتح الرابط التالي (صالح لمدة ساعة واحدة):\n${inviteLink}\n\nبعد ذلك يمكنك تسجيل الدخول كأدمن بنفس الصلاحيات الكاملة.`,
    html: `<div dir="rtl" style="font-family:system-ui,sans-serif;line-height:1.7"><h2>دعوة للانضمام إلى الإدارة</h2><p>مرحباً،</p><p>تمت دعوتك للانضمام إلى فريق الإدارة في <strong>${leagueName}</strong>.</p><p>اضغط على الزر التالي لإكمال حسابك وتحديد كلمة مرور خاصة بك (صالح لمدة ساعة واحدة):</p><p><a href="${inviteLink}" style="background:#1d6ff2;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">إكمال حساب الأدمن</a></p><p>بعد ذلك يمكنك تسجيل الدخول كأدمن بنفس الصلاحيات الكاملة.</p></div>`,
  });

  await auditLog({
    actorId: actor.id,
    action: "INVITE_ADMIN",
    targetId: newAdmin.id,
    metadata: { email, delivered: mail.delivered },
  });

  // Demo fallback — no mail transport: surface the one-time link directly.
  if (!mail.delivered) {
    return { ok: true, inviteLink };
  }

  return { ok: true };
}

/**
 * Complete an admin invitation: verify the one-time token, let the invitee
 * set their own password (and name), confirm the email, and revoke any prior
 * sessions. This is a public action gated only by the token.
 */
export async function acceptAdminInviteAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = acceptAdminInviteSchema.safeParse({
    token: formData.get("token"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { ok: false, error: parsed.error.issues[0]?.message ?? "تحقق من الحقول", fieldErrors };
  }

  const { token, fullName, password } = parsed.data;

  const consumed = await consumeVerificationToken(token, "ADMIN_INVITE");
  if (!consumed) {
    return { ok: false, error: "الرابط غير صالح أو منتهي. اطلب دعوة جديدة من إعدادات الأدمن." };
  }

  const target = await prisma.user.findUnique({ where: { id: consumed.userId } });
  if (!target || target.role !== "ADMIN") {
    return { ok: false, error: "هذا الحساب لم يعد مؤهلاً للانضمام إلى الإدارة." };
  }

  try {
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: target.id },
      data: { passwordHash, fullName, emailVerifiedAt: new Date() },
    });
    await prisma.session.deleteMany({ where: { userId: target.id } });
    await auditLog({ actorId: target.id, action: "ADMIN_INVITE_ACCEPTED", targetId: target.id });
  } catch (error) {
    console.error("[acceptAdminInvite]", error);
    return { ok: false, error: "تعذّر إكمال الحساب. حاول مرة أخرى." };
  }

  return { ok: true };
}

/**
 * Remove admin permission from another admin (demotes to FAN and revokes
 * their sessions so access is cut immediately). An admin can never remove
 * themselves.
 */
export async function removeAdminAction(formData: FormData): Promise<AdminActionResult> {
  const actor = await requireAdmin();

  const adminId = String(formData.get("adminId") || "");
  const parsed = cuid.safeParse(adminId);
  if (!parsed.success) return { ok: false, error: "بيانات غير صالحة" };

  if (actor.id === parsed.data) {
    return { ok: false, error: "لا يمكنك إزالة صلاحية حسابك الحالي." };
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data } });
  if (!target || target.role !== "ADMIN") {
    return { ok: false, error: "هذا الحساب ليس أدمن." };
  }

  try {
    await prisma.user.update({
      where: { id: target.id },
      data: { role: "FAN" },
    });
    await prisma.session.deleteMany({ where: { userId: target.id } });
    await auditLog({
      actorId: actor.id,
      action: "REMOVE_ADMIN",
      targetId: target.id,
      metadata: { email: target.email },
    });
  } catch (error) {
    console.error("[removeAdmin]", error);
    return { ok: false, error: "تعذّر إزالة الصلاحية. حاول مرة أخرى." };
  }

  return { ok: true };
}
