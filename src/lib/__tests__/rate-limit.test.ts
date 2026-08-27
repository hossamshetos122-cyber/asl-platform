import { describe, it, expect } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows first attempt", () => {
    resetRateLimit("test:first");
    const result = checkRateLimit({
      key: "test:first",
      maxAttempts: 3,
      windowMs: 60_000,
    });
    expect(result.ok).toBe(true);
  });

  it("blocks after max attempts exceeded", () => {
    const key = "test:exceed";
    resetRateLimit(key);

    // Use up all attempts
    checkRateLimit({ key, maxAttempts: 2, windowMs: 60_000 });
    checkRateLimit({ key, maxAttempts: 2, windowMs: 60_000 });

    // Third attempt should be blocked
    const result = checkRateLimit({ key, maxAttempts: 2, windowMs: 60_000 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("resets after window expires", () => {
    const key = "test:window";
    resetRateLimit(key);

    // Use up all attempts with a very short window
    checkRateLimit({ key, maxAttempts: 1, windowMs: 1 }); // 1ms window

    // Wait a bit
    const start = Date.now();
    while (Date.now() - start < 5) {
      // busy wait
    }

    // Should be allowed again
    const result = checkRateLimit({ key, maxAttempts: 1, windowMs: 60_000 });
    expect(result.ok).toBe(true);
  });

  it("resetRateLimit clears the counter", () => {
    const key = "test:reset";
    resetRateLimit(key);

    checkRateLimit({ key, maxAttempts: 1, windowMs: 60_000 });

    // Now blocked
    const blocked = checkRateLimit({ key, maxAttempts: 1, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);

    // Reset
    resetRateLimit(key);

    // Should be allowed again
    const allowed = checkRateLimit({ key, maxAttempts: 1, windowMs: 60_000 });
    expect(allowed.ok).toBe(true);
  });

  it("different keys have independent counters", () => {
    resetRateLimit("test:indep:a");
    resetRateLimit("test:indep:b");

    // Exhaust key A
    checkRateLimit({ key: "test:indep:a", maxAttempts: 1, windowMs: 60_000 });
    const aBlocked = checkRateLimit({ key: "test:indep:a", maxAttempts: 1, windowMs: 60_000 });
    expect(aBlocked.ok).toBe(false);

    // Key B should still be fine
    const bAllowed = checkRateLimit({ key: "test:indep:b", maxAttempts: 1, windowMs: 60_000 });
    expect(bAllowed.ok).toBe(true);
  });
});
