import { NextResponse } from "next/server";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface NewTeam {
  name: string;
  shortName: string;
  players: { fullName: string; position: string; jerseyNumber: number }[];
}

const NEW_TEAMS: NewTeam[] = [
  {
    name: "محرم بك", shortName: "مب",
    players: [
      { fullName: "مصطفى ناصر", position: "FORWARD", jerseyNumber: 9 },
      { fullName: "محمد سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { fullName: "أحمد حسين", position: "DEFENDER", jerseyNumber: 4 },
      { fullName: "حسن طارق", position: "FORWARD", jerseyNumber: 11 },
      { fullName: "خالد وليد", position: "MIDFIELDER", jerseyNumber: 8 },
      { fullName: "عمر ناصر", position: "DEFENDER", jerseyNumber: 3 },
      { fullName: "ياسر أحمد", position: "GOALKEEPER", jerseyNumber: 1 },
      { fullName: "سامي حسين", position: "MIDFIELDER", jerseyNumber: 14 },
      { fullName: "طارق محمد", position: "DEFENDER", jerseyNumber: 5 },
      { fullName: "هاني سعيد", position: "FORWARD", jerseyNumber: 17 },
      { fullName: "رامي أحمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { fullName: "نبيل حسين", position: "DEFENDER", jerseyNumber: 2 },
      { fullName: "أسامة طارق", position: "FORWARD", jerseyNumber: 19 },
      { fullName: "ماجد وليد", position: "MIDFIELDER", jerseyNumber: 15 },
      { fullName: "كريم ناصر", position: "DEFENDER", jerseyNumber: 20 },
      { fullName: "finaly عادل", position: "GOALKEEPER", jerseyNumber: 22 },
      { fullName: "عمر سعيد", position: "FORWARD", jerseyNumber: 18 },
      { fullName: "كريم حسين", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    name: "العصافرة", shortName: "عص",
    players: [
      { fullName: "إبراهيم حسين", position: "FORWARD", jerseyNumber: 9 },
      { fullName: "مصطفى أحمد", position: "MIDFIELDER", jerseyNumber: 7 },
      { fullName: "محمد طارق", position: "FORWARD", jerseyNumber: 11 },
      { fullName: "أحمد سعيد", position: "DEFENDER", jerseyNumber: 4 },
      { fullName: "خالد ناصر", position: "MIDFIELDER", jerseyNumber: 8 },
      { fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { fullName: "finaly إبراهيم", position: "GOALKEEPER", jerseyNumber: 1 },
      { fullName: "عمر حسين", position: "MIDFIELDER", jerseyNumber: 14 },
      { fullName: "ياسر ناصر", position: "DEFENDER", jerseyNumber: 5 },
      { fullName: "سامي أحمد", position: "FORWARD", jerseyNumber: 17 },
      { fullName: "طارق سعيد", position: "MIDFIELDER", jerseyNumber: 10 },
      { fullName: "هاني طارق", position: "DEFENDER", jerseyNumber: 2 },
      { fullName: "رامي حسين", position: "FORWARD", jerseyNumber: 19 },
      { fullName: "نبيل أحمد", position: "MIDFIELDER", jerseyNumber: 15 },
      { fullName: "أسامة سعيد", position: "DEFENDER", jerseyNumber: 20 },
      { fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { fullName: "ماجد ناصر", position: "FORWARD", jerseyNumber: 18 },
      { fullName: "كريم وليد", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    name: "بولكلي", shortName: "بو",
    players: [
      { fullName: "ياسر عادل", position: "FORWARD", jerseyNumber: 9 },
      { fullName: "هشام سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { fullName: "محمد ناصر", position: "DEFENDER", jerseyNumber: 4 },
      { fullName: "أحمد حسين", position: "FORWARD", jerseyNumber: 11 },
      { fullName: "خالد طارق", position: "MIDFIELDER", jerseyNumber: 8 },
      { fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { fullName: "finaly ياسر", position: "GOALKEEPER", jerseyNumber: 1 },
      { fullName: "عمر أحمد", position: "MIDFIELDER", jerseyNumber: 14 },
      { fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { fullName: "رامي أحمد", position: "FORWARD", jerseyNumber: 19 },
      { fullName: "نبيل حسين", position: "MIDFIELDER", jerseyNumber: 15 },
      { fullName: "أسامة طارق", position: "DEFENDER", jerseyNumber: 20 },
      { fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { fullName: "ماجد ناصر", position: "FORWARD", jerseyNumber: 18 },
      { fullName: "كريم سعيد", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    name: "جليم", shortName: "جل",
    players: [
      { fullName: "ياسر عادل", position: "FORWARD", jerseyNumber: 9 },
      { fullName: "هشام سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { fullName: "محمد ناصر", position: "DEFENDER", jerseyNumber: 4 },
      { fullName: "أحمد حسين", position: "FORWARD", jerseyNumber: 11 },
      { fullName: "خالد طارق", position: "MIDFIELDER", jerseyNumber: 8 },
      { fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { fullName: "finaly ياسر", position: "GOALKEEPER", jerseyNumber: 1 },
      { fullName: "عمر أحمد", position: "MIDFIELDER", jerseyNumber: 14 },
      { fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { fullName: "رامي أحمد", position: "FORWARD", jerseyNumber: 19 },
      { fullName: "نبيل حسين", position: "MIDFIELDER", jerseyNumber: 15 },
      { fullName: "أسامة أحمد", position: "DEFENDER", jerseyNumber: 20 },
      { fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { fullName: "ماجد طارق", position: "FORWARD", jerseyNumber: 18 },
      { fullName: "كريم حسين", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    name: "كامب شيزار", shortName: "كم",
    players: [
      { fullName: "إبراهيم ناصر", position: "FORWARD", jerseyNumber: 9 },
      { fullName: "مصطفى سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { fullName: "محمد حسين", position: "DEFENDER", jerseyNumber: 4 },
      { fullName: "أحمد طارق", position: "FORWARD", jerseyNumber: 11 },
      { fullName: "خالد وليد", position: "MIDFIELDER", jerseyNumber: 8 },
      { fullName: "حسن أحمد", position: "DEFENDER", jerseyNumber: 3 },
      { fullName: "finaly إبراهيم", position: "GOALKEEPER", jerseyNumber: 1 },
      { fullName: "عمر ناصر", position: "MIDFIELDER", jerseyNumber: 14 },
      { fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { fullName: "هاني أحمد", position: "DEFENDER", jerseyNumber: 2 },
      { fullName: "رامي ناصر", position: "FORWARD", jerseyNumber: 19 },
      { fullName: "نبيل سعيد", position: "MIDFIELDER", jerseyNumber: 15 },
      { fullName: "أسامة حسين", position: "DEFENDER", jerseyNumber: 20 },
      { fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { fullName: "ماجد أحمد", position: "FORWARD", jerseyNumber: 18 },
      { fullName: "كريم طارق", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    name: "زيزينيا", shortName: "زي",
    players: [
      { fullName: "ياسر عادل", position: "FORWARD", jerseyNumber: 9 },
      { fullName: "هشام سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { fullName: "محمد ناصر", position: "DEFENDER", jerseyNumber: 4 },
      { fullName: "أحمد حسين", position: "FORWARD", jerseyNumber: 11 },
      { fullName: "خالد طارق", position: "MIDFIELDER", jerseyNumber: 8 },
      { fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { fullName: "finaly ياسر", position: "GOALKEEPER", jerseyNumber: 1 },
      { fullName: "عمر أحمد", position: "MIDFIELDER", jerseyNumber: 14 },
      { fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { fullName: "رامي أحمد", position: "FORWARD", jerseyNumber: 19 },
      { fullName: "نبيل حسين", position: "MIDFIELDER", jerseyNumber: 15 },
      { fullName: "أسامة طارق", position: "DEFENDER", jerseyNumber: 20 },
      { fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { fullName: "ماجد ناصر", position: "FORWARD", jerseyNumber: 18 },
      { fullName: "كريم سعيد", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    name: "المعمورة", shortName: "مع",
    players: [
      { fullName: "نادر سعيد", position: "FORWARD", jerseyNumber: 9 },
      { fullName: "عماد حسين", position: "MIDFIELDER", jerseyNumber: 7 },
      { fullName: "محمد طارق", position: "DEFENDER", jerseyNumber: 4 },
      { fullName: "أحمد ناصر", position: "FORWARD", jerseyNumber: 11 },
      { fullName: "خالد وليد", position: "MIDFIELDER", jerseyNumber: 8 },
      { fullName: "حسن أحمد", position: "DEFENDER", jerseyNumber: 3 },
      { fullName: "finaly نادر", position: "GOALKEEPER", jerseyNumber: 1 },
      { fullName: "عمر سعيد", position: "MIDFIELDER", jerseyNumber: 14 },
      { fullName: "ياسر حسين", position: "DEFENDER", jerseyNumber: 5 },
      { fullName: "سامي محمد", position: "FORWARD", jerseyNumber: 17 },
      { fullName: "طارق أحمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { fullName: "رامي حسين", position: "FORWARD", jerseyNumber: 19 },
      { fullName: "نبيل سعيد", position: "MIDFIELDER", jerseyNumber: 15 },
      { fullName: "أسامة أحمد", position: "DEFENDER", jerseyNumber: 20 },
      { fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { fullName: "ماجد طارق", position: "FORWARD", jerseyNumber: 18 },
      { fullName: "كريم حسين", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    name: "باكوس", shortName: "با",
    players: [
      { fullName: "وليد عادل", position: "FORWARD", jerseyNumber: 9 },
      { fullName: "فرج سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { fullName: "محمد حسين", position: "DEFENDER", jerseyNumber: 4 },
      { fullName: "أحمد طارق", position: "FORWARD", jerseyNumber: 11 },
      { fullName: "خالد ناصر", position: "MIDFIELDER", jerseyNumber: 8 },
      { fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { fullName: "finaly وليد", position: "GOALKEEPER", jerseyNumber: 1 },
      { fullName: "عمر أحمد", position: "MIDFIELDER", jerseyNumber: 14 },
      { fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { fullName: "رامي أحمد", position: "FORWARD", jerseyNumber: 19 },
      { fullName: "نبيل حسين", position: "MIDFIELDER", jerseyNumber: 15 },
      { fullName: "أسامة طارق", position: "DEFENDER", jerseyNumber: 20 },
      { fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { fullName: "ماجد سعيد", position: "FORWARD", jerseyNumber: 18 },
      { fullName: "كريم ناصر", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    name: "كرموز", shortName: "كر",
    players: [
      { fullName: "إبراهيم حسين", position: "FORWARD", jerseyNumber: 9 },
      { fullName: "مصطفى ناصر", position: "MIDFIELDER", jerseyNumber: 7 },
      { fullName: "محمد سعيد", position: "DEFENDER", jerseyNumber: 4 },
      { fullName: "أحمد وليد", position: "FORWARD", jerseyNumber: 11 },
      { fullName: "خالد طارق", position: "MIDFIELDER", jerseyNumber: 8 },
      { fullName: "حسن أحمد", position: "DEFENDER", jerseyNumber: 3 },
      { fullName: "finaly إبراهيم", position: "GOALKEEPER", jerseyNumber: 1 },
      { fullName: "عمر ناصر", position: "MIDFIELDER", jerseyNumber: 14 },
      { fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { fullName: "طارق أحمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { fullName: "رامي حسين", position: "FORWARD", jerseyNumber: 19 },
      { fullName: "نبيل سعيد", position: "MIDFIELDER", jerseyNumber: 15 },
      { fullName: "أسامة طارق", position: "DEFENDER", jerseyNumber: 20 },
      { fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { fullName: "ماجد أحمد", position: "FORWARD", jerseyNumber: 18 },
      { fullName: "كريم طارق", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    name: "فلمنج", shortName: "فل",
    players: [
      { fullName: "ياسر عادل", position: "FORWARD", jerseyNumber: 9 },
      { fullName: "هشام سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { fullName: "محمد ناصر", position: "DEFENDER", jerseyNumber: 4 },
      { fullName: "أحمد حسين", position: "FORWARD", jerseyNumber: 11 },
      { fullName: "خالد طارق", position: "MIDFIELDER", jerseyNumber: 8 },
      { fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { fullName: "finaly ياسر", position: "GOALKEEPER", jerseyNumber: 1 },
      { fullName: "عمر أحمد", position: "MIDFIELDER", jerseyNumber: 14 },
      { fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { fullName: "رامي أحمد", position: "FORWARD", jerseyNumber: 19 },
      { fullName: "نبيل حسين", position: "MIDFIELDER", jerseyNumber: 15 },
      { fullName: "أسامة طارق", position: "DEFENDER", jerseyNumber: 20 },
      { fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { fullName: "ماجد ناصر", position: "FORWARD", jerseyNumber: 18 },
      { fullName: "كريم سعيد", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
];

function avatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a2e&color=d4a843&size=200&bold=true`;
}

function crest(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d4a843&color=1a1a2e&size=400&bold=true&font-size=0.4`;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function handleSeed() {
  try {
    await requireAdmin();

    const league = await prisma.tournament.findFirst({ where: { status: "ONGOING" }, select: { id: true } });
    if (!league) return NextResponse.json({ error: "لا توجد بطولة نشطة" }, { status: 500 });

    const leagueSeason = await prisma.season.findFirst({ where: { tournamentId: league.id }, select: { id: true } });
    if (!leagueSeason) return NextResponse.json({ error: "لا يوجد موسم" }, { status: 500 });

    const passwordHash = await hashPassword("seed:player:2024");

    let teamsAdded = 0;
    let playersAdded = 0;
    let matchesAdded = 0;

    const teamIdMap: Record<string, string> = {};
    const playerIdMap: Record<string, string> = {};

    for (const team of NEW_TEAMS) {
      const existing = await prisma.team.findFirst({ where: { name: team.name }, select: { id: true } });
      if (existing) {
        teamIdMap[team.name] = existing.id;
        const existingPlayers = await prisma.teamMembership.findMany({
          where: { teamId: existing.id, status: "ACTIVE" },
          select: { playerId: true },
        });
        for (const mp of existingPlayers) {
          const p = await prisma.player.findUnique({ where: { id: mp.playerId }, select: { id: true, user: { select: { fullName: true } } } });
          if (p) playerIdMap[p.user.fullName] = p.id;
        }
        continue;
      }

      const createdTeam = await prisma.team.create({
        data: { name: team.name, shortName: team.shortName, city: "الإسكندرية", crestUrl: crest(team.name) },
      });
      teamIdMap[team.name] = createdTeam.id;
      teamsAdded++;

      await prisma.tournamentTeam.upsert({
        where: { tournamentId_teamId: { tournamentId: league.id, teamId: createdTeam.id } },
        update: {},
        create: { tournamentId: league.id, teamId: createdTeam.id },
      }).catch(() => {});

      for (const p of team.players) {
        const createdUser = await prisma.user.create({
          data: {
            email: `seed_${createdTeam.shortName}_${p.jerseyNumber}@seed.local`,
            passwordHash,
            fullName: p.fullName,
            role: "PLAYER",
          },
        });

        const createdPlayer = await prisma.player.create({
          data: {
            userId: createdUser.id,
            photoUrl: avatar(p.fullName),
            position: p.position as never,
            jerseyNumber: p.jerseyNumber,
          },
        });
        playerIdMap[p.fullName] = createdPlayer.id;
        playersAdded++;

        await prisma.teamMembership.upsert({
          where: { teamId_playerId: { teamId: createdTeam.id, playerId: createdPlayer.id } },
          update: {},
          create: { teamId: createdTeam.id, playerId: createdPlayer.id, status: "ACTIVE", joinedAt: new Date("2024-09-01") },
        }).catch(() => {});
      }
    }

    const newMatchDefs = [
      { home: "محرم بك", away: "العصافرة", hs: 2, as: 1 },
      { home: "بولكلي", away: "جليم", hs: 1, as: 0 },
      { home: "كامب شيزار", away: "زيزينيا", hs: 0, as: 0 },
      { home: "المعمورة", away: "باكوس", hs: 3, as: 2 },
      { home: "كرموز", away: "فلمنج", hs: 1, as: 1 },
      { home: "العصافرة", away: "بولكلي", hs: 2, as: 2 },
      { home: "جليم", away: "كامب شيزار", hs: 1, as: 3 },
      { home: "زيزينيا", away: "المعمورة", hs: 0, as: 1 },
      { home: "باكوس", away: "كرموز", hs: 2, as: 0 },
      { home: "فلمنج", away: "محرم بك", hs: 1, as: 2 },
      { home: "محرم بك", away: "بولكلي", hs: 1, as: 0 },
      { home: "كامب شيزار", away: "العصافرة", hs: 2, as: 1 },
      { home: "المعمورة", away: "جليم", hs: 0, as: 0 },
    ];

    const rounds = ["الأسبوع 1", "الأسبوع 1", "الأسبوع 1", "الأسبوع 1", "الأسبوع 1", "الأسبوع 2", "الأسبوع 2", "الأسبوع 2", "الأسبوع 2", "الأسبوع 2", "الأسبوع 3", "الأسبوع 3", "الأسبوع 3"];

    const seedVenues = ["ملعب كرموز", "ستاد المنتزه", "ملعب النخاطر", "ستاد المنشية", "ستاد الإسكندرية المركزي"];

    const matchIdMap: Record<number, string> = {};

    for (let i = 0; i < newMatchDefs.length; i++) {
      const m = newMatchDefs[i]!;
      const homeId = teamIdMap[m.home];
      const awayId = teamIdMap[m.away];
      if (!homeId || !awayId) continue;

      const existingMatch = await prisma.match.findFirst({
        where: { tournamentId: league.id, homeTeamId: homeId, awayTeamId: awayId },
        select: { id: true },
      });
      if (existingMatch) {
        matchIdMap[i] = existingMatch.id;
        continue;
      }

      const createdMatch = await prisma.match.create({
        data: {
          tournamentId: league.id,
          seasonId: leagueSeason.id,
          homeTeamId: homeId,
          awayTeamId: awayId,
          status: "FINISHED",
          kickoffAt: daysAgo(28 - (i < 5 ? 0 : i < 10 ? 7 : 14)),
          homeScore: m.hs,
          awayScore: m.as,
          round: rounds[i]!,
          venue: seedVenues[i % seedVenues.length]!,
        },
      });
      matchIdMap[i] = createdMatch.id;
      matchesAdded++;
    }

    const goalDefs = [
      { mid: 0, player: "مصطفى ناصر", team: "محرم بك", c: 2 },
      { mid: 0, player: "إبراهيم حسين", team: "العصافرة", c: 1 },
      { mid: 1, player: "ياسر عادل", team: "بولكلي", c: 1 },
      { mid: 3, player: "نادر سعيد", team: "المعمورة", c: 2 },
      { mid: 3, player: "عماد حسين", team: "المعمورة", c: 1 },
      { mid: 3, player: "وليد عادل", team: "باكوس", c: 2 },
      { mid: 4, player: "إبراهيم حسين", team: "كرموز", c: 1 },
      { mid: 4, player: "ياسر عادل", team: "فلمنج", c: 1 },
      { mid: 5, player: "مصطفى أحمد", team: "العصافرة", c: 1 },
      { mid: 5, player: "محمد طارق", team: "العصافرة", c: 1 },
      { mid: 5, player: "ياسر عادل", team: "بولكلي", c: 1 },
      { mid: 5, player: "هشام سعيد", team: "بولكلي", c: 1 },
      { mid: 6, player: "إبراهيم ناصر", team: "كامب شيزار", c: 2 },
      { mid: 6, player: "مصطفى سعيد", team: "كامب شيزار", c: 1 },
      { mid: 6, player: "ياسر عادل", team: "جليم", c: 1 },
      { mid: 7, player: "نادر سعيد", team: "المعمورة", c: 1 },
      { mid: 8, player: "وليد عادل", team: "باكوس", c: 1 },
      { mid: 8, player: "فرج سعيد", team: "باكوس", c: 1 },
      { mid: 9, player: "مصطفى ناصر", team: "محرم بك", c: 1 },
      { mid: 9, player: "محمد سعيد", team: "محرم بك", c: 1 },
      { mid: 9, player: "ياسر عادل", team: "فلمنج", c: 1 },
      { mid: 10, player: "أحمد حسين", team: "محرم بك", c: 1 },
      { mid: 11, player: "إبراهيم ناصر", team: "كامب شيزار", c: 1 },
      { mid: 11, player: "محمد حسين", team: "كامب شيزار", c: 1 },
      { mid: 11, player: "إبراهيم حسين", team: "العصافرة", c: 1 },
    ];

    let eventsAdded = 0;
    let counter = 0;
    for (const g of goalDefs) {
      const matchRealId = matchIdMap[g.mid];
      if (!matchRealId) continue;
      const playerRealId = playerIdMap[g.player];
      const teamRealId = teamIdMap[g.team];
      if (!playerRealId || !teamRealId) continue;

      for (let i = 0; i < g.c; i++) {
        counter++;
        const matchExists = await prisma.matchEvent.findFirst({
          where: { matchId: matchRealId, playerId: playerRealId },
          select: { id: true },
        });
        if (!matchExists) {
          await prisma.matchEvent.create({
            data: { matchId: matchRealId, playerId: playerRealId, teamId: teamRealId, type: "GOAL", minute: (counter % 88) + 1 },
          });
          eventsAdded++;
        }
      }
    }

    const totalTeams = await prisma.team.count();
    const totalPlayers = await prisma.player.count();

    return NextResponse.json({
      ok: true,
      teamsAdded,
      playersAdded,
      matchesAdded,
      eventsAdded,
      totalTeams,
      totalPlayers,
      message: `تم بنجاح: ${teamsAdded} فريق, ${playersAdded} لاعب, ${matchesAdded} مباراة, ${eventsAdded} هدف. الإجمالي: ${totalTeams} فريق, ${totalPlayers} لاعب`,
    });
  } catch (error) {
    console.error("[admin/seed]", error);
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() { return handleSeed(); }
