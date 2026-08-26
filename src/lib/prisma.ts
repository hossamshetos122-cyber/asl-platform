import { PrismaClient } from "@prisma/client";

// Standard Next.js singleton pattern: in dev, hot-reload re-executes this
// module and would otherwise open a new PrismaClient (and DB connection)
// on every save. Stashing the instance on `globalThis` avoids that.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
