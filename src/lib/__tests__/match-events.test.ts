import { describe, it, expect } from "vitest";
import {
  buildGoalEvent,
  expectedGoalScorerTeam,
  clampMinute,
} from "@/lib/match-events";
import { GOAL_EVENT_TYPES, ASSIST_EVENT_TYPE } from "@/lib/stats";

describe("buildGoalEvent", () => {
  const base = {
    playerId: "p_b",
    creditedTeamId: "team_a",
    opponentTeamId: "team_b",
    minute: 33,
  };

  it("records a normal goal for the credited team", () => {
    const event = buildGoalEvent({ ...base, own: false, penalty: false });
    expect(event).toEqual({
      playerId: "p_b",
      teamId: "team_a",
      type: "GOAL",
      minute: 33,
    });
  });

  it("records a penalty for the credited team", () => {
    const event = buildGoalEvent({ ...base, own: false, penalty: true });
    expect(event.type).toBe("PENALTY_SCORED");
    expect(event.teamId).toBe("team_a");
  });

  it("records an own goal with the SCORER's club (the conceding side)", () => {
    // Team A 1-0 Team B via a B player's own goal: player belongs to team_b,
    // the goal still counts toward team_a's score but the event's teamId is the
    // scorer's club so the timeline shows it under Team B.
    const event = buildGoalEvent({ ...base, own: true, penalty: false });
    expect(event.type).toBe("OWN_GOAL");
    expect(event.teamId).toBe("team_b");
  });

  it("an own goal is never a penalty", () => {
    const event = buildGoalEvent({ ...base, own: true, penalty: true });
    expect(event.type).toBe("OWN_GOAL");
  });

  it("clamps invalid minutes", () => {
    expect(buildGoalEvent({ ...base, minute: 500, own: false, penalty: false }).minute).toBe(120);
    expect(buildGoalEvent({ ...base, minute: -3, own: false, penalty: false }).minute).toBe(0);
    expect(buildGoalEvent({ ...base, minute: Number.NaN, own: false, penalty: false }).minute).toBe(0);
  });
});

describe("expectedGoalScorerTeam", () => {
  it("uses the credited team for normal goals", () => {
    expect(expectedGoalScorerTeam({ own: false, creditedTeamId: "a", opponentTeamId: "b" })).toBe("a");
  });

  it("uses the opposing team for own goals", () => {
    expect(expectedGoalScorerTeam({ own: true, creditedTeamId: "a", opponentTeamId: "b" })).toBe("b");
  });
});

describe("goal type constants (scorer definitions)", () => {
  it("ONLY GOAL and PENALTY_SCORED count toward a scorer's tally", () => {
    expect([...GOAL_EVENT_TYPES]).toEqual(["GOAL", "PENALTY_SCORED"]);
    expect(GOAL_EVENT_TYPES).not.toContain("OWN_GOAL");
  });

  it("assist definition is ASSIST only", () => {
    expect(ASSIST_EVENT_TYPE).toBe("ASSIST");
  });
});

describe("clampMinute", () => {
  it("rounds and clamps to 0..120", () => {
    expect(clampMinute(10.6)).toBe(11);
    expect(clampMinute(200)).toBe(120);
    expect(clampMinute(-1)).toBe(0);
    expect(clampMinute(0)).toBe(0);
  });
});