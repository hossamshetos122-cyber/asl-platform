// scripts/rotate-admin-credentials.ts
// =============================================================================
// Applies REAL admin/organizer credentials to a live database.
//
// Why it exists: prisma/seed.ts intentionally does NOT contain the real admin
// password. This script is the only place a real (strong, random) admin
// password is pushed to a production/remote database.
//
// Behavior:
//   1. If a user already exists with ROTATE_ADMIN_EMAIL, that account is
//      promoted to ADMIN and given the new password (it is the site owner's
//      real registered account). Otherwise the synthetic seed admin
//      (id=user-admin) is updated with that email and password.
//   2. The legacy synthetic seed admin (id=user-admin / admin@asl.local) is
//      demoted to FAN and given a random password so stale credentials die.
//   3. The organizer account (id=user-organizer) gets its new password.
//   4. All existing sessions for the rotated accounts are revoked.
//
// Required environment variables (put them in your gitignored .env, NOT in
// committed files):
//   DATABASE_URL              - live PostgreSQL connection string
//   ROTATE_ADMIN_EMAIL        - new admin email (e.g. your real email)
//   ROTATE_ADMIN_PASSWORD     - new strong admin password
//   ROTATE_ORGANIZER_PASSWORD - new strong organizer password
//
// Run:
//   npm run db:rotate:admin
// =============================================================================
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// --- Minimal .env loader (no external dependency) ---------------------------
function loadDotEnv(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

// --- Password hashing (must match src/lib/auth.ts) ---------------------------
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { cost: 16384 }, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const parts = hash.split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const salt = parts[0];
  const storedHex = parts[1];
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

// --- Main --------------------------------------------------------------------
async function main(): Promise<void> {
  const envPath = path.resolve(process.cwd(), ".env");
  loadDotEnv(envPath);

  const dbUrl = process.env.DATABASE_URL;
  const emailRaw = process.env.ROTATE_ADMIN_EMAIL?.trim();
  const adminPasswordRaw = process.env.ROTATE_ADMIN_PASSWORD;
  const organizerPasswordRaw = process.env.ROTATE_ORGANIZER_PASSWORD;

  const missing: string[] = [];
  if (!emailRaw) missing.push("ROTATE_ADMIN_EMAIL");
  if (!adminPasswordRaw) missing.push("ROTATE_ADMIN_PASSWORD");
  if (!organizerPasswordRaw) missing.push("ROTATE_ORGANIZER_PASSWORD");
  if (!dbUrl || dbUrl.startsWith("file:")) missing.push("DATABASE_URL (PostgreSQL)");

  if (missing.length > 0 || !emailRaw || !adminPasswordRaw || !organizerPasswordRaw) {
    console.error(
      "[rotate] Missing required env vars: " + missing.join(", ") +
      "\n        Add them to your gitignored .env file, then run:\n" +
      "        npm run db:rotate:admin",
    );
    process.exit(1);
  }

  const email = emailRaw;
  const adminPassword = adminPasswordRaw;
  const organizerPassword = organizerPasswordRaw;
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
  } catch (err) {
    console.error("[rotate] Could not connect to the database. Check DATABASE_URL.");
    console.error(err);
    process.exit(1);
  }

  try {
    // --- 1) Promote the real admin account (matched by email) ---------
    // If a real user already registered with ROTATE_ADMIN_EMAIL, promote
    // THAT account to ADMIN (it is the site owner's real account). Do not try
    // to re-assign that email onto the synthetic seed admin — it would hit the
    // unique constraint and fail.
    let admin = await prisma.user.findFirst({ where: { email } });
    if (admin) {
      const adminHash = await hashPassword(adminPassword);
      const updated = await prisma.user.update({
        where: { id: admin.id },
        data: { role: "ADMIN", passwordHash: adminHash },
      });
      if (!(await verifyPassword(adminPassword, updated.passwordHash))) {
        throw new Error("Admin password verification failed after update.");
      }
      console.log(`[rotate] Admin promoted -> ${updated.email} (${updated.fullName}) [password rotated, role=ADMIN]`);
    } else {
      // Fall back to the synthetic seed admin (fresh DBs have no real user yet).
      admin = await prisma.user.findFirst({ where: { id: "user-admin" } });
      if (!admin) {
        console.error("[rotate] No user with email ROTATE_ADMIN_EMAIL and no (id=user-admin) found in this database.");
        await prisma.$disconnect();
        process.exit(1);
      }
      const adminHash = await hashPassword(adminPassword);
      const updated = await prisma.user.update({
        where: { id: admin.id },
        data: { email, passwordHash: adminHash, role: "ADMIN" },
      });
      if (!(await verifyPassword(adminPassword, updated.passwordHash))) {
        throw new Error("Admin password verification failed after update.");
      }
      console.log(`[rotate] Admin updated -> ${updated.email} (password rotated)`);
    }

    // --- 2) Lock down the synthetic seed admin (if it still exists) ---
    // The real promoted account above is now the only ADMIN. Demote the old
    // seed admin (admin@asl.local) to FAN and give it a random password so no
    // stale credentials can be used against it.
    if (admin.id !== "user-admin") {
      const legacy = await prisma.user.findFirst({ where: { id: "user-admin" } });
      if (legacy) {
        const randomPassword = crypto.randomBytes(24).toString("base64url");
        const legacyHash = await hashPassword(randomPassword);
        await prisma.user.update({
          where: { id: legacy.id },
          data: { role: "FAN", passwordHash: legacyHash },
        });
        console.log(`[rotate] Legacy seed admin (${legacy.email}) demoted to FAN and locked (random password).`);
      }
    }

    // --- 3) Rotate organizer password ---------------------------------
    const organizer = await prisma.user.findFirst({ where: { id: "user-organizer" } });
    if (organizer) {
      const organizerHash = await hashPassword(organizerPassword);
      await prisma.user.update({
        where: { id: organizer.id },
        data: { passwordHash: organizerHash },
      });
      const orgCheck = await prisma.user.findUnique({ where: { id: organizer.id } });
      if (!orgCheck || !(await verifyPassword(organizerPassword, orgCheck.passwordHash))) {
        throw new Error("Organizer password verification failed after update.");
      }
      console.log(`[rotate] Organizer updated (${orgCheck.email})`);
    } else {
      console.log("[rotate] Organizer (id=user-organizer) not found — skipped.");
    }

    // --- 4) Revoke existing sessions so old tokens die -----------------
    await prisma.session.deleteMany({ where: { userId: admin.id } });
    if (admin.id !== "user-admin") {
      await prisma.session.deleteMany({ where: { userId: "user-admin" } });
    }
    if (organizer) await prisma.session.deleteMany({ where: { userId: organizer.id } });

    console.log("[rotate] Done. Existing sessions were revoked for the rotated accounts.");
  } catch (err) {
    console.error("[rotate] Failed:");
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();