import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NEW_TEAMS = [
  { id: "team-kanaya", name: "الكانيلات", shortName: "كن", city: "الإسكندرية" },
  { id: "team-gomrok", name: "الجمرك", shortName: "جر", city: "الإسكندرية" },
  { id: "team-bahari", name: "البحري", shortName: "بح", city: "الإسكندرية" },
  { id: "team-wardian", name: "الورديان", shortName: "ور", city: "الإسكندرية" },
  { id: "team-azmout", name: "العزموط", shortName: "عز", city: "الإسكندرية" },
  { id: "team-dakhel", name: "الدخيلة", shortName: "دخ", city: "الإسكندرية" },
  { id: "team-mamoura", name: "المعمورة", shortName: "مع", city: "الإسكندرية" },
  { id: "team-saba", name: "سبا", shortName: "سبا", city: "الإسكندرية" },
  { id: "team-rike", name: "ريكي", shortName: "ري", city: "الإسكندرية" },
  { id: "team-mahmoudia", name: "المحمودية", shortName: "مح", city: "الإسكندرية" },
];

function crest(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d4a843&color=1a1a2e&size=400&bold=true&font-size=0.4`;
}

export async function POST() {
  try {
    const user = await requireAdmin();

    const league = await prisma.tournament.findFirst({
      where: { status: "ONGOING" },
      select: { id: true },
    });

    let added = 0;
    for (const team of NEW_TEAMS) {
      const existing = await prisma.team.findUnique({ where: { id: team.id } });
      if (existing) continue;

      await prisma.team.create({
        data: {
          id: team.id,
          name: team.name,
          shortName: team.shortName,
          city: team.city,
          crestUrl: crest(team.name),
        },
      });

      if (league) {
        await prisma.tournamentTeam.create({
          data: { tournamentId: league.id, teamId: team.id },
        }).catch(() => {});
      }

      added++;
    }

    const totalTeams = await prisma.team.count();

    return NextResponse.json({
      ok: true,
      added,
      total: totalTeams,
      message: `تمت إضافة ${added} فريق. الإجمالي: ${totalTeams} فريق`,
    });
  } catch (error) {
    console.error("[admin/seed]", error);
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
