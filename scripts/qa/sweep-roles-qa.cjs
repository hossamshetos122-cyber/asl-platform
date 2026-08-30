const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const PROJECT = path.resolve(__dirname, process.argv[2] || ".");
const env = (() => {
  const out = {};
  for (const l of fs.readFileSync(path.join(PROJECT, ".env"), "utf8").split("\n")) {
    const e = l.indexOf("=");
    if (e > 0) out[l.slice(0, e).trim()] = l.slice(e + 1).trim().replace(/^"|"$/g, "");
  }
  return out;
})();

(async () => {
  const db = new Client({ connectionString: env.DATABASE_URL });
  await db.connect();

  const countOr = async (label, sql) => {
    const r = await db.query(sql);
    console.log(`${label}: ${r.rows[0].n}`);
    return parseInt(r.rows[0].n, 10);
  };

  const beforeTeams = await countOr("BEFORE qa teams", `SELECT count(*) AS n FROM "Team" WHERE name LIKE 'فريق QA%'`);
  const beforeUsers = await countOr("BEFORE qa managers", `SELECT count(*) AS n FROM "User" WHERE email LIKE 'manager.qa-%'`);
  const beforeMatches = await countOr("BEFORE qa matches", `SELECT count(*) AS n FROM "Match" WHERE "homeTeamId" IN (SELECT id FROM "Team" WHERE name LIKE 'فريق QA%')`);

  // 1. Matches (cascades squads/events/awards)
  await db.query(`DELETE FROM "Match" WHERE "homeTeamId" IN (SELECT id FROM "Team" WHERE name LIKE 'فريق QA%')`);

  // 2. Team-scoped join/child rows
  await db.query(`DELETE FROM "TournamentTeam" WHERE "teamId" IN (SELECT id FROM "Team" WHERE name LIKE 'فريق QA%')`);
  await db.query(`DELETE FROM "TeamMembership" WHERE "teamId" IN (SELECT id FROM "Team" WHERE name LIKE 'فريق QA%')`);
  await db.query(`DELETE FROM "_TeamManagers" WHERE "A" IN (SELECT id FROM "Team" WHERE name LIKE 'فريق QA%') OR "B" IN (SELECT id FROM "User" WHERE email LIKE 'manager.qa-%')`);

  // 3. Audit rows authored by QA managers (they confirmed squads), then users, then teams
  await db.query(`DELETE FROM "AuditLog" WHERE "actorId" IN (SELECT id FROM "User" WHERE email LIKE 'manager.qa-%')`);
  await db.query(`DELETE FROM "User" WHERE email LIKE 'manager.qa-%'`);
  await db.query(`DELETE FROM "Team" WHERE name LIKE 'فريق QA%'`);

  await countOr("AFTER qa teams", `SELECT count(*) AS n FROM "Team" WHERE name LIKE 'فريق QA%'`);
  await countOr("AFTER qa managers", `SELECT count(*) AS n FROM "User" WHERE email LIKE 'manager.qa-%'`);
  await countOr("AFTER qa matches", `SELECT count(*) AS n FROM "Match" WHERE "homeTeamId" IN (SELECT id FROM "Team" WHERE name LIKE 'فريق QA%')`);

  console.log(`SWEPT: teams ${beforeTeams}->0, managers ${beforeUsers}->0, matches ${beforeMatches}->0`);
  await db.end();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });