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
    const ap = await db.query(
      `SELECT p.id, u."fullName" FROM "TeamMembership" tm
       JOIN "Player" p ON p.id = tm."playerId"
       JOIN "User" u ON u.id = p."userId"
       WHERE tm."teamId" = $1 AND tm.status = 'ACTIVE'
       ORDER BY p."jerseyNumber" ASC NULLS LAST LIMIT 1`, [match.awayTeamId]);
    if (hp.rows.length === 0 || ap.rows.length === 0) { console.log("SKIP: a team has no ACTIVE players"); process.exit(0); }
    const homePlayer = hp.rows[0];
    const awayPlayer = ap.rows[0];

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

      // Score stays 0-0 (no goal selects). Add a yellow for a home player and a red for an away player.
      const added = await page.evaluate(() => {
        const btns = [...document.querySelectorAll("button")];
        // Home group renders first, away group last. Take the FIRST yellow add
        // (home) and the LAST red add (away).
        const yellowBtn = btns.find((b) => (b.textContent || "").includes("كارت أصفر"));
        if (!yellowBtn) return { ok: false, reason: "no yellow add btn" };
        const redBtns = btns.filter((b) => (b.textContent || "").includes("كارت أحمر"));
        const redBtn = redBtns.length ? redBtns[redBtns.length - 1] : null;
        if (!redBtn) return { ok: false, reason: "no red add btn" };
        yellowBtn.click();
        redBtn.click();
        return { ok: true };
      });
      ok("card add buttons clicked", added.ok, added.reason || "");

      await new Promise((r) => setTimeout(r, 900));

      const filled = await page.evaluate(({ homeId, awayId }) => {
        const selects = [...document.querySelectorAll("select")];
        const yellow = selects.find((s) => s.name && s.name.includes("-yellow-"));
        const redSelects = selects.filter((s) => s.name && s.name.includes("-red-"));
        const red = redSelects.length ? redSelects[redSelects.length - 1] : null;
        if (!yellow || !red) return { ok: false };
        yellow.value = homeId;
        yellow.dispatchEvent(new Event("change", { bubbles: true }));
        red.value = awayId;
        red.dispatchEvent(new Event("change", { bubbles: true }));
        return { ok: true };
      }, { homeId: homePlayer.id, awayId: awayPlayer.id });
      ok("home yellow + away red assigned", filled.ok);

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
        `SELECT m.status, m."homeScore", m."awayScore",
                (SELECT count(*) FROM "MatchEvent" me WHERE me."matchId" = m.id AND me.type = 'GOAL')::int AS goals,
                (SELECT count(*) FROM "MatchEvent" me WHERE me."matchId" = m.id AND me.type = 'YELLOW_CARD')::int AS yellows,
                (SELECT count(*) FROM "MatchEvent" me WHERE me."matchId" = m.id AND me.type = 'RED_CARD')::int AS reds
         FROM "Match" m WHERE m.id = $1`, [match.id]);
      const a = after.rows[0];
      ok("match finished 0-0", a.status === "FINISHED" && a.homeScore === 0 && a.awayScore === 0, `${a.status} ${a.homeScore}-${a.awayScore}`);
      ok("exactly one YELLOW_CARD + one RED_CARD event", a.yellows === 1 && a.reds === 1, `Y=${a.yellows} R=${a.reds}`);

      const yEvent = await db.query(
        `SELECT "playerId", "teamId" FROM "MatchEvent" WHERE "matchId" = $1 AND type = 'YELLOW_CARD' LIMIT 1`, [match.id]);
      const rEvent = await db.query(
        `SELECT "playerId", "teamId" FROM "MatchEvent" WHERE "matchId" = $1 AND type = 'RED_CARD' LIMIT 1`, [match.id]);
      ok("yellow tied to home player/team",
        yEvent.rows[0] && yEvent.rows[0].playerId === homePlayer.id && yEvent.rows[0].teamId === match.homeTeamId,
        `${homePlayer.fullName}`);
      ok("red tied to away player/team",
        rEvent.rows[0] && rEvent.rows[0].playerId === awayPlayer.id && rEvent.rows[0].teamId === match.awayTeamId,
        `${awayPlayer.fullName}`);

      // The red card must put the away player into the suspensions list (their
      // next fixture is the suspension target), the single yellow must NOT
      // (unless that home player already had 2+ yellows).
      const awayLater = await db.query(
        `SELECT count(*)::int AS n FROM "Match" m
         WHERE (m."homeTeamId" = $1 OR m."awayTeamId" = $1)
           AND m.status IN ('SCHEDULED','POSTPONED') AND m.id <> $2`,
        [match.awayTeamId, match.id]);
      await page.goto(BASE + "/admin/suspensions", { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 800));
      const suspText = await page.evaluate(() => document.body.innerText);
      if (awayLater.rows[0].n > 0) {
        ok("suspensions page lists the red-carded player", suspText.includes(awayPlayer.fullName), `next fixtures=${awayLater.rows[0].n}`);
      } else {
        ok("suspensions page lists the red-carded player", true, "skipped: away team has no further fixture (ban served at season end)");
      }
      // The away player (if suspended) must be flagged as a red-card suspension reason.
      if (awayLater.rows[0].n > 0 && suspText.includes(awayPlayer.fullName)) {
        const row = await page.evaluate((name) => {
          for (const tr of document.querySelectorAll("tr")) {
            if ((tr.textContent || "").includes(name)) return tr.textContent.replace(/\s+/g, " ").trim();
          }
          return null;
        }, awayPlayer.fullName);
        ok("suspension reason is a red card", (row || "").includes("حمراء"), (row || "").slice(0, 120));
      }
      const preExistingHomeYellows = await db.query(
        `SELECT count(*)::int AS n FROM "MatchEvent" me
         JOIN "Match" m ON m.id = me."matchId"
         WHERE me."playerId" = $1 AND me."teamId" = $2 AND me.type = 'YELLOW_CARD' AND m.status = 'FINISHED'`,
        [homePlayer.id, match.homeTeamId]);
      if (preExistingHomeYellows.rows[0].n < 2) {
        ok("single yellow does NOT list the home player", !suspText.includes(homePlayer.fullName), "");
      } else {
        ok("single yellow does NOT list the home player", true, "skipped: home player already near suspension");
      }

      // Restore exact prior state via DB (the UI already proved the write path).
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
      ok("DB restored exactly", r.status === "SCHEDULED" && r.homeScore === 0 && r.awayScore === 0 && r.ev === evBefore.rows[0].n && kickOk, `${r.status} ${r.homeScore}-${r.awayScore} ev=${r.ev} kick=${kickOk}`);

      console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
    } catch (err) {
      fail++;
      console.log("FAIL  script error =>", err.message);
      console.log(`==== ${pass}/${pass + fail} PASS ====`);
      // best-effort restore even on failure
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