import { prisma } from "@/lib/prisma";
import { getFeaturedTournament } from "@/lib/stats";
import { getFormationSlots } from "@/lib/formations";
import { LINEUP_SIZE } from "@/lib/team-of-week";
import type { Result, TeamOfTheWeekSlotVM, TeamOfTheWeekVM } from "@/lib/types";

function buildSlots(
  formation: string,
  rows: {
    positionSlot: string;
    captain: boolean;
    player: {
      id: string;
      photoUrl: string | null;
      jerseyNumber: number | null;
      rating: number | null;
      user: { fullName: string };
      memberships: { team: { id: string; name: string; shortName: string; crestUrl: string | null } }[];
    };
  }[]
): TeamOfTheWeekSlotVM[] {
  const slotDefs = getFormationSlots(formation);
  const slotMap = new Map(slotDefs.map((s) => [s.key, s]));

  return rows
    .map((slot) => {
      const def = slotMap.get(slot.positionSlot);
      const team = slot.player.memberships[0]?.team ?? null;
      if (!def || !team) return null;
      return {
        positionSlot: slot.positionSlot,
        label: def.label,
        band: def.band,
        captain: slot.captain,
        player: {
          playerId: slot.player.id,
          name: slot.player.user.fullName,
          photoUrl: slot.player.photoUrl,
          jerseyNumber: slot.player.jerseyNumber,
          rating: slot.player.rating ?? 0,
          team: {
            id: team.id,
            name: team.name,
            shortName: team.shortName,
            crestUrl: team.crestUrl,
          },
        },
      } satisfies TeamOfTheWeekSlotVM;
    })
    .filter((slot): slot is TeamOfTheWeekSlotVM => slot !== null);
}

/**
 * The latest saved Team of the Week for the featured tournament (falling back
 * to the latest week overall). Slots are ordered by their pitch band so the
 * renderer can draw a real formation.
 */
export async function getTeamOfTheWeek(): Promise<Result<TeamOfTheWeekVM>> {
  try {
    const featured = await getFeaturedTournament();
    const where =
      featured.status === "success"
        ? { tournamentId: featured.data.id }
        : {};

    const week = await prisma.teamOfTheWeek.findFirst({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tournament: { select: { name: true } },
        slots: {
          orderBy: { sortOrder: "asc" },
          include: {
            player: {
              include: {
                user: { select: { fullName: true } },
                memberships: {
                  where: { status: "ACTIVE" },
                  include: { team: { select: { id: true, name: true, shortName: true, crestUrl: true } } },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!week) return { status: "empty" };

    const slots = buildSlots(week.formation, week.slots);
    if (slots.length < LINEUP_SIZE) return { status: "empty" };

    return {
      status: "success",
      data: {
        id: week.id,
        weekLabel: week.weekLabel,
        formation: week.formation,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        tournamentName: week.tournament.name,
        managerName: week.managerName,
        managerPhotoUrl: week.managerPhotoUrl,
        slots,
      },
    };
  } catch (error) {
    console.error("[getTeamOfTheWeek]", error);
    return { status: "error", message: "تعذّر تحميل فريق الأسبوع." };
  }
}