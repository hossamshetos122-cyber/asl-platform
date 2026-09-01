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
 * Require a logged-in user with the REFEREE role (admins pass too).
 * Throws "UNAUTHORIZED" / "FORBIDDEN" otherwise.
 */
export async function requireReferee(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.role === "ADMIN") return user;
  if (user.role !== "REFEREE") throw new Error("FORBIDDEN");
  return user;
}

/**
 * One-time, expiring token for password reset / email verification / admin invite.
 */
export async function createVerificationToken(
  userId: string,
  type: "PASSWORD_RESET" | "EMAIL_VERIFICATION" | "ADMIN_INVITE",
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId,
      token,
      type,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });
  return token;
}

/**
 * Validate + consume a single-use token. Returns the record or null.
 */
export async function consumeVerificationToken(
  token: string,
  type: "PASSWORD_RESET" | "EMAIL_VERIFICATION" | "ADMIN_INVITE",
): Promise<{ userId: string; type: string } | null> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.type !== type) return null;
  if (record.usedAt || record.expiresAt < new Date()) return null;
  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  return { userId: record.userId, type: record.type };
}

/**
 * Fetch the teams a user manages (via the TeamManagers many-to-many link).
 */
export async function getManagedTeams(userId: string) {
  return prisma.team.findMany({
    where: { managers: { some: { id: userId } } },
    include: {
      _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Require a team manager who manages at least one team.
 * Returns the user plus their managed teams.
 */
export async function requireTeamManager(): Promise<{ user: User; teams: Awaited<ReturnType<typeof getManagedTeams>> }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.role === "ADMIN") {
    return { user, teams: [] };
  }
  if (user.role !== "TEAM_MANAGER") throw new Error("FORBIDDEN");
  const teams = await getManagedTeams(user.id);
  if (teams.length === 0) throw new Error("FORBIDDEN");
  return { user, teams };
}

/**
 * Whether a user may act on a specific team: admins manage everything,
 * team managers only the teams explicitly linked to them.
 */
export async function canManageTeam(user: User, teamId: string): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role !== "TEAM_MANAGER") return false;
  const count = await prisma.team.count({
    where: { id: teamId, managers: { some: { id: user.id } } },
  });
  return count > 0;
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
