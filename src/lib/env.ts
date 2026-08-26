/**
 * Validates that required environment variables are set.
 * Called once at startup from requireAdmin(). Throws on failure
 * so misconfigured deployments surface clear errors immediately.
 */
export function validateAuthEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("[ASL] FATAL: DATABASE_URL is missing in production.");
  }
  if (dbUrl.startsWith("file:")) {
    throw new Error(
      "[ASL] FATAL: DATABASE_URL points to a SQLite file. " +
      "In production it must be a PostgreSQL connection string.",
    );
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "[ASL] FATAL: SESSION_SECRET is missing or too short in production. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
}
