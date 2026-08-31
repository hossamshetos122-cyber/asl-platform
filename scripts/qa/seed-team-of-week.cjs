const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Client } = require("pg");

const PROJECT = path.resolve(__dirname, "../..");
const ENV_PATH = path.join(PROJECT, ".env");

function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[line.slice(0, eq).trim()] = value;
  }
  return out;
}

const WANT_CLEAR = process.argv.includes("--clear");
const FORMATION = "4-4-2";
// GK | LB | CB1 | CB2 | RB | LM | CM1 | CM2 | RM | ST1 | ST2
const SLOTS = ["GK", "LB", "CB1", "CB2", "RB", "LM", "CM1", "CM2", "RM", "ST1", "ST2"];
const RATINGS = [97, 92, 88, 85, 82, 79, 75, 71, 68, 64, 60];
const POS_MAP = { GOALKEEPER: "GK", DEFENDER: "DEF", MIDFIELDER: "MID", FORWARD: "FW" };

(async () => {
  const env = loadEnv(ENV_PATH);
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) { console.log("SKIP: DATABASE_URL missing"); process.exit(0); }
  const db = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();

  if (WANT_CLEAR) {
    await db.query(`DELETE FROM "TeamOfTheWeek"`);
    console.log("TOTW CLEARED (all weeks)");
    await db.end();
    process.exit(0);
  }

  const tours = await db.query(
    `SELECT t.id FROM "Tournament" t
     LEFT JOIN "Match" m ON m."tournamentId" = t.id
     WHERE t.status = 'ONGOING'
     GROUP BY t.id
     ORDER BY count(m.id) DESC, t."startDate" DESC`);
  if (tours.rows.length === 0) { console.log("SKIP: no featured tournament"); await db.end(); process.exit(0); }
  const tid = tours.rows[0].id;

  const teamIds = await db.query(
    `SELECT "teamId" FROM "TournamentTeam" WHERE "tournamentId" = $1`, [tid]);
  if (teamIds.rows.length === 0) { console.log("SKIP: no teams in featured tournament"); await db.end(); process.exit(0); }
  const ids = teamIds.rows.map((r) => r.teamId);

  const players = await db.query(
    `SELECT p.id, p."jerseyNumber", u."fullName", p.position
     FROM "TeamMembership" tm
     JOIN "Player" p ON p.id = tm."playerId"
     JOIN "User" u ON u.id = p."userId"
     WHERE tm.status = 'ACTIVE' AND tm."teamId" = ANY($1)`,
    [ids]);
  if (players.rows.length < 11) { console.log("SKIP: fewer than 11 active players available"); await db.end(); process.exit(0); }

  const goals = await db.query(
    `SELECT "playerId", count(*)::int AS n
     FROM "MatchEvent" me JOIN "Match" m ON m.id = me."matchId"
     WHERE m."tournamentId" = $1 AND m.status = 'FINISHED' AND me.type IN ('GOAL', 'PENALTY_SCORED')
     GROUP BY "playerId"`, [tid]);
  const assists = await db.query(
    `SELECT "playerId", count(*)::int AS n
     FROM "MatchEvent" me JOIN "Match" m ON m.id = me."matchId"
     WHERE m."tournamentId" = $1 AND m.status = 'FINISHED' AND me.type = 'ASSIST'
     GROUP BY "playerId"`, [tid]);
  const goalsMap = new Map(goals.rows.map((r) => [r.playerId, r.n]));
  const assistsMap = new Map(assists.rows.map((r) => [r.playerId, r.n]));

  const ranked = players.rows
    .map((p) => ({
      ...p,
      goals: goalsMap.get(p.id) ?? 0,
      assists: assistsMap.get(p.id) ?? 0,
      grp: POS_MAP[p.position] || "MID",
    }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999));

  const bestGK = ranked.find((r) => r.grp === "GK");
  const rest = ranked.filter((r) => r.id !== bestGK?.id).slice(0, 10);
  const chosen = bestGK ? [bestGK, ...rest] : ranked.slice(0, 11);
  if (chosen.length < 11) { console.log("SKIP: cannot fill a full XI"); await db.end(); process.exit(0); }

  const admin = await db.query(`SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1`);
  if (admin.rows.length === 0) { console.log("SKIP: no admin user"); await db.end(); process.exit(0); }

  await db.query(`DELETE FROM "TeamOfTheWeek"`);

  const weekId = crypto.randomUUID();
  await db.query(
    `INSERT INTO "TeamOfTheWeek" (id, "weekLabel", "weekStart", "weekEnd", formation, "tournamentId", "createdById", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
    [weekId, `QA أسبوع ${FORMATION}`, new Date("2026-08-24"), new Date("2026-08-30"), FORMATION, tid, admin.rows[0]?.id ?? null]);

  for (let i = 0; i < chosen.length; i++) {
    const rating = RATINGS[i] ?? 50;
    await db.query(
      `INSERT INTO "TeamOfTheWeekPlayer" (id, "teamOfTheWeekId", "playerId", "positionSlot", "sortOrder", captain, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, now())`,
      [crypto.randomUUID(), weekId, chosen[i].id, SLOTS[i], i, i === 0]);
    await db.query(`UPDATE "Player" SET rating = $1 WHERE id = $2`, [rating, chosen[i].id]);
  }

  console.log(`TOTW SEEDED (${FORMATION}): ` + chosen.map((c, i) => `${c.fullName}(${SLOTS[i]}:${RATINGS[i]})`).join(", "));
  await db.end();
  process.exit(0);
})().catch((err) => { console.error("ERROR:", err.message); process.exit(1); });