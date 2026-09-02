import { prisma } from "@/lib/prisma";
import { getFeaturedTournamentId } from "@/lib/stats";
import { FORMATIONS } from "@/lib/formations";
import { TeamOfWeekForm } from "./team-of-week-form";

export const metadata = {
  title: "فريق الأسبوع | لوحة التحكم",
};

export default async function AdminTeamOfWeekPage() {
  const [tournaments, players, featureResult, latestWeek, history] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      select: { id: true, name: true, status: true },
    }),
    prisma.player.findMany({
      where: { memberships: { some: { status: "ACTIVE" } } },
      include: {
        user: { select: { fullName: true } },
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            team: { select: { id: true, name: true, shortName: true, crestUrl: true } },
          },
          take: 1,
        },
      },
      orderBy: { user: { fullName: "asc" } },
    }),
    getFeaturedTournamentId(),
    prisma.teamOfTheWeek.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        slots: {
          orderBy: { sortOrder: "asc" },
          select: { playerId: true, positionSlot: true, captain: true },
        },
      },
    }),
    prisma.teamOfTheWeek.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { _count: { select: { slots: true } } },
    }),
  ]);

  const candidates = players
    .map((p) => {
      const team = p.memberships[0]?.team ?? null;
      if (!team) return null;
      return {
        playerId: p.id,
        name: p.user.fullName,
        photoUrl: p.photoUrl,
        jerseyNumber: p.jerseyNumber,
        rating: p.rating,
        teamId: team.id,
        teamName: team.name,
        shortName: team.shortName,
        crestUrl: team.crestUrl,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h1 className="font-display text-xl font-black text-text">فريق الأسبوع</h1>
          <p className="mt-1 font-body text-[11px] text-text-dimmer">
            اختر التشكيلة والتقييمات وقصّها على الملعب زي FIFA Ultimate Team
          </p>
        </div>
        <span className="badge-accent font-num">TOTW</span>
      </div>

      <TeamOfWeekForm
        tournaments={tournaments.map((t) => ({ id: t.id, name: t.name, status: t.status }))}
        featuredTournamentId={featureResult.status === "success" ? featureResult.data : null}
        candidates={candidates}
        formations={FORMATIONS.map((f) => f.key)}
        latestWeek={
          latestWeek
            ? {
                id: latestWeek.id,
                weekLabel: latestWeek.weekLabel,
                weekStart: latestWeek.weekStart,
                weekEnd: latestWeek.weekEnd,
                formation: latestWeek.formation,
                tournamentId: latestWeek.tournamentId,
                managerName: latestWeek.managerName,
                managerPhotoUrl: latestWeek.managerPhotoUrl,
                slots: latestWeek.slots.map((s) => ({
                  playerId: s.playerId,
                  positionSlot: s.positionSlot,
                  captain: s.captain,
                })),
              }
            : null
        }
        history={history.map((h) => ({
          id: h.id,
          weekLabel: h.weekLabel,
          formation: h.formation,
          createdAt: h.createdAt,
          slotCount: h._count.slots,
        }))}
      />
    </div>
  );
}