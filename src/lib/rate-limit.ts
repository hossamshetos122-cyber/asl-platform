/**
 * Simple in-memory rate limiter.
 *
 * Works per-process. Adequate for a single-instance Next.js deployment
 * (Vercel serverless, single Node process). Not distributed — each
 * serverless cold start gets a fresh map, which is acceptable because
 * brute-force attacks against a single instance are still bounded.
 *
 * For multi-instance deployments, swap the Map for Redis or a shared
 * store.
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
