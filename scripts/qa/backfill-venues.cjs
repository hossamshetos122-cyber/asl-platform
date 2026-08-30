// Backfills a venue name for every Match row whose venue is NULL so the
// column can be made NOT NULL. Uses the same deterministic hash-select as
// prisma/seed.ts (seedVenueFor) so a future reseed produces identical values.
const fs = require("fs");
const path = require("path");
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

const SEED_VENUES = ["ملعب كرموز", "ستاد المنتزه", "ملعب النخاطر", "ستاد المنشية", "ستاد الإسكندرية المركزي"];
function seedVenueFor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SEED_VENUES[h % SEED_VENUES.length];
}

(async () => {
  const DATABASE_URL = loadEnv(ENV_PATH).DATABASE_URL;
  if (!DATABASE_URL) {
    console.log("SKIP: DATABASE_URL missing in .env");
    process.exit(0);
  }
  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();
  try {
    const before = await db.query('SELECT COUNT(*)::int AS n FROM "Match" WHERE "venue" IS NULL');
    const rows = await db.query('SELECT id FROM "Match" WHERE "venue" IS NULL');
    for (const row of rows.rows) {
      await db.query('UPDATE "Match" SET "venue" = $1 WHERE id = $2', [seedVenueFor(row.id), row.id]);
    }
    const after = await db.query('SELECT COUNT(*)::int AS n FROM "Match" WHERE "venue" IS NULL');
    console.log(`BACKFILL venue: ${before.rows[0].n} -> ${after.rows[0].n} remaining`);
  } finally {
    await db.end();
  }
})();