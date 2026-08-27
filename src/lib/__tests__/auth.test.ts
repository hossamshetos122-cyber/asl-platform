import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("hashPassword", () => {
  it("returns a salt:hash string", async () => {
    const hash = await hashPassword("testPassword123");
    expect(hash).toContain(":");
    const [salt, hex] = hash.split(":");
    expect(salt).toHaveLength(32); // 16 bytes hex
    expect(hex).toHaveLength(128); // 64 bytes hex
  });

  it("produces different hashes for same password (different salts)", async () => {
    const hash1 = await hashPassword("testPassword123");
    const hash2 = await hashPassword("testPassword123");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const password = "mySecurePassword123!";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("returns false for incorrect password", async () => {
    const hash = await hashPassword("correctPassword");
    const result = await verifyPassword("wrongPassword", hash);
    expect(result).toBe(false);
  });

  it("returns false for empty password", async () => {
    const hash = await hashPassword("something");
    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });

  it("returns false for malformed hash", async () => {
    const result = await verifyPassword("password", "badhash");
    expect(result).toBe(false);
  });
});
