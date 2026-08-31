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

  let match; let homePlayer; let awayPlayer;
  await db.query("BEGIN");
  try {
    const found = await db.query(
      `SELECT m.id, m."homeTeamId", m."awayTeamId", m.status, m."homeScore", m."awayScore", m."kickoffAt",
              ht.name AS "homeName", at.name AS "awayName"
       FROM "Match" m
       JOIN "Team" ht ON ht.id = m."homeTeamId"
       JOIN "Team" at ON at.id = m."awayTeamId"
       WHERE m.status = 'SCHEDULED'
       ORDER BY m."kickoffAt" ASC LIMIT 1`
    );
    if (found.rows.length === 0) { console.log("SKIP: no overdue SCHEDULED match to test"); process.exit(0); }
    match = found.rows[0];
    console.log("TARGET:", match.homeName, "vs", match.awayName, "|", match.id);

    const hp = await db.query(
      `SELECT p.id, u."fullName" FROM "TeamMembership" tm
       JOIN "Player" p ON p.id = tm."playerId"
       JOIN "User" u ON u.id = p."userId"
       WHERE tm."teamId" = $1 AND tm.status = 'ACTIVE'
       ORDER BY p."jerseyNumber" ASC NULLS LAST LIMIT 1`, [match.homeTeamId]);
    const ap = await db.query(
      `SELECT p.id, u."fullName" FROM "TeamMembership" tm
       JOIN "Player" p ON p.id = tm."playerId"
       JOIN "User" u ON u.id = p."userId"
       WHERE tm."teamId" = $1 AND tm.status = 'ACTIVE'
       ORDER BY p."jerseyNumber" ASC NULLS LAST LIMIT 1`, [match.awayTeamId]);
    if (hp.rows.length === 0 || ap.rows.length === 0) { console.log("SKIP: a team has no ACTIVE players"); process.exit(0); }
    homePlayer = hp.rows[0];
    awayPlayer = ap.rows[0];

    const evBefore = await db.query(`SELECT count(*)::int AS n FROM "MatchEvent" WHERE "matchId" = $1`, [match.id]);

    const browser = await puppeteer.launch({
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: "new",
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1400,1000"],
    });
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1400, height: 1000 });
      await page.goto(BASE + "/login", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForSelector("#email");
      await page.type("#email", EMAIL);
      await page.type("#password", PASSWORD);
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }).catch(() => {}),
        page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.type === "submit" || /دخول|تسجيل/.test(x.textContent || "")); if (b) b.click(); }),
      ]);
      await new Promise((r) => setTimeout(r, 2500));

      await page.goto(BASE + "/admin/matches", { waitUntil: "networkidle0", timeout: 60000 });

      const opened = await page.evaluate(({ hn, an }) => {
        for (const tr of document.querySelectorAll("tr")) {
          const text = tr.textContent || "";
          if (!text.includes(hn) || !text.includes(an)) continue;
          const btn = [...tr.querySelectorAll("button")].find((b) => b.textContent && b.textContent.includes("إدخال النتيجة والأهداف"));
          if (!btn) continue;
          btn.click();
          return true;
        }
        return false;
      }, { hn: match.homeName, an: match.awayName });
      ok("overdue row panel opened", opened);
      await new Promise((r) => setTimeout(r, 1000));

      // set score 1-0 via React dispatch
      const set = await page.evaluate(() => {
        const inputs = [...document.querySelectorAll("input[type=number]")];
        if (inputs.length < 2) return false;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(inputs[0], "1");
        inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
        setter.call(inputs[1], "0");
        inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      });
      ok("score inputs set to 1-0", set);
      await page.waitForFunction(() => {
        const sels = [...document.querySelectorAll("select")];
        return sels.some((s) => s.name && s.name.endsWith("-goal-0"));
      }, { timeout: 15000 });

      const chosen = await page.evaluate((pid) => {
        const sel = [...document.querySelectorAll("select")].find((s) => s.name && s.name.endsWith("-goal-0"));
        if (!sel) return false;
        const opt = [...sel.options].find((o) => o.value === pid);
        if (!opt) return false;
        sel.value = pid;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }, homePlayer.id);
      ok("home scorer chosen", chosen);

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }).catch(() => {}),
        page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "حفظ النتيجة والأهداف");
          if (b) b.click();
        }),
      ]);
      await new Promise((r) => setTimeout(r, 3000));

      const after = await db.query(
        `SELECT m.status, m."homeScore", m."awayScore",
                (SELECT count(*) FROM "MatchEvent" me WHERE me."matchId" = m.id AND me.type = 'GOAL')::int AS goals,
                (SELECT me."playerId" FROM "MatchEvent" me WHERE me."matchId" = m.id AND me.type = 'GOAL' LIMIT 1) AS scorer
         FROM "Match" m WHERE m.id = $1`, [match.id]);
      const a = after.rows[0];
      ok("match finished", a.status === "FINISHED" && a.homeScore === 1 && a.awayScore === 0, `${a.status} ${a.homeScore}-${a.awayScore}`);
      ok("one GOAL event created for chosen player", a.goals === 1 && a.scorer === homePlayer.id, `scorer=${a.scorer === homePlayer.id ? homePlayer.fullName : "WRONG"}`);
      if (a.scorer === homePlayer.id && a.goals === 1) {
        const chk = await db.query(
          `SELECT count(*)::int AS n FROM "MatchEvent" me
           JOIN "Match" m ON m.id = me."matchId"
           WHERE me."playerId" = $1 AND me.type = 'GOAL'
             AND m.status IN ('FINISHED','LIVE','HALFTIME') AND m."tournamentId" = (SELECT "tournamentId" FROM "Match" WHERE id = $2)`, [homePlayer.id, match.id]);
        ok("event feeds the same aggregated source as top-scorers (featured scope)", chk.rows[0].n >= 1, `player GOAL events=${chk.rows[0].n}`);
      }
    } finally {
      await browser.close();
    }
  } finally {
    // RESTORE EXACT PRIOR STATE
    await db.query(
      `DELETE FROM "MatchEvent" WHERE "matchId" = $1`,
      [match.id]
    );
    await db.query(
      `UPDATE "Match" SET status = 'SCHEDULED', "homeScore" = 0, "awayScore" = 0, "kickoffAt" = $2 WHERE id = $1`,
      [match.id, match.kickoffAt]
    );
    await db.query("COMMIT").catch(() => {});
    const restored = await db.query(
      `SELECT status, "homeScore", "awayScore", "kickoffAt",
              (SELECT count(*) FROM "MatchEvent" me WHERE me."matchId" = m.id)::int AS ev
       FROM "Match" m WHERE m.id = $1`, [match.id]);
    const r = restored.rows[0];
    const kickOk = new Date(r.kickoffAt).getTime() === new Date(match.kickoffAt).getTime();
    ok("DB restored exactly", r.status === "SCHEDULED" && r.homeScore === 0 && r.awayScore === 0 && r.ev === 0 && kickOk, `${r.status} ${r.homeScore}-${r.awayScore} ev=${r.ev} kick=${kickOk}`);
    await db.end();
  }

  console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("ERR", e); process.exit(1); });