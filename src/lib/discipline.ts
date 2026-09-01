import { prisma } from "@/lib/prisma";

/**
 * Discipline (سجل الانضباط) — the single source of truth for bookings and
 * automatic suspensions.
 *
 * Rules implemented here match the league charter:
 *  - a YELLOW_CARD event contributes to a one-match ban as soon as the player
 *    collects their 2nd yellow across TWO DIFFERENT matches;
 *  - a RED_CARD event bans the player for the very next match immediately;
 *  - the ban is served automatically once the team's next match is played
 *    (the required calendar match counter advances), so a player is only ever
 *    reported "موقوف" while his team still has that very next fixture ahead;
 *  - CANCELLED fixtures are ignored entirely (they neither count as matches
 *    nor consume a suspension), and LIVE/HALFTIME matches do not yet count as
 *    played for the suspension counter.
 *
 * Booking totals (الكروت column) count YELLOW_CARD / RED_CARD events inside
 * FINISHED matches only, because that is when cards actually "stand".
 */

export const CARD_TYPES = ["YELLOW_CARD", "RED_CARD"] as const;

export const CARD_TYPE_SET = new Set<string>(CARD_TYPES);

export type SuspensionReason = "RED" | "SECOND_YELLOW";

export interface SuspensionResult {
  suspendedNext: boolean;
  reason: SuspensionReason | null;
}

export interface MatchFixture {
  id: string;
  status: string;
}

/**
 * Pure resume of the suspension rules — no DB access, so it is unit-testable.
 *
 * `playerEvents` maps matchId -> card counts for ONE player inside that match.
 * Fixtures must be passed already ordered by kickoff time (ascending).
 */
export function computeSuspension(
  fixtures: MatchFixture[],
  playerEvents: Map<string, { yellows: number; reds: number }>
): SuspensionResult {
  const active = fixtures.filter(
    (m) => m.status !== "CANCELLED"
  );

  let yellowTally = 0;
  let blockedIndex: number | null = null;
  let reason: SuspensionReason | null = null;

  for (let i = 0; i < active.length; i++) {
    // The ban lands exactly on the calendar fixture right after the card.
    const at = active[i] as NonNullable<(typeof active)[number]>;
    if (blockedIndex === i) {
      // The fixture holding the ban was actually PLAYED -> suspension served.
      if (at.status === "FINISHED") {
        blockedIndex = null;
        yellowTally = 0;
        reason = null;
        continue;
      }
      // The banned fixture is still upcoming -> the player stays suspended
      // for it; nothing that comes later can change that.
      break;
    }

    const fixture = at;
    if (fixture.status === "FINISHED") {
      const events = playerEvents.get(fixture.id);
      const matchYellows = Math.min(events?.yellows ?? 0, 1);
      const sawRed = (events?.reds ?? 0) > 0;

      yellowTally += matchYellows;

      if (sawRed) {
        blockedIndex = i + 1;
        reason = "RED";
        yellowTally = 0;
      } else if (yellowTally >= 2) {
        blockedIndex = i + 1;
        reason = "SECOND_YELLOW";
        yellowTally = 0;
      }
    }
  }

  const target =
    blockedIndex !== null && blockedIndex < active.length
      ? active[blockedIndex]
      : null;

  if (target && target.status !== "FINISHED") {
    return { suspendedNext: true, reason };
  }

  return { suspendedNext: false, reason: null };
}

export interface PlayerDisciplineData {
  yellows: number;
  reds: number;
  suspendedNext: boolean;
  reason: SuspensionReason | null;
}

export interface TeamDisciplineResult {
  byPlayer: Map<string, PlayerDisciplineData>;
  /** The team's next fixture still to be played (null when none is left). */
  nextFixture: { id: string; kickoffAt: Date; venue: string | null } | null;
}

/**
 * Discipline + suspension data for a whole team's players in ONE pass.
 * Booking totals only count FINISHED matches; the suspension resume walks
 * every non-cancelled fixture in kickoff order.
 */
export async function getTeamDiscipline(
  teamId: string,
  playerIds: string[]
): Promise<TeamDisciplineResult> {
  const uniqueIds = [...new Set(playerIds)];
  if (uniqueIds.length === 0) {
    return { byPlayer: new Map(), nextFixture: null };
  }

  const fixtures = await prisma.match.findMany({
    where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
    orderBy: { kickoffAt: "asc" },
    select: { id: true, status: true, kickoffAt: true, venue: true },
  });

  const fixtureIds = fixtures.map((f) => f.id);
  const events =
    fixtureIds.length > 0
      ? await prisma.matchEvent.findMany({
          where: {
            matchId: { in: fixtureIds },
            playerId: { in: uniqueIds },
            type: { in: [...CARD_TYPES] },
          },
          select: { matchId: true, playerId: true, type: true },
        })
      : [];

  const finishedIds = new Set(
    fixtures
      .filter((f) => f.status === "FINISHED")
      .map((f) => f.id)
  );

  const nextFixture =
    fixtures.find((f) => f.status === "SCHEDULED" || f.status === "POSTPONED") ??
    null;

  const eventsByPlayer = new Map<
    string,
    Map<string, { yellows: number; reds: number }>
  >();
  const totalsByPlayer = new Map<string, { yellows: number; reds: number }>();

  for (const pid of uniqueIds) {
    eventsByPlayer.set(pid, new Map());
    totalsByPlayer.set(pid, { yellows: 0, reds: 0 });
  }

  for (const ev of events) {
    const perMatch = eventsByPlayer.get(ev.playerId);
    if (!perMatch) continue;

    const bucket = perMatch.get(ev.matchId) ?? { yellows: 0, reds: 0 };
    if (ev.type === "YELLOW_CARD") bucket.yellows++;
    if (ev.type === "RED_CARD") bucket.reds++;
    perMatch.set(ev.matchId, bucket);

    if (finishedIds.has(ev.matchId)) {
      const total = totalsByPlayer.get(ev.playerId);
      if (total) {
        if (ev.type === "YELLOW_CARD") total.yellows++;
        if (ev.type === "RED_CARD") total.reds++;
      }
    }
  }

  const byPlayer = new Map<string, PlayerDisciplineData>();
  for (const pid of uniqueIds) {
    const total = totalsByPlayer.get(pid) ?? { yellows: 0, reds: 0 };
    const suspension = computeSuspension(
      fixtures,
      eventsByPlayer.get(pid) ?? new Map()
    );
    byPlayer.set(pid, {
      yellows: total.yellows,
      reds: total.reds,
      suspendedNext: suspension.suspendedNext,
      reason: suspension.reason,
    });
  }

  return {
    byPlayer,
    nextFixture: nextFixture
      ? { id: nextFixture.id, kickoffAt: nextFixture.kickoffAt, venue: nextFixture.venue }
      : null,
  };
}

/**
 * Convenience for single-player pages (player profile): reuses the team-scope
 * query so player page and team page always agree.
 */
export async function getPlayerDiscipline(
  playerId: string,
  teamId: string | null
): Promise<PlayerDisciplineData & { nextFixture: { id: string; kickoffAt: Date; venue: string | null } | null }> {
  if (!teamId) {
    return { yellows: 0, reds: 0, suspendedNext: false, reason: null, nextFixture: null };
  }
  const result = await getTeamDiscipline(teamId, [playerId]);
  return {
    ...(result.byPlayer.get(playerId) ?? {
      yellows: 0,
      reds: 0,
      suspendedNext: false,
      reason: null,
    }),
    nextFixture: result.nextFixture,
  };
}

export interface SuspendedPlayerRow {
  playerId: string;
  playerName: string;
  jerseyNumber: number | null;
  teamId: string;
  teamName: string;
  reason: SuspensionReason;
  yellows: number;
  reds: number;
  nextFixtureId: string | null;
  nextFixtureKickoffAt: Date | null;
}

/**
 * Every player currently suspended for their team's next fixture — feeds the
 * admin "قائمة الموقوفين" page.
 */
export async function getSuspendedPlayers(): Promise<SuspendedPlayerRow[]> {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      memberships: {
        where: { status: "ACTIVE" },
        select: {
          player: {
            select: {
              id: true,
              jerseyNumber: true,
              user: { select: { fullName: true } },
            },
          },
        },
      },
    },
  });

  const teamIds = teams.map((t) => t.id);

  const fixtures = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
    },
    orderBy: { kickoffAt: "asc" },
    select: {
      id: true,
      status: true,
      homeTeamId: true,
      awayTeamId: true,
      kickoffAt: true,
      venue: true,
    },
  });

  const fixtureIds = fixtures.map((f) => f.id);

  const events =
    fixtureIds.length > 0
      ? await prisma.matchEvent.findMany({
          where: {
            matchId: { in: fixtureIds },
            type: { in: [...CARD_TYPES] },
          },
          select: { matchId: true, playerId: true, type: true },
        })
      : [];

  const finishedIds = new Set(
    fixtures.filter((f) => f.status === "FINISHED").map((f) => f.id)
  );

  const fixturesByTeam = new Map<string, (typeof fixtures)[number][]>();
  for (const teamId of teamIds) {
    fixturesByTeam.set(
      teamId,
      fixtures.filter((f) => f.homeTeamId === teamId || f.awayTeamId === teamId)
    );
  }

  const eventsByPlayer = new Map<string, Map<string, { yellows: number; reds: number }>>();
  const totalsByPlayer = new Map<string, { yellows: number; reds: number }>();
  for (const team of teams) {
    for (const membership of team.memberships) {
      const pid = membership.player.id;
      if (!eventsByPlayer.has(pid)) {
        eventsByPlayer.set(pid, new Map());
        totalsByPlayer.set(pid, { yellows: 0, reds: 0 });
      }
    }
  }

  for (const ev of events) {
    const perMatch = eventsByPlayer.get(ev.playerId);
    if (!perMatch) continue;
    const bucket = perMatch.get(ev.matchId) ?? { yellows: 0, reds: 0 };
    if (ev.type === "YELLOW_CARD") bucket.yellows++;
    if (ev.type === "RED_CARD") bucket.reds++;
    perMatch.set(ev.matchId, bucket);
    if (finishedIds.has(ev.matchId)) {
      const total = totalsByPlayer.get(ev.playerId);
      if (total && ev.type === "YELLOW_CARD") total.yellows++;
      if (total && ev.type === "RED_CARD") total.reds++;
    }
  }

  const rows: SuspendedPlayerRow[] = [];
  for (const team of teams) {
    const teamFixtureList = fixturesByTeam.get(team.id) ?? [];
    const nextFixture =
      teamFixtureList.find((f) => f.status === "SCHEDULED" || f.status === "POSTPONED") ?? null;

    for (const membership of team.memberships) {
      const pid = membership.player.id;
      const total = totalsByPlayer.get(pid) ?? { yellows: 0, reds: 0 };
      const suspension = computeSuspension(teamFixtureList, eventsByPlayer.get(pid) ?? new Map());
      if (!suspension.suspendedNext || !suspension.reason) continue;
      rows.push({
        playerId: pid,
        playerName: membership.player.user.fullName,
        jerseyNumber: membership.player.jerseyNumber,
        teamId: team.id,
        teamName: team.name,
        reason: suspension.reason,
        yellows: total.yellows,
        reds: total.reds,
        nextFixtureId: nextFixture?.id ?? null,
        nextFixtureKickoffAt: nextFixture?.kickoffAt ?? null,
      });
    }
  }

  return rows;
}