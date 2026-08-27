import { describe, it, expect } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { updateScoreSchema, createTeamSchema } from "@/lib/validation";

// Valid CUID-like IDs for testing
const CID1 = "c1234567890abcdefghijk001";
const CID2 = "c1234567890abcdefghijk002";
const CID3 = "c1234567890abcdefghijk003";

describe("Production Hardening — Registration rate limiting", () => {
  it("registration uses separate rate limit key namespace", () => {
    const key = "register:test@example.com";
    resetRateLimit(key);

    checkRateLimit({ key, maxAttempts: 3, windowMs: 60_000 });
    checkRateLimit({ key, maxAttempts: 3, windowMs: 60_000 });
    checkRateLimit({ key, maxAttempts: 3, windowMs: 60_000 });

    // 4th attempt blocked
    const result = checkRateLimit({ key, maxAttempts: 3, windowMs: 60_000 });
    expect(result.ok).toBe(false);
  });

  it("registration rate limit does not interfere with login rate limit", () => {
    const regKey = "register:user@test.com";
    const loginKey = "login:user@test.com";
    resetRateLimit(regKey);
    resetRateLimit(loginKey);

    // Exhaust registration
    checkRateLimit({ key: regKey, maxAttempts: 1, windowMs: 60_000 });
    const regBlocked = checkRateLimit({ key: regKey, maxAttempts: 1, windowMs: 60_000 });
    expect(regBlocked.ok).toBe(false);

    // Login still works
    const loginOk = checkRateLimit({ key: loginKey, maxAttempts: 1, windowMs: 60_000 });
    expect(loginOk.ok).toBe(true);
  });
});

describe("Production Hardening — updateScoreSchema", () => {
  it("accepts score without explicit status (action preserves match status)", () => {
    const result = updateScoreSchema.safeParse({
      matchId: CID1,
      homeScore: 2,
      awayScore: 1,
    });
    expect(result.success).toBe(true);
  });

  it("still accepts explicit status when provided", () => {
    const result = updateScoreSchema.safeParse({
      matchId: CID1,
      homeScore: 2,
      awayScore: 1,
      status: "FINISHED",
    });
    expect(result.success).toBe(true);
  });
});

describe("Production Hardening — Team creation with base64 logoUrl", () => {
  it("accepts logoUrl under 5MB (simulated base64 data URI)", () => {
    const fakeBase64 = "data:image/jpeg;base64," + "A".repeat(100_000);
    const result = createTeamSchema.safeParse({
      name: "Test Team",
      shortName: "TST",
      logoUrl: fakeBase64,
    });
    expect(result.success).toBe(true);
  });

  it("rejects logoUrl exceeding 5MB limit", () => {
    const hugeBase64 = "data:image/jpeg;base64," + "A".repeat(5_100_000);
    const result = createTeamSchema.safeParse({
      name: "Test Team",
      shortName: "TST",
      logoUrl: hugeBase64,
    });
    expect(result.success).toBe(false);
  });
});

describe("Production Hardening — Token format validation (middleware)", () => {
  function isValidTokenFormat(token: string): boolean {
    return /^[0-9a-f]{64}$/i.test(token);
  }

  it("accepts valid 64-char hex token", () => {
    expect(isValidTokenFormat("a".repeat(64))).toBe(true);
    expect(isValidTokenFormat("0123456789abcdef".repeat(4))).toBe(true);
  });

  it("rejects short token", () => {
    expect(isValidTokenFormat("abc123")).toBe(false);
  });

  it("rejects token with non-hex chars", () => {
    expect(isValidTokenFormat("g".repeat(64))).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidTokenFormat("")).toBe(false);
  });
});
