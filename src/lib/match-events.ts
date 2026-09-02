/**
 * Pure helpers for building match goal events. Kept free of Prisma so the
 * own-goal / penalty semantics can be unit-tested without a database.
 */

export type GoalEventType = "GOAL" | "PENALTY_SCORED" | "OWN_GOAL";

export interface GoalEventInput {
  playerId: string;
  teamId: string;
  type: GoalEventType;
  minute: number;
}

export function clampMinute(m: number): number {
  if (typeof m !== "number" || Number.isNaN(m)) return 0;
  return Math.min(120, Math.max(0, Math.round(m)));
}

/**
 * Build a single goal event for a team's credited goal list.
 *
 * - A normal / penalty goal is scored by a player of the credited team, so the
 *   event's teamId is the credited team.
 * - An own goal is scored by a player of the *opposing* team into their own
 *   net: the goal counts toward the credited team's score, but the event's
 *   teamId is the scorer's club (the conceding side) so the timeline and the
 *   player's club attribution stay correct. Own goals never count toward any
 *   scorer's tally (see GOAL_EVENT_TYPES in src/lib/stats.ts).
 */
export function buildGoalEvent(args: {
  playerId: string;
  creditedTeamId: string;
  opponentTeamId: string;
  minute: number;
  own: boolean;
  penalty: boolean;
}): GoalEventInput {
  const type: GoalEventType = args.own
    ? "OWN_GOAL"
    : args.penalty
      ? "PENALTY_SCORED"
      : "GOAL";
  const teamId = args.own ? args.opponentTeamId : args.creditedTeamId;
  return {
    playerId: args.playerId,
    teamId,
    type,
    minute: clampMinute(args.minute),
  };
}

/**
 * The team a player selected for a given credited goal slot must belong to:
 * the credited team for normal/penalty goals, the opposing team for own goals.
 */
export function expectedGoalScorerTeam(args: {
  own: boolean;
  creditedTeamId: string;
  opponentTeamId: string;
}): string {
  return args.own ? args.opponentTeamId : args.creditedTeamId;
}