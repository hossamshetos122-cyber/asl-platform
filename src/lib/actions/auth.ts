"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  cleanupExpiredSessions,
} from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validation";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

// Rate limit: 5 attempts per 15 minutes per IP+email combo
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Rate limit for registration: 3 accounts per 30 minutes per IP
const REGISTER_MAX_ATTEMPTS = 3;
const REGISTER_WINDOW_MS = 30 * 60 * 1000;

export type AuthResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function getFieldErrors(schema: ReturnType<typeof loginSchema.safeParse>): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (schema.success) return fieldErrors;
  for (const issue of schema.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}

export async function registerAction(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "تحقق من الحقول", fieldErrors: getFieldErrors(parsed) };
  }

  const { fullName, email, password } = parsed.data;

  // Rate limit registration to prevent spam
  const rateLimitKey = `register:${email.toLowerCase()}`;
  const rateCheck = checkRateLimit({
    key: rateLimitKey,
    maxAttempts: REGISTER_MAX_ATTEMPTS,
    windowMs: REGISTER_WINDOW_MS,
  });

  if (!rateCheck.ok) {
    const retryMinutes = Math.ceil(rateCheck.retryAfterMs / 60_000);
    return {
      success: false,
      error: `تم تجاوز عدد محاولات التسجيل. حاول مرة أخرى بعد ${retryMinutes} دقيقة.`,
    };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "البريد الإلكتروني مسجّل بالفعل" };
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: "FAN",
      },
    });

    const token = await createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    await auditLog({ actorId: user.id, action: "REGISTER", targetId: user.id });

    redirect("/dashboard");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    console.error("[registerAction]", error);
    return { success: false, error: "تعذّر إنشاء الحساب. حاول مرة أخرى." };
  }
}

export async function loginAction(
  _prev: AuthResult,
  formData: FormData,
  redirectTo?: string,
): Promise<AuthResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "تحقق من الحقول", fieldErrors: getFieldErrors(parsed) };
  }

  const { email, password } = parsed.data;

  // Rate limit by email (normalized) to prevent brute-force
  const rateLimitKey = `login:${email.toLowerCase()}`;
  const rateCheck = checkRateLimit({
    key: rateLimitKey,
    maxAttempts: LOGIN_MAX_ATTEMPTS,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!rateCheck.ok) {
    const retryMinutes = Math.ceil(rateCheck.retryAfterMs / 60_000);
    return {
      success: false,
      error: `تم تجاوز عدد محاولات الدخول. حاول مرة أخرى بعد ${retryMinutes} دقيقة.`,
    };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }

    // Successful login — reset rate limit and cleanup expired sessions
    resetRateLimit(rateLimitKey);
    cleanupExpiredSessions().catch(() => {});

    // Revoke all existing sessions for this user before creating a new one
    await prisma.session.deleteMany({ where: { userId: user.id } });

    const token = await createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    await auditLog({ actorId: user.id, action: "LOGIN", targetId: user.id });

    if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      redirect(redirectTo);
    }

    redirect(
      user.role === "ADMIN" ? "/admin" :
      user.role === "TEAM_MANAGER" ? "/manage" :
      user.role === "REFEREE" ? "/referee" :
      "/dashboard"
    );
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    console.error("[loginAction]", error);
    return { success: false, error: "تعذّر تسجيل الدخول. حاول مرة أخرى." };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      const user = await import("@/lib/auth").then((m) =>
        m.validateSession(token),
      );
      if (user) {
        await auditLog({ actorId: user.id, action: "LOGOUT", targetId: user.id });
      }
      await destroySession(token);
    } catch (e) {
      console.error("[logoutAction]", e);
    }
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  redirect("/");
}
