import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import crypto from "crypto";
import { validateAuthEnv } from "@/lib/env";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "session";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { cost: 16384 }, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const parts = hash.split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const salt = parts[0];
  const storedHex = parts[1];
  // Validate hex format — must be exactly 128 hex chars (64 bytes)
  if (!/^[0-9a-f]{128}$/i.test(storedHex)) return false;
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { cost: 16384 }, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });
  const storedBuf = Buffer.from(storedHex, "hex");
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function validateSession(
  token: string,
): Promise<User | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function requireAdmin(): Promise<User> {
  validateAuthEnv();
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Require any authenticated user (not just admin).
 * Throws "UNAUTHORIZED" if not logged in.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Remove all expired sessions from the database.
 * Call periodically (e.g. on a cron or on login) to prevent buildup.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
