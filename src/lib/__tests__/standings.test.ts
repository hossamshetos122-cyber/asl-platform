import { describe, it, expect } from "vitest";
import { computeStandings } from "@/lib/stats";
import type { Match, Team } from "@prisma/client";

type FINISHED = Match & { homeTeam: Team; awayTeam: Team };

const team = (id: string, name: string, shortName: string): Team =>
  ({
    id,
    name,
    shortName,
    crestUrl: null,
  }) as unknown as Team;

const finishedMatch = (
  home: Team,
  away: Team,
  homeScore: number,
  awayScore: number,
): FINISHED =>
  ({
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeScore,
    awayScore,
    homeTeam: home,
    awayTeam: away,
  }) as unknown as FINISHED;

describe("computeStandings", () => {
  it("computes points / W / D / L / GF / GA and orders by points", () => {
    const a = team("team-a", "الفريق الأول", "A");
    const b = team("team-b", "الفريق الثاني", "B");
    const c = team("team-c", "الفريق الثالث", "C");

    const rows = computeStandings([
      finishedMatch(a, b, 2, 1),
      finishedMatch(c, a, 1, 0),
      finishedMatch(b, c, 1, 1),
    ]);

    expect(rows.map((r) => r.team.name)).toEqual(["الفريق الثالث", "الفريق الأول", "الفريق الثاني"]);

    const rowA = rows.find((r) => r.team.id === a.id)!;
    expect(rowA).toMatchObject({
      played: 2,
      won: 1,
      drawn: 0,
      lost: 1,
      goalsFor: 2,
      goalsAgainst: 2,
      points: 3,
    });

    const rowB = rows.find((r) => r.team.id === b.id)!;
    expect(rowB).toMatchObject({ played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 2, goalsAgainst: 3, points: 1 });

    // ranks are consecutive and 1-based
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("breaks ties by goal difference", () => {
    const a = team("team-a", "الأول", "A");
    const b = team("team-b", "الثاني", "B");
    const c = team("team-c", "الثالث", "C");
    const d = team("team-d", "الرابع", "D");

    const rows = computeStandings([
      finishedMatch(a, c, 3, 0), // A: 3pts, +3
      finishedMatch(b, d, 1, 0), // B: 3pts, +1
    ]);

    // D and C both sit on 0 pts; D has the better goal difference (-1 vs -3).
    expect(rows.map((r) => r.team.id)).toEqual([a.id, b.id, d.id, c.id]);
  });

  it("breaks points+GD ties by goals scored", () => {
    const a = team("team-a", "الأول", "A");
    const b = team("team-b", "الثاني", "B");
    const c = team("team-c", "الثالث", "C");
    const d = team("team-d", "الرابع", "D");

    const rows = computeStandings([
      finishedMatch(a, c, 3, 2), // GD +1, GF 3
      finishedMatch(b, d, 1, 0), // GD +1, GF 1
    ]);

    expect(rows[0]!.team.id).toBe(a.id);
    expect(rows[1]!.team.id).toBe(b.id);
  });

  it("breaks points+GD+GF ties by head-to-head", () => {
    // A 1-0 B; A 0-1 E; B 1-0 F  →  A and B tie on 3 pts, GD 0, GF 1,
    // but A won the mutual fixture with B so A ranks above B even though the
    // third team E sits higher on goal difference.
    const a = team("team-a", "الأول", "A");
    const b = team("team-b", "الثاني", "B");
    const e = team("team-e", "الخامس", "E");
    const f = team("team-f", "السادس", "F");

    const rows = computeStandings([
      finishedMatch(a, b, 1, 0),
      finishedMatch(a, e, 0, 1),
      finishedMatch(b, f, 1, 0),
    ]);

    const rowA = rows.find((r) => r.team.id === a.id)!;
    const rowB = rows.find((r) => r.team.id === b.id)!;

    // identical core stats -> the tie is broken on H2H only
    expect(rowA.points).toBe(rowB.points);
    expect(rowA.goalsFor - rowA.goalsAgainst).toBe(rowB.goalsFor - rowB.goalsAgainst);
    expect(rowA.goalsFor).toBe(rowB.goalsFor);
    expect(rowA.rank).toBeLessThan(rowB.rank);
  });

  it("respects the limit parameter", () => {
    const a = team("team-a", "أ", "A");
    const b = team("team-b", "ب", "B");
    const c = team("team-c", "ج", "C");

    const rows = computeStandings(
      [
        finishedMatch(a, b, 2, 1),
        finishedMatch(c, a, 1, 0),
        finishedMatch(b, c, 1, 1),
      ],
      2,
    );

    expect(rows.length).toBe(2);
    expect(rows.map((r) => r.rank)).toEqual([1, 2]);
  });

  it("is deterministic for identical inputs", () => {
    const a = team("team-a", "أ", "A");
    const b = team("team-b", "ب", "B");

    const first = computeStandings([finishedMatch(a, b, 2, 1)]);
    const second = computeStandings([finishedMatch(a, b, 2, 1)]);

    expect(first).toEqual(second);
  });
});