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
    if (found.rows.length === 0) { console.log("SKIP: no upcoming SCHEDULED match to test"); process.exit(0); }
    const match = found.rows[0];
    console.log("TARGET:", match.homeName, "vs", match.awayName, "|", match.id);

    const hp = await db.query(
      `SELECT p.id, u."fullName" FROM "TeamMembership" tm
       JOIN "Player" p ON p.id = tm."playerId"
       JOIN "User" u ON u.id = p."userId"
       WHERE tm."teamId" = $1 AND tm.status = 'ACTIVE'
       ORDER BY p."jerseyNumber" ASC NULLS LAST LIMIT 1`, [match.homeTeamId]);
    if (hp.rows.length === 0) { console.log("SKIP: home team has no ACTIVE players"); process.exit(0); }
    const homePlayer = hp.rows[0];

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
      await new Promise((r) => setTimeout(r, 800));

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
      ok("upcoming row panel opened", opened);
      await new Promise((r) => setTimeout(r, 1000));

      // Add a home yellow card but DO NOT select a player (leave placeholder).
      const added = await page.evaluate(() => {
        const btns = [...document.querySelectorAll("button")];
        const yellowBtn = btns.find((b) => (b.textContent || "").includes("كارت أصفر"));
        if (!yellowBtn) return { ok: false, reason: "no yellow add btn" };
        yellowBtn.click();
        return { ok: true };
      });
      ok("empty yellow card added (placeholder kept)", added.ok, added.reason || "");
      await new Promise((r) => setTimeout(r, 900));

      // Attempt to save result+goals. This should be BLOCKED with a clear Arabic
      // message and should NOT navigate away.
      const sawMsg = await new Promise((resolve) => {
        let done = false;
        const finish = (v) => { if (!done) { done = true; resolve(v); } };
        setTimeout(() => finish(false), 20000);
        page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "حفظ النتيجة والأهداف");
          if (b) b.click();
        }).then(() => {
          (async () => {
            for (let i = 0; i < 30; i++) {
              const text = await page.evaluate(() => document.body.innerText);
              if (text.includes("حدّد لاعباً لكل كارت")) { finish(true); return; }
              await new Promise((r) => setTimeout(r, 200));
            }
            finish(false);
          })();
        });
      });
      ok("clear Arabic error shown for unfilled card", sawMsg, "حدّد لاعباً لكل كارت (أصفر/أحمر)");

      // Confirm the match was NOT finished / scored and no card event was saved.
      await new Promise((r) => setTimeout(r, 800));
      const state = await db.query(
        `SELECT status, "homeScore", "awayScore",
                (SELECT count(*) FROM "MatchEvent" me WHERE me."matchId" = m.id AND me.type IN ('YELLOW_CARD','RED_CARD'))::int AS cards
         FROM "Match" m WHERE m.id = $1`, [match.id]);
      const s = state.rows[0];
      ok("match NOT saved while a card is unfilled",
        s.status === "SCHEDULED" && s.homeScore === 0 && s.awayScore === 0 && s.cards === 0,
        `${s.status} ${s.homeScore}-${s.awayScore} cards=${s.cards}`);

      // Now fill the card with a real player & save - should succeed this time.
      const filled = await page.evaluate((homeId) => {
        const selects = [...document.querySelectorAll("select")];
        const yellow = selects.find((s) => s.name && s.name.includes("-yellow-"));
        if (!yellow) return { ok: false };
        yellow.value = homeId;
        yellow.dispatchEvent(new Event("change", { bubbles: true }));
        return { ok: true };
      }, homePlayer.id);
      ok("card then assigned a player", filled.ok);
      await new Promise((r) => setTimeout(r, 300));
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }).catch(() => {}),
        page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "حفظ النتيجة والأهداف");
          if (b) b.click();
        }),
      ]);
      await new Promise((r) => setTimeout(r, 3000));
      const after = await db.query(
        `SELECT status, (SELECT count(*) FROM "MatchEvent" me WHERE me."matchId" = m.id AND me.type = 'YELLOW_CARD')::int AS yellows
         FROM "Match" m WHERE m.id = $1`, [match.id]);
      const a = after.rows[0];
      ok("filled card saves successfully", a.status === "FINISHED" && a.yellows === 1, `${a.status} yellows=${a.yellows}`);

      // Restore exact prior state.
      await db.query(`DELETE FROM "MatchEvent" WHERE "matchId" = $1`, [match.id]);
      await db.query(
        `UPDATE "Match" SET status = 'SCHEDULED', "homeScore" = 0, "awayScore" = 0, "kickoffAt" = $2 WHERE id = $1`,
        [match.id, match.kickoffAt]);
      await db.query("COMMIT").catch(() => {});
      const restored = await db.query(
        `SELECT status, "homeScore", "awayScore", "kickoffAt",
                (SELECT count(*) FROM "MatchEvent" me WHERE me."matchId" = m.id)::int AS ev
         FROM "Match" m WHERE m.id = $1`, [match.id]);
      const r = restored.rows[0];
      const kickOk = new Date(r.kickoffAt).getTime() === new Date(match.kickoffAt).getTime();
      ok("DB restored exactly", r.status === "SCHEDULED" && r.homeScore === 0 && r.awayScore === 0 && r.ev === 0 && kickOk, `${r.status} ${r.homeScore}-${r.awayScore} ev=${r.ev} kick=${kickOk}`);

      console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
    } catch (err) {
      fail++;
      console.log("FAIL  script error =>", err.message);
      console.log(`==== ${pass}/${pass + fail} PASS ====`);
      await db.query(`DELETE FROM "MatchEvent" WHERE "matchId" = $1`, [match.id]).catch(() => {});
      await db.query(`UPDATE "Match" SET status = 'SCHEDULED', "homeScore" = 0, "awayScore" = 0 WHERE id = $1`, [match.id]).catch(() => {});
      await db.query("COMMIT").catch(() => {});
    } finally {
      await browser.close();
    }
    process.exit(fail ? 1 : 0);
  } catch (err) {
    console.log("FAIL  db error =>", err.message);
    await db.query("ROLLBACK").catch(() => {});
    process.exit(1);
  }
})();
