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

const env = loadEnv(ENV_PATH);
const DATABASE_URL = env.DATABASE_URL;

(async () => {
  if (!DATABASE_URL) { console.log("SKIP: DATABASE_URL missing"); process.exit(0); }
  const db = new Client({ connectionString: DATABASE_URL, ssl: DATABASE_URL.includes("sslmode") ? undefined : { rejectUnauthorized: false } });
  await db.connect();

  // Featured tournament id (same rule as stats.ts: ONGOING with most fixtures, latest startDate).
  const tours = await db.query(
    `SELECT t.id, count(m.id)::int AS n
     FROM "Tournament" t
     LEFT JOIN "Match" m ON m."tournamentId" = t.id
     WHERE t.status = 'ONGOING'
     GROUP BY t.id
     ORDER BY count(m.id) DESC, t."startDate" DESC`);
  if (tours.rows.length === 0) { console.log("SKIP: no featured tournament"); await db.end(); process.exit(0); }
  const tid = tours.rows[0].id;

  const matches = await db.query(
    `SELECT m.id, m."homeTeamId", m."awayTeamId"
     FROM "Match" m
     WHERE m."tournamentId" = $1 AND m.status = 'FINISHED' AND m."homeScore" IS NOT NULL AND m."awayScore" IS NOT NULL`,
    [tid]);
  if (matches.rows.length === 0) { console.log("SKIP: no FINISHED matches in featured tournament"); await db.end(); process.exit(0); }

  const goals = await db.query(
    `SELECT "matchId", "teamId", "playerId"
     FROM "MatchEvent"
     WHERE "matchId" = ANY($1) AND type = 'GOAL'`,
    [matches.rows.map((m) => m.id)]);

  // Group distinct scorers per match+team, keep first-seen order (by minute).
  const scorers = new Map(); // "matchId|teamId" -> [playerId]
  for (const g of goals.rows) {
    const key = g.matchId + "|" + g.teamId;
    if (!scorers.has(key)) scorers.set(key, []);
    const arr = scorers.get(key);
    if (!arr.includes(g.playerId)) arr.push(g.playerId);
  }

  const existing = await db.query(
    `SELECT count(*)::int AS n FROM "MatchEvent" WHERE type = 'ASSIST'`);
  const existingCount = existing.rows[0].n;

  let inserted = 0;
  for (const [key, list] of scorers) {
    if (list.length < 2) continue; // only cliques with >=2 distinct scorers
    const [matchId, teamId] = key.split("|");
    const assister = list[1]; // the second distinct scorer gets the assist (demo rule)
    const dup = await db.query(
      `SELECT count(*)::int AS n FROM "MatchEvent" WHERE "matchId" = $1 AND "playerId" = $2 AND "teamId" = $3 AND type = 'ASSIST'`,
      [matchId, assister, teamId]);
    if (dup.rows[0].n > 0) continue; // already present -> idempotent
    await db.query(
      `INSERT INTO "MatchEvent" (id, "matchId", "playerId", "teamId", type, minute, "createdAt")
       VALUES ($1, $2, $3, $4, 'ASSIST', 0, now())`,
      [crypto.randomUUID(), matchId, assister, teamId]);
    inserted++;
  }

  const nowCount = existingCount + inserted;
  console.log(`ASSISTS ADDED: ${inserted} (before=${existingCount} after=${nowCount})`);
  await db.end();
  process.exit(0);
})().catch((err) => { console.error("ERROR:", err.message); process.exit(1); });