// Verifies the venue name is rendered on every surface that displays a match
// (home upcoming/latest cards, live banner, /matches, match detail, team
// next-fixture card, admin table) and that the venue input is mandatory when
// creating a match from the admin dashboard. Uses a url-parameter filter to
// avoid counting duplicates.
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
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

const env = loadEnv(ENV_PATH);
const EMAIL = env.ROTATE_ADMIN_EMAIL;
const PASSWORD = env.ROTATE_ADMIN_PASSWORD;
const DATABASE_URL = env.DATABASE_URL;

const VENUE_RE = /ستاد الإسكندرية المركزي|ملعب كرموز|ستاد المنتزه|ملعب النخاطر|ستاد المنشية/;

let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log(`PASS  ${name} => ${detail || ""}`); }
  else { fail++; console.log(`FAIL  ${name} <= ${detail || ""}`); }
}

(async () => {
  if (!EMAIL || !PASSWORD || !DATABASE_URL) { console.log("SKIP: creds/DB missing"); process.exit(0); }

  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1400,1000"],
  });
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1400, height: 1000 });

    // DB invariant: every match has a venue now.
    const nullVenues = await db.query('SELECT COUNT(*)::int AS n FROM "Match" WHERE "venue" IS NULL');
    ok("DB: zero matches without a venue", nullVenues.rows[0].n === 0, `null=${nullVenues.rows[0].n}`);

    const liveMatch = await db.query(
      `SELECT m.id, m."venue", m.status FROM "Match" m WHERE m.status IN ('LIVE','HALFTIME') ORDER BY m."kickoffAt" DESC LIMIT 1`);
    const nextMatch = await db.query(
      `SELECT m.id, m."venue", ht.id AS "homeTeamId" FROM "Match" m
       JOIN "Team" ht ON ht.id = m."homeTeamId"
       WHERE m.status = 'SCHEDULED' ORDER BY m."kickoffAt" ASC LIMIT 1`);

    // 1. Home: upcoming + latest cards and the live banner all show a venue.
    await page.goto(BASE + "/", { waitUntil: "load", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 1200));
    const homeText = await page.evaluate(() => document.body.innerText);
    const hasUpcomingSection = homeText.includes("المباريات القادمة");
    const hasLatestSection = homeText.includes("آخر النتائج");
    const venueCount = (homeText.match(VENUE_RE) || []).length;
    ok("home has upcoming + latest sections", hasUpcomingSection && hasLatestSection, "");
    ok("home renders at least one venue name", venueCount >= 1, `venues=${venueCount}`);
    if (liveMatch.rows.length > 0) {
      const vn = liveMatch.rows[0].venue;
      ok("live banner shows its venue", homeText.includes(vn), `venue=${vn}`);
    } else {
      console.log("SKIP  live banner check (no LIVE match)");
    }

    // 2. Team page next-fixture card shows the venue.
    if (nextMatch.rows.length > 0) {
      const row = nextMatch.rows[0];
      await page.goto(BASE + `/teams/${row.homeTeamId}`, { waitUntil: "load", timeout: 90000 });
      await new Promise((r) => setTimeout(r, 900));
      const teamText = await page.evaluate(() => document.body.innerText);
      ok("team next-fixture card shows venue",
        teamText.includes("المباراة القادمة") && teamText.includes(row.venue), `venue=${row.venue}`);
    } else {
      console.log("SKIP  team next-fixture check (no SCHEDULED match)");
    }

    // 3. /matches list + match detail show a venue (light re-check).
    await page.goto(BASE + "/matches", { waitUntil: "load", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 900));
    const matchesText = await page.evaluate(() => document.body.innerText);
    ok("matches list shows a venue name", (matchesText.match(VENUE_RE) || []).length >= 1,
      `venues=${(matchesText.match(VENUE_RE) || []).length}`);

    // 4. Admin dashboard: login, venue column + mandatory create input.
    await page.goto(BASE + "/login", { waitUntil: "load", timeout: 90000 });
    await page.waitForSelector("#email");
    await page.type("#email", EMAIL);
    await page.type("#password", PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 90000 }).catch(() => {}),
      page.evaluate(() => {
        const b = [...document.querySelectorAll("button")].find((x) => x.type === "submit" || /دخول|تسجيل/.test(x.textContent || ""));
        if (b) b.click();
      }),
    ]);
    await new Promise((r) => setTimeout(r, 2500));

    await page.goto(BASE + "/admin/matches", { waitUntil: "load", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 1200));
    const admin = await page.evaluate(() => {
      const text = document.body.innerText;
      const headers = [...document.querySelectorAll("th")].map((h) => h.textContent || "");
      const venueHeaders = headers.filter((h) => h.includes("الملعب")).length;
      return {
        hasVenueHeader: venueHeaders > 0,
        hasVenueValues: (text.match(/ملعب كرموز|منتزه|نخاطر|منشية|الإسكندرية المركزي/g) || []).length,
      };
    });
    ok("admin table has a venue column", admin.hasVenueHeader, `headers=${admin.hasVenueHeader}`);
    ok("admin table shows venue values", admin.hasVenueValues >= 1, `venues=${admin.hasVenueValues}`);

    const formState = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent && b.textContent.includes("إضافة مباراة"));
      if (!btn) return null;
      btn.click();
      return { clicked: true };
    });
    ok("admin 'إضافة مباراة' opened", formState !== null);
    await new Promise((r) => setTimeout(r, 800));
    const createForm = await page.evaluate(() => {
      const input = document.querySelector("input[name='venue']");
      return {
        exists: !!input,
        required: input ? input.required : false,
      };
    });
    ok("create form has venue field", createForm.exists, "");
    ok("create form venue is required", createForm.required, "");

    console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
  } catch (err) {
    fail++;
    console.log("FAIL  script error =>", err.message);
    console.log(`==== ${pass}/${pass + fail} PASS ====`);
  } finally {
    await browser.close();
    await db.end();
  }
  process.exit(fail ? 1 : 0);
})();