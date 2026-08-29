// scripts/rotate-admin-credentials.ts
// =============================================================================
// Applies REAL admin/organizer credentials to a live database.
//
// Why it exists: prisma/seed.ts intentionally does NOT contain the real admin
// password. This script is the only place a real (strong, random) admin
// password is pushed to a production/remote database.
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
    // --- Find admin ---------------------------------------------------
    const admin = await prisma.user.findFirst({
      where: { id: "user-admin" },
    });
    if (!admin) {
      console.error("[rotate] Admin user (id=user-admin) not found in this database.");
      await prisma.$disconnect();
      process.exit(1);
    }

    // --- Rotate admin email + password --------------------------------
    const adminHash = await hashPassword(adminPassword);
    await prisma.user.update({
      where: { id: admin.id },
      data: { email, passwordHash: adminHash },
    });
    const adminCheck = await prisma.user.findUnique({ where: { id: admin.id } });
    if (!adminCheck || !(await verifyPassword(adminPassword, adminCheck.passwordHash))) {
      throw new Error("Admin password verification failed after update.");
    }
    console.log(`[rotate] Admin updated  -> ${adminCheck.email} (password rotated)`);

    // --- Rotate organizer password ------------------------------------
    const organizer = await prisma.user.findFirst({
      where: { id: "user-organizer" },
    });
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

    // --- Revoke existing sessions so old tokens die -------------------
    await prisma.session.deleteMany({ where: { userId: admin.id } });
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