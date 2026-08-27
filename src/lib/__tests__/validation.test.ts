import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createTeamSchema,
  updateTeamSchema,
  createPlayerSchema,
  createTournamentSchema,
  createMatchSchema,
  updateScoreSchema,
  addMatchEventSchema,
  setTeamSquadSchema,
  setTeamLineupSchema,
  confirmSquadSchema,
  MAX_SCORE,
} from "@/lib/validation";

// Valid CUID-like IDs for testing (c + 25 alphanumeric chars)
const CID1 = "c1234567890abcdefghijk001";
const CID2 = "c1234567890abcdefghijk002";
const CID3 = "c1234567890abcdefghijk003";
const CID4 = "c1234567890abcdefghijk004";
const CID5 = "c1234567890abcdefghijk005";

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      fullName: "Ahmed Ali",
      email: "ahmed@example.com",
      password: "securePass1",
      confirmPassword: "securePass1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password (< 8 chars)", () => {
    const result = registerSchema.safeParse({
      fullName: "Ahmed",
      email: "ahmed@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      fullName: "Ahmed",
      email: "ahmed@example.com",
      password: "securePass1",
      confirmPassword: "differentPass",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      fullName: "Ahmed",
      email: "not-an-email",
      password: "securePass1",
      confirmPassword: "securePass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      fullName: "",
      email: "ahmed@example.com",
      password: "securePass1",
      confirmPassword: "securePass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password > 128 chars", () => {
    const longPass = "a".repeat(129);
    const result = registerSchema.safeParse({
      fullName: "Ahmed",
      email: "ahmed@example.com",
      password: longPass,
      confirmPassword: longPass,
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "ahmed@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "ahmed@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "bad",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("createTeamSchema", () => {
  it("accepts valid team data", () => {
    const result = createTeamSchema.safeParse({
      name: "Al Ittihad",
      shortName: "ITTH",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createTeamSchema.safeParse({
      name: "",
      shortName: "ITTH",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty shortName", () => {
    const result = createTeamSchema.safeParse({
      name: "Al Ittihad",
      shortName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects overly long name (> 100)", () => {
    const result = createTeamSchema.safeParse({
      name: "A".repeat(101),
      shortName: "ITTH",
    });
    expect(result.success).toBe(false);
  });
});

describe("createPlayerSchema", () => {
  it("accepts valid player data", () => {
    const result = createPlayerSchema.safeParse({
      teamId: CID1,
      fullName: "Mohamed Salah",
      position: "FORWARD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid position", () => {
    const result = createPlayerSchema.safeParse({
      teamId: CID1,
      fullName: "Mohamed Salah",
      position: "BANANA",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid jersey number", () => {
    const result = createPlayerSchema.safeParse({
      teamId: CID1,
      fullName: "Mohamed Salah",
      jerseyNumber: "150",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid jersey number", () => {
    const result = createPlayerSchema.safeParse({
      teamId: CID1,
      fullName: "Mohamed Salah",
      jerseyNumber: "10",
    });
    expect(result.success).toBe(true);
  });
});

describe("createTournamentSchema", () => {
  it("accepts valid tournament", () => {
    const result = createTournamentSchema.safeParse({
      name: "Premier League",
      format: "LEAGUE",
      startDate: "2025-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid format", () => {
    const result = createTournamentSchema.safeParse({
      name: "Premier League",
      format: "INVALID_FORMAT",
      startDate: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = createTournamentSchema.safeParse({
      name: "Premier League",
      format: "LEAGUE",
      status: "BANANA",
      startDate: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("createMatchSchema", () => {
  it("accepts valid match", () => {
    const result = createMatchSchema.safeParse({
      tournamentId: CID1,
      homeTeamId: CID2,
      awayTeamId: CID3,
      kickoffAt: "2025-06-01T18:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects same team on both sides", () => {
    const result = createMatchSchema.safeParse({
      tournamentId: CID1,
      homeTeamId: CID2,
      awayTeamId: CID2,
      kickoffAt: "2025-06-01T18:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid match status", () => {
    const result = createMatchSchema.safeParse({
      tournamentId: CID1,
      homeTeamId: CID2,
      awayTeamId: CID3,
      kickoffAt: "2025-06-01T18:00:00Z",
      status: "SUPER_LIVE",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateScoreSchema", () => {
  it("accepts valid scores", () => {
    const result = updateScoreSchema.safeParse({
      matchId: CID1,
      homeScore: 2,
      awayScore: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative scores", () => {
    const result = updateScoreSchema.safeParse({
      matchId: CID1,
      homeScore: -1,
      awayScore: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects scores above MAX_SCORE", () => {
    const result = updateScoreSchema.safeParse({
      matchId: CID1,
      homeScore: MAX_SCORE + 1,
      awayScore: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects float scores", () => {
    const result = updateScoreSchema.safeParse({
      matchId: CID1,
      homeScore: 1.5,
      awayScore: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("addMatchEventSchema", () => {
  it("accepts valid event", () => {
    const result = addMatchEventSchema.safeParse({
      matchId: CID1,
      playerId: CID2,
      teamId: CID3,
      type: "GOAL",
      minute: 45,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid event type", () => {
    const result = addMatchEventSchema.safeParse({
      matchId: CID1,
      playerId: CID2,
      teamId: CID3,
      type: "SUPER_GOAL",
      minute: 45,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative minute", () => {
    const result = addMatchEventSchema.safeParse({
      matchId: CID1,
      playerId: CID2,
      teamId: CID3,
      type: "GOAL",
      minute: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects minute > 120", () => {
    const result = addMatchEventSchema.safeParse({
      matchId: CID1,
      playerId: CID2,
      teamId: CID3,
      type: "GOAL",
      minute: 121,
    });
    expect(result.success).toBe(false);
  });
});

describe("setTeamSquadSchema", () => {
  it("accepts valid squad", () => {
    const result = setTeamSquadSchema.safeParse({
      matchId: CID1,
      teamId: CID2,
      playerIds: [CID3],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty player list", () => {
    const result = setTeamSquadSchema.safeParse({
      matchId: CID1,
      teamId: CID2,
      playerIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects > 20 players", () => {
    const ids = Array.from({ length: 21 }, (_, i) => `c${String(i).padStart(25, "0")}`);
    const result = setTeamSquadSchema.safeParse({
      matchId: CID1,
      teamId: CID2,
      playerIds: ids,
    });
    expect(result.success).toBe(false);
  });
});

describe("setTeamLineupSchema", () => {
  it("accepts valid lineup", () => {
    const result = setTeamLineupSchema.safeParse({
      squadId: CID1,
      starterIds: [CID2],
    });
    expect(result.success).toBe(true);
  });

  it("rejects > 11 starters", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `c${String(i).padStart(25, "0")}`);
    const result = setTeamLineupSchema.safeParse({
      squadId: CID1,
      starterIds: ids,
    });
    expect(result.success).toBe(false);
  });
});

describe("confirmSquadSchema", () => {
  it("accepts valid status", () => {
    const result = confirmSquadSchema.safeParse({
      squadId: CID1,
      status: "CONFIRMED",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = confirmSquadSchema.safeParse({
      squadId: CID1,
      status: "MAYBE",
    });
    expect(result.success).toBe(false);
  });
});
