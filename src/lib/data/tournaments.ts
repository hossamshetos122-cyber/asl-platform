import { prisma } from "@/lib/prisma";
import type { Result, TournamentSummaryVM, TournamentDetailVM } from "@/lib/types";

export async function getTournaments(): Promise<Result<TournamentSummaryVM[]>> {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { startDate: "desc" },
      include: { _count: { select: { teams: true } } },
    });

    if (tournaments.length === 0) {
      return { status: "empty" };
    }

    const vms: TournamentSummaryVM[] = tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      format: t.format,
      status: t.status,
      startDate: t.startDate,
      endDate: t.endDate,
      teamCount: t._count.teams,
    }));

    return { status: "success", data: vms };
  } catch (error) {
    console.error("[getTournaments]", error);
    return { status: "error", message: "تعذّر تحميل البطولات." };
  }
}

export async function getTournamentById(id: string): Promise<Result<TournamentDetailVM>> {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          include: { team: true },
        },
      },
    });

    if (!tournament) {
      return { status: "empty" };
    }

    const vm: TournamentDetailVM = {
      id: tournament.id,
      name: tournament.name,
      format: tournament.format,
      status: tournament.status,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      teams: tournament.teams.map((tt) => ({
        id: tt.team.id,
        name: tt.team.name,
        shortCode: tt.team.shortName,
        crestUrl: tt.team.crestUrl,
      })),
    };

    return { status: "success", data: vm };
  } catch (error) {
    console.error("[getTournamentById]", error);
    return { status: "error", message: "تعذّر تحميل تفاصيل البطولة." };
  }
}
