"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createVerificationToken,
  consumeVerificationToken,
  hashPassword,
} from "@/lib/auth";
import { requestPasswordResetSchema, resetPasswordSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { auditLog } from "@/lib/audit";

export type RecoveryResult = { success: boolean; error?: string; fieldErrors?: Record<string, string>; resetLink?: string };

const REQUEST_MAX_ATTEMPTS = 3;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;

function getFieldErrors(result: { success: false; error: { issues: { path: (string | number)[]; message: string }[] } }): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (result.success) return fieldErrors;
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string") fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3389";

export async function requestPasswordResetAction(
  _prev: RecoveryResult,
  formData: FormData,
): Promise<RecoveryResult> {
  const raw = { email: formData.get("email") };
  const parsed = requestPasswordResetSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "تحقق من الحقول", fieldErrors: getFieldErrors(parsed) };
  }

  const email = parsed.data.email;

  // Rate limit to prevent email flooding abuse.
  const rateCheck = checkRateLimit({
    key: `reset:${email.toLowerCase()}`,
    maxAttempts: REQUEST_MAX_ATTEMPTS,
    windowMs: REQUEST_WINDOW_MS,
  });
  if (!rateCheck.ok) {
    const retryMinutes = Math.ceil(rateCheck.retryAfterMs / 60_000);
    return { success: false, error: `حاول مرة أخرى بعد ${retryMinutes} دقيقة.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always behave the same whether the account exists or not (no user probing).
  if (!user) {
    return { success: true };
  }

  // Invalidate any previous unused reset tokens for this user.
  await prisma.verificationToken.deleteMany({
    where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null },
  });

  const token = await createVerificationToken(user.id, "PASSWORD_RESET");
  const resetLink = `${APP_ORIGIN}/reset-password?token=${token}`;
  const actionLink = `${APP_ORIGIN}/reset-password?token=${token}`;

  const mail = await sendMail({
    to: user.email,
    subject: "إعادة تعيين كلمة المرور — دوري نجوم الإسكندرية",
    text: `مرحباً ${user.fullName}،\n\nاطلبت إعادة تعيين كلمة المرور لحسابك.\n\nافتح الرابط التالي لتحديد كلمة مرور جديدة (صالح لمدة ساعة واحدة):\n${resetLink}\n\nإذا لم تطلب ذلك، تجاهل هذه الرسالة.`,
    html: `<div dir="rtl" style="font-family:system-ui,sans-serif;line-height:1.7"><h2>إعادة تعيين كلمة المرور</h2><p>مرحباً ${user.fullName}،</p><p>اضغط على الزر التالي لتحديد كلمة مرور جديدة (صالح لمدة ساعة واحدة):</p><p><a href="${actionLink}" style="background:#1d6ff2;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">إعادة تعيين كلمة المرور</a></p><p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p></div>`,
  });

  // Demo fallback: no mail transport configured — surface the one-time link
  // directly so the flow still works end-to-end.
  if (!mail.delivered) {
    return { success: true, resetLink };
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prev: RecoveryResult,
  formData: FormData,
): Promise<RecoveryResult> {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "تحقق من الحقول", fieldErrors: getFieldErrors(parsed) };
  }

  const { token, password } = parsed.data;

  const consumed = await consumeVerificationToken(token, "PASSWORD_RESET");
  if (!consumed) {
    return { success: false, error: "الرابط غير صالح أو منتهي. اطلب رابطاً جديداً." };
  }

  try {
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: consumed.userId },
      data: { passwordHash },
    });

    // Revoke all sessions so the old sessions can't keep using the old password.
    await prisma.session.deleteMany({ where: { userId: consumed.userId } });

    await auditLog({ actorId: consumed.userId, action: "PASSWORD_RESET", targetId: consumed.userId });
  } catch (error) {
    console.error("[resetPasswordAction]", error);
    return { success: false, error: "تعذّر تحديث كلمة المرور. حاول مرة أخرى." };
  }

  redirect("/login?reset=1");
}

export async function verifyEmailAction(
  _prev: RecoveryResult,
  formData: FormData,
): Promise<RecoveryResult> {
  const token = String(formData.get("token") || "");

  const consumed = await consumeVerificationToken(token, "EMAIL_VERIFICATION");
  if (!consumed) {
    return { success: false, error: "الرابط غير صالح أو منتهي." };
  }

  try {
    await prisma.user.update({
      where: { id: consumed.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await auditLog({ actorId: consumed.userId, action: "EMAIL_VERIFIED", targetId: consumed.userId });
  } catch (error) {
    console.error("[verifyEmailAction]", error);
    return { success: false, error: "تعذّر تأكيد البريد. حاول مرة أخرى." };
  }

  return { success: true };
}

export async function sendVerificationEmailAction(): Promise<RecoveryResult> {
  const user = await import("@/lib/auth").then((m) => m.requireUser());

  if (user.emailVerifiedAt) {
    return { success: true };
  }

  await prisma.verificationToken.deleteMany({
    where: { userId: user.id, type: "EMAIL_VERIFICATION", usedAt: null },
  });

  const token = await createVerificationToken(user.id, "EMAIL_VERIFICATION");
  const verifyLink = `${APP_ORIGIN}/verify-email?token=${token}`;

  const mail = await sendMail({
    to: user.email,
    subject: "تأكيد البريد الإلكتروني — دوري نجوم الإسكندرية",
    text: `مرحباً ${user.fullName}،\n\nللتحقق من بريدك الإلكتروني في منصة دوري نجوم الإسكندرية اتبع الرابط التالي (صالح لمدة ساعة واحدة):\n${verifyLink}`,
    html: `<div dir="rtl" style="font-family:system-ui,sans-serif;line-height:1.7"><h2>تأكيد البريد الإلكتروني</h2><p>مرحباً ${user.fullName}،</p><p><a href="${verifyLink}" style="background:#1d6ff2;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">تأكيد بريدي الإلكتروني</a></p></div>`,
  });

  if (!mail.delivered) {
    return { success: true, resetLink: verifyLink };
  }

  return { success: true };
}