const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const BASE = process.env.BASE || "http://localhost:3388";
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

const LEGACY = ['الكرنك', 'الكانيلات', 'اللمعة', 'سبا', 'شتين', 'العزموط', 'الجمرك', 'البحري', 'الورديان', 'الدخيلة', 'ريكي', 'المحمودية', 'لمعة'];
const MODERN = ['الإبراهيمية', 'العجمي', 'العصافرة', 'المعمورة', 'المنتزه', 'باكوس', 'برج العرب', 'بولكلي', 'جليم', 'زيزينيا', 'ستانلي', 'سموحة', 'سيدي بشر', 'سيدي جابر', 'سيدي كرير', 'فلمنج', 'كامب شيزار', 'كرموز', 'محرم بك', 'محطة الرمل', 'Hossam'];

let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log(`PASS  ${name} => ${detail || ""}`); }
  else { fail++; console.log(`FAIL  ${name} <= ${detail || ""}`); }
}

async function getText(url) {
  const res = await fetch(url, { redirect: "follow", cache: "no-store" });
  const html = await res.text();
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  return decodeURIComponent(text).replace(/\s+/g, " ");
}

(async () => {
  const env = loadEnv(ENV_PATH);
  const DATABASE_URL = env.DATABASE_URL;

  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  try {
    const teamsRes = await db.query(`SELECT name FROM "Team"`);
    const names = teamsRes.rows.map((r) => r.name);
    const legacyInDb = LEGACY.filter((l) => names.includes(l));
    ok("no legacy team name in DB", legacyInDb.length === 0, legacyInDb.join(",") || "clean");
    const missingModern = MODERN.filter((m) => !names.join(" ").includes(m));
    ok("all 21 canonical modern teams present in DB", missingModern.length === 0, "missing: " + (missingModern.join(",") || "none"));

    // A featured FINISHED match id, to also sniff the match-detail page.
    let matchDetail = new URL(BASE + "/matches").toString();
    try {
      const feat = await db.query(
        `SELECT m.id FROM "Match" m JOIN "Tournament" t ON t.id = m."tournamentId"
         WHERE t.status = 'ONGOING' AND m.status = 'FINISHED'
         ORDER BY m."kickoffAt" DESC LIMIT 1`);
      if (feat.rows.length > 0) matchDetail = BASE + "/matches/" + feat.rows[0].id;
    } catch {}

    const urls = [
      "/", "/standings", "/matches", "/teams", "/players", "/top-scorers",
      "/tournaments", matchDetail, "/admin/seed",
    ];

    for (const url of urls) {
      try {
        const text = await getText(url.startsWith("http") ? url : BASE + url);
        const hits = LEGACY.filter((l) => text.includes(l));
        ok(`no legacy names on ${url}`, hits.length === 0, hits.join(",") || "clean");
        if (!url.includes("/admin/seed")) {
          const modernOnPage = MODERN.filter((m) => text.includes(m));
          if (url.includes("/tournaments")) {
            ok(`modern names rendered on ${url}`, true, "skip: tournaments page lists competitions, not teams");
          } else {
            const minimum = url.includes("/matches/") ? 1 : 3;
            ok(`modern names rendered on ${url}`, modernOnPage.length >= minimum, `${modernOnPage.length} modern names`);
          }
        }
      } catch (err) {
        ok(`no legacy names on ${url}`, false, "fetch error: " + err.message);
      }
    }

    console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
  } finally {
    await db.end();
  }
  process.exit(fail ? 1 : 0);
})();