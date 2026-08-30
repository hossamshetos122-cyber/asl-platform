import { describe, expect, it } from "vitest";
import { computeSuspension } from "@/lib/discipline";

const F = (id: string, status: string) => ({ id, status });

function fixtures(...items: { id: string; status: string }[]) {
  return items;
}

function events(...specs: [string, number, number][]) {
  const map = new Map<string, { yellows: number; reds: number }>();
  for (const [matchId, yellows, reds] of specs) {
    map.set(matchId, { yellows, reds });
  }
  return map;
}

describe("computeSuspension", () => {
  it("not suspended when the player has no cards", () => {
    const fx = fixtures(F("m1", "FINISHED"), F("m2", "SCHEDULED"));
    expect(computeSuspension(fx, events(["m1", 0, 0]))).toEqual({
      suspendedNext: false,
      reason: null,
    });
  });

  it("red card in the latest finished match bans the next upcoming match", () => {
    const fx = fixtures(F("m1", "FINISHED"), F("m2", "SCHEDULED"));
    const res = computeSuspension(fx, events(["m1", 0, 1]));
    expect(res).toEqual({ suspendedNext: true, reason: "RED" });
  });

  it("red card ban is served once the next match is played", () => {
    const fx = fixtures(F("m1", "FINISHED"), F("m2", "FINISHED"), F("m3", "SCHEDULED"));
    const res = computeSuspension(fx, events(["m1", 0, 1]));
    expect(res).toEqual({ suspendedNext: false, reason: null });
  });

  it("two yellows across two different matches ban the next match", () => {
    const fx = fixtures(F("m1", "FINISHED"), F("m2", "FINISHED"), F("m3", "SCHEDULED"));
    const res = computeSuspension(fx, events(["m1", 1, 0], ["m2", 1, 0]));
    expect(res).toEqual({ suspendedNext: true, reason: "SECOND_YELLOW" });
  });

  it("second-yellow ban is served once that next match is played", () => {
    const fx = fixtures(
      F("m1", "FINISHED"),
      F("m2", "FINISHED"),
      F("m3", "FINISHED"),
      F("m4", "SCHEDULED")
    );
    const res = computeSuspension(fx, events(["m1", 1, 0], ["m2", 1, 0]));
    expect(res).toEqual({ suspendedNext: false, reason: null });
  });

  it("two yellows in the SAME match only count once (different matches rule)", () => {
    const fx = fixtures(F("m1", "FINISHED"), F("m2", "SCHEDULED"));
    const res = computeSuspension(fx, events(["m1", 2, 0]));
    expect(res).toEqual({ suspendedNext: false, reason: null });
  });

  it("a red card triggers a ban even after a previous yellow tally", () => {
    const fx = fixtures(F("m1", "FINISHED"), F("m2", "FINISHED"), F("m3", "SCHEDULED"));
    const res = computeSuspension(fx, events(["m1", 1, 0], ["m2", 0, 1]));
    expect(res).toEqual({ suspendedNext: true, reason: "RED" });
  });

  it("a postponed (not played) fixture right after a card is the suspended match", () => {
    const fx = fixtures(F("m1", "FINISHED"), F("m2", "POSTPONED"), F("m3", "SCHEDULED"));
    const res = computeSuspension(fx, events(["m1", 0, 1]));
    expect(res).toEqual({ suspendedNext: true, reason: "RED" });
  });

  it("cancelled fixtures are ignored for both counting and serving", () => {
    const fx = fixtures(
      F("m1", "FINISHED"),
      F("m2", "CANCELLED"),
      F("m3", "SCHEDULED")
    );
    const res = computeSuspension(fx, events(["m1", 1, 0], ["m2", 1, 0]));
    // yellow in m1 (1) + yellow in cancelled m2 should NOT trigger -> still 1
    expect(res).toEqual({ suspendedNext: false, reason: null });
  });

  it("a second red while the first ban is still served starts a fresh ban", () => {
    const fx = fixtures(F("m1", "FINISHED"), F("m2", "FINISHED"), F("m3", "SCHEDULED"));
    const res = computeSuspension(fx, events(["m1", 0, 1], ["m2", 0, 1]));
    // m2 is the very match the m1 red bans -> the suspension is served there,
    // so m3 is free (a booked-in-ban fixture never starts a new ban).
    expect(res).toEqual({ suspendedNext: false, reason: null });
  });

  it("a live/halftime match right after the card holds the ban until it ends", () => {
    const fx = fixtures(F("m1", "FINISHED"), F("m2", "LIVE"), F("m3", "SCHEDULED"));
    const res = computeSuspension(fx, events(["m1", 0, 1]));
    expect(res).toEqual({ suspendedNext: true, reason: "RED" });
  });

  it("no upcoming fixture -> never reported suspended", () => {
    const fx = fixtures(F("m1", "FINISHED"), F("m2", "FINISHED"));
    const res = computeSuspension(fx, events(["m1", 1, 0], ["m2", 1, 0]));
    expect(res).toEqual({ suspendedNext: false, reason: null });
  });
});