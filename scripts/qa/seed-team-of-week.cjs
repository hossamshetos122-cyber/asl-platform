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
const LINEUP_SIZE = 11;

const POS_MAP = { GOALKEEPER: "GK", DEFENDER: "DEF", MIDFIELDER: "MID", FORWARD: "FW" };

(async () => {
  const env = loadEnv(ENV_PATH);
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) { console.log("SKIP: DATABASE_URL missing"); process.exit(0); }
  const db = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();

  const tours = await db.query(
    `SELECT t.id, count(m.id)::int AS n
     FROM "Tournament" t
     LEFT JOIN "Match" m ON m."tournamentId" = t.id
     WHERE t.status = 'ONGOING'
     GROUP BY t.id
     ORDER BY count(m.id) DESC, t."startDate" DESC`);
  if (tours.rows.length === 0) { console.log("SKIP: no featured tournament"); await db.end(); process.exit(0); }
  const tid = tours.rows[0].id;

  if (WANT_CLEAR) {
    await db.query(`DELETE FROM "TeamOfWeekPlayer" WHERE "tournamentId" = $1`, [tid]);
    console.log("TEAM_OF_WEEK CLEARED for tournament " + tid);
    await db.end();
    process.exit(0);
  }

  const teamIds = await db.query(
    `SELECT "teamId" FROM "TournamentTeam" WHERE "tournamentId" = $1`, [tid]);
  if (teamIds.rows.length === 0) { console.log("SKIP: no teams in featured tournament"); await db.end(); process.exit(0); }
  const ids = teamIds.rows.map((r) => r.teamId);

  const players = await db.query(
    `SELECT p.id, p."jerseyNumber", u."fullName",
            p.position
     FROM "TeamMembership" tm
     JOIN "Player" p ON p.id = tm."playerId"
     JOIN "User" u ON u.id = p."userId"
     WHERE tm.status = 'ACTIVE' AND tm."teamId" = ANY($1)`,
    [ids]);
  if (players.rows.length < LINEUP_SIZE) { console.log("SKIP: fewer than 11 active players available"); await db.end(); process.exit(0); }

  const goals = await db.query(
    `SELECT "playerId", count(*)::int AS n
     FROM "MatchEvent" me
     JOIN "Match" m ON m.id = me."matchId"
     WHERE m."tournamentId" = $1 AND m.status = 'FINISHED' AND me.type IN ('GOAL', 'PENALTY_SCORED')
     GROUP BY "playerId"`, [tid]);
  const assists = await db.query(
    `SELECT "playerId", count(*)::int AS n
     FROM "MatchEvent" me
     JOIN "Match" m ON m.id = me."matchId"
     WHERE m."tournamentId" = $1 AND m.status = 'FINISHED' AND me.type = 'ASSIST'
     GROUP BY "playerId"`, [tid]);
  const goalsMap = new Map(goals.rows.map((r) => [r.playerId, r.n]));
  const assistsMap = new Map(assists.rows.map((r) => [r.playerId, r.n]));

  const ranked = players.rows
    .map((p) => ({
      ...p,
      goals: goalsMap.get(p.id) ?? 0,
      assists: assistsMap.get(p.id) ?? 0,
      towPos: POS_MAP[p.position] || "MID",
    }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999));

  const chosen = ranked.slice(0, LINEUP_SIZE);
  const hasGK = chosen.some((c) => c.towPos === "GK");
  if (!hasGK) {
    const bestGK = ranked.find((c) => c.towPos === "GK");
    if (bestGK && !chosen.includes(bestGK)) {
      for (let i = chosen.length - 1; i >= 0; i--) {
        if (chosen[i].towPos !== "GK") { chosen[i] = bestGK; break; }
      }
    }
  }

  await db.query(`DELETE FROM "TeamOfWeekPlayer" WHERE "tournamentId" = $1`, [tid]);
  for (let i = 0; i < chosen.length; i++) {
    await db.query(
      `INSERT INTO "TeamOfWeekPlayer" (id, "tournamentId", "playerId", position, "sortOrder", "createdAt")
       VALUES ($1, $2, $3, $4, $5, now())`,
      [crypto.randomUUID(), tid, chosen[i].id, chosen[i].towPos, i + 1]);
  }

  console.log(`TEAM_OF_WEEK XI SEEDED (${chosen.length}): ` +
    chosen.map((c) => `${c.fullName}(${c.towPos}:${c.goals}g)${c.jerseyNumber ? "#" + c.jerseyNumber : ""}`).join(", "));
  await db.end();
  process.exit(0);
})().catch((err) => { console.error("ERROR:", err.message); process.exit(1); });