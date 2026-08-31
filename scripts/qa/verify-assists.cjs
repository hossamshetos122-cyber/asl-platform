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

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1400,1000"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  let target = null;
  let evBefore = 0;
  async function nav(url, settleMs = 1200) {
    console.log("NAV  " + url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, settleMs));
  }
  try {
    // ---- READ CHECKS (public pages) ----
    await nav(BASE + "/top-scorers");
    const topPage = await page.evaluate(() => document.body.innerText);
    ok("top-scorers renders top-assisters section", topPage.includes("أفضل صنّاع الأهداف"), "");
    ok("top-assisters table present", topPage.includes("الأسيست"), "");

    const totalAssists = await db.query(
      `SELECT count(*)::int AS n FROM "MatchEvent" WHERE type = 'ASSIST'`);
    ok("seeded ASSIST events exist in DB", totalAssists.rows[0].n >= 1, `n=${totalAssists.rows[0].n}`);

    const anAssister = await db.query(
      `SELECT me."playerId", u."fullName", t.name AS "teamName"
       FROM "MatchEvent" me
       JOIN "Player" p ON p.id = me."playerId"
       JOIN "User" u ON u.id = p."userId"
       JOIN "Team" t ON t.id = me."teamId"
       WHERE me.type = 'ASSIST'
       ORDER BY me."createdAt" ASC LIMIT 1`);
    if (anAssister.rows.length > 0) {
      const a = anAssister.rows[0];
      ok("assister named on top-assisters page", topPage.includes(a.fullName), a.fullName);
      await nav(BASE + "/players/" + a.playerId);
      const profText = await page.evaluate(() => document.body.innerText);
      ok("player profile shows أسيست card", profText.includes("أسيست"), "");
      const profNum = await page.evaluate(() => {
        const cards = [...document.querySelectorAll(".rounded-xl.border")].filter((n) => (n.textContent || "").includes("أسيست"));
        for (const card of cards) {
          const match = (card.textContent || "").match(/(\d+)/);
          if (match) return Number(match[1]);
        }
        return -1;
      });
      ok("assist count card shows a number >= 1", profNum >= 1, `assists=${profNum}`);
    } else {
      ok("assister named on top-assisters page", true, "skipped: no ASSIST events seeded");
      ok("player profile shows أسيست card", true, "skipped: no ASSIST events seeded");
      ok("assist count card shows a number >= 1", true, "skipped: no ASSIST events seeded");
    }

    // ---- WRITE PATH (admin panel record + restore) ----
    const found = await db.query(
      `SELECT m.id, m."homeTeamId", m."awayTeamId", m.status, m."kickoffAt",
              ht.name AS "homeName", at.name AS "awayName"
       FROM "Match" m
       JOIN "Team" ht ON ht.id = m."homeTeamId"
       JOIN "Team" at ON at.id = m."awayTeamId"
       WHERE m.status = 'SCHEDULED'
       ORDER BY m."kickoffAt" ASC LIMIT 1`
    );
    if (found.rows.length === 0) { console.log("NOTE: no upcoming SCHEDULED match for write-path test"); }
    else {
      target = found.rows[0];
      const homePlayers = await db.query(
        `SELECT p.id, u."fullName" FROM "TeamMembership" tm
         JOIN "Player" p ON p.id = tm."playerId"
         JOIN "User" u ON u.id = p."userId"
         WHERE tm."teamId" = $1 AND tm.status = 'ACTIVE'
         ORDER BY p."jerseyNumber" ASC NULLS LAST LIMIT 2`, [target.homeTeamId]);
      const awayPlayers = await db.query(
        `SELECT p.id, u."fullName" FROM "TeamMembership" tm
         JOIN "Player" p ON p.id = tm."playerId"
         JOIN "User" u ON u.id = p."userId"
         WHERE tm."teamId" = $1 AND tm.status = 'ACTIVE'
         ORDER BY p."jerseyNumber" ASC NULLS LAST LIMIT 1`, [target.awayTeamId]);
      if (homePlayers.rows.length < 2 || awayPlayers.rows.length === 0) {
        console.log("NOTE: home squad <2 or away squad empty for write-path test");
      } else {
        const scorer = homePlayers.rows[0];
        const assister = homePlayers.rows[1];
        evBefore = (await db.query(`SELECT count(*)::int AS n FROM "MatchEvent" WHERE "matchId" = $1`, [target.id])).rows[0].n;

        await nav(BASE + "/login");
        await page.waitForSelector("#email");
        await page.type("#email", EMAIL);
        await page.type("#password", PASSWORD);
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }).catch(() => {}),
          page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.type === "submit" || /دخول|تسجيل/.test(x.textContent || "")); if (b) b.click(); }),
        ]);
        await new Promise((r) => setTimeout(r, 2500));

        await nav(BASE + "/admin/matches");
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
        }, { hn: target.homeName, an: target.awayName });
        ok("upcoming row panel opened", opened);
        await new Promise((r) => setTimeout(r, 1000));

        const scored = await page.evaluate(() => {
          const inputs = [...document.querySelectorAll('input[type="number"]')];
          if (inputs.length < 2) return { ok: false, reason: "no score inputs" };
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(inputs[0], "1");
          inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
          inputs[0].dispatchEvent(new Event("change", { bubbles: true }));
          return { ok: true };
        });
        ok("home score set to 1 (goal selects revealed)", scored.ok, scored.reason || "");
        await new Promise((r) => setTimeout(r, 700));

        const assistSelectVisible = await page.evaluate(() => {
          const sels = [...document.querySelectorAll("select")];
          return sels.some((s) => s.name && s.name.endsWith("-assist-0"));
        });
        ok("assist select rendered", assistSelectVisible);

        const filled = await page.evaluate(({ scorerId, assisterId }) => {
          const sels = [...document.querySelectorAll("select")];
          const goal = sels.find((s) => s.name && s.name.endsWith("-goal-0"));
          const assist = sels.find((s) => s.name && s.name.endsWith("-assist-0"));
          if (!goal || !assist) return { ok: false, reason: "selects missing" };
          goal.value = scorerId;
          goal.dispatchEvent(new Event("change", { bubbles: true }));
          assist.value = assisterId;
          assist.dispatchEvent(new Event("change", { bubbles: true }));
          return { ok: true };
        }, { scorerId: scorer.id, assisterId: assister.id });
        ok("scorer + assister assigned", filled.ok, filled.reason || "");

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
                  (SELECT count(*) FROM "MatchEvent" me WHERE me."matchId" = m.id AND me.type = 'ASSIST')::int AS assists
           FROM "Match" m WHERE m.id = $1`, [target.id]);
        const a = after.rows[0];
        ok("match finished 1-0", a.status === "FINISHED" && a.homeScore === 1 && a.awayScore === 0, `${a.status} ${a.homeScore}-${a.awayScore}`);
        ok("exactly one GOAL + one ASSIST event", a.goals === 1 && a.assists === 1, `G=${a.goals} A=${a.assists}`);

        const gEv = await db.query(`SELECT "playerId", "teamId" FROM "MatchEvent" WHERE "matchId" = $1 AND type = 'GOAL' LIMIT 1`, [target.id]);
        const aEv = await db.query(`SELECT "playerId", "teamId" FROM "MatchEvent" WHERE "matchId" = $1 AND type = 'ASSIST' LIMIT 1`, [target.id]);
        ok("goal tied to scorer/home", gEv.rows[0] && gEv.rows[0].playerId === scorer.id && gEv.rows[0].teamId === target.homeTeamId, scorer.fullName);
        ok("assist tied to different home player", aEv.rows[0] && aEv.rows[0].playerId === assister.id && aEv.rows[0].teamId === target.homeTeamId, assister.fullName);
        ok("assister differs from scorer", aEv.rows[0].playerId !== gEv.rows[0].playerId, "");

        // Restore exact prior state via DB.
        await db.query(`DELETE FROM "MatchEvent" WHERE "matchId" = $1`, [target.id]);
        await db.query(
          `UPDATE "Match" SET status = 'SCHEDULED', "homeScore" = 0, "awayScore" = 0, "kickoffAt" = $2 WHERE id = $1`,
          [target.id, target.kickoffAt]);
        const restored = await db.query(
          `SELECT status, "homeScore", "awayScore", "kickoffAt",
                  (SELECT count(*) FROM "MatchEvent" me WHERE me."matchId" = m.id)::int AS ev
           FROM "Match" m WHERE m.id = $1`, [target.id]);
        const r = restored.rows[0];
        const kickOk = new Date(r.kickoffAt).getTime() === new Date(target.kickoffAt).getTime();
        ok("DB restored exactly", r.status === "SCHEDULED" && r.homeScore === 0 && r.awayScore === 0 && r.ev === evBefore && kickOk, `${r.status} ${r.homeScore}-${r.awayScore} ev=${r.ev} kick=${kickOk}`);
      }
    }

    const afterAll = await db.query(
      `SELECT count(*)::int AS n FROM "MatchEvent" WHERE type = 'ASSIST'`);
    ok("ASSIST events preserved after restore", afterAll.rows[0].n === totalAssists.rows[0].n, `n=${afterAll.rows[0].n}`);

    console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
  } catch (err) {
    fail++;
    console.log("FAIL  script error =>", err.message);
    console.log(`==== ${pass}/${pass + fail} PASS ====`);
    if (target) {
      await db.query(`DELETE FROM "MatchEvent" WHERE "matchId" = $1`, [target.id]).catch(() => {});
      await db.query(`UPDATE "Match" SET status = 'SCHEDULED', "homeScore" = 0, "awayScore" = 0 WHERE id = $1`, [target.id]).catch(() => {});
    }
  } finally {
    await browser.close();
    await db.end();
  }
  process.exit(fail ? 1 : 0);
})();