/**
 * Rate limiter with backends, tried in this order:
 *
 * 1. Upstash Redis (shared across instances) — used when
 *    UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 * 2. Postgres (shared across instances) — used in production, reading/writing
 *    the RateLimitCounter table in the app's own database, so every
 *    serverless instance shares one counter with no extra service.
 * 3. In-memory (per-process) — fallback elsewhere and if a shared store errors
 *    (fail-open, still bounded per instance).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leak from stale entries.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function upstashExec(commands: unknown[][]): Promise<number[]> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`upstash rate-limit error: ${res.status}`);
  }
  const data = (await res.json()) as { result?: unknown }[];
  return data.map((item) => Number(item.result ?? 0));
}

/**
 * Check rate limit for a given key (e.g. "login:192.168.1.1" or "login:user@example.com").
 *
 * @returns `{ ok: true }` if allowed, `{ ok: false, retryAfterMs }` if blocked.
 */
export function checkRateLimit(params: {
  key: string;
  maxAttempts: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterMs: number } {
  cleanup();

  const { key, maxAttempts, windowMs } = params;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= maxAttempts) {
    return { ok: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { ok: true };
}

/** Reset rate limit for a key (e.g. after successful login). */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Distributed variant: shared counter via Upstash Redis or the app's Postgres
 * when available, otherwise identical to the in-memory `checkRateLimit`.
 */
export async function checkRateLimitDistributed(params: {
  key: string;
  maxAttempts: number;
  windowMs: number;
}): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
  const { key, maxAttempts, windowMs } = params;

  if (upstashConfigured()) {
    const seconds = Math.max(1, Math.ceil(windowMs / 1000));
    try {
      const [count] = await upstashExec([["INCR", key]]);
      if (count === 1) {
        await upstashExec([["EXPIRE", key, seconds]]);
      }
      if ((count ?? 0) > maxAttempts) {
        const [ttlSeconds] = await upstashExec([["PTTL", key]]);
        const retryAfterMs = (ttlSeconds ?? 0) > 0 ? (ttlSeconds ?? 0) * 1000 : windowMs;
        return { ok: false, retryAfterMs };
      }
      return { ok: true };
    } catch {
      return checkRateLimit(params);
    }
  }

  if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    try {
      return await postgresCheck(key, maxAttempts, windowMs);
    } catch {
      return checkRateLimit(params);
    }
  }

  return checkRateLimit(params);
}

let pgPool: import("pg").Pool | null = null;

async function getPgPool(): Promise<import("pg").Pool> {
  if (!pgPool) {
    const { Pool } = await import("pg");
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return pgPool;
}

async function postgresCheck(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
  const pool = await getPgPool();
  const now = Date.now();
  const resetAt = new Date(now + windowMs);
  const result = await pool.query(
    `INSERT INTO "RateLimitCounter" ("key", "count", "resetAt") VALUES ($1, 1, $2)
       ON CONFLICT ("key") DO UPDATE SET
         "count"   = CASE WHEN "RateLimitCounter"."resetAt" <= NOW() THEN 1 ELSE "RateLimitCounter"."count" + 1 END,
         "resetAt" = CASE WHEN "RateLimitCounter"."resetAt" <= NOW() THEN EXCLUDED."resetAt" ELSE "RateLimitCounter"."resetAt" END
       RETURNING "count", "resetAt"`,
    [key, resetAt],
  );

  const row = result.rows[0];
  const count = Number(row?.["count"] ?? 1);
  if (count > maxAttempts) {
    const resetAtTime = row?.["resetAt"] ? new Date(row["resetAt"] as Date).getTime() : now + windowMs;
    return { ok: false, retryAfterMs: Math.max(1, resetAtTime - Date.now()) };
  }
  return { ok: true };
}

/** Distributed reset; falls back to in-memory when no shared store is configured. */
export async function resetRateLimitDistributed(key: string): Promise<void> {
  if (upstashConfigured()) {
    try {
      await upstashExec([["DEL", key]]);
    } catch {
      resetRateLimit(key);
    }
    return;
  }

  if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    try {
      await (await getPgPool()).query(`DELETE FROM "RateLimitCounter" WHERE "key" = $1`, [key]);
    } catch {
      resetRateLimit(key);
    }
    return;
  }

  resetRateLimit(key);
}