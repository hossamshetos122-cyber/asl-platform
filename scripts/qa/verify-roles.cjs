const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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

const TAG = `qa-${Date.now().toString(36)}`;
const MANAGER_EMAIL = `manager.${TAG}@qa.local`;
const MANAGER_NAME = `مدير ${TAG}`;
const MANAGER_PW = "QA-manager-2026!";

let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log(`PASS  ${name} => ${detail || ""}`); }
  else { fail++; console.log(`FAIL  ${name} <= ${detail || ""}`); }
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function clickByText(page, selector, text) {
  const clicked = await page.evaluate(({ sel, txt }) => {
    const el = [...document.querySelectorAll(sel)].find((b) => (b.textContent || "").includes(txt));
    if (!el) return false;
    el.click();
    return true;
  }, { sel: selector, txt: text });
  await wait(500);
  return clicked;
}

(async () => {
  if (!EMAIL || !PASSWORD || !DATABASE_URL) { console.log("SKIP: creds/DB missing"); process.exit(0); }

  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  let seeded = {
    teamAId: null, teamBId: null, matchId: null, squadAId: null, squadBId: null,
  };
  const cleanup = async () => {
    await db.query(`DELETE FROM "Match" WHERE "homeTeamId" IN (SELECT id FROM "Team" WHERE name LIKE 'فريق QA%')`).catch(() => {});
    await db.query(`DELETE FROM "TournamentTeam" WHERE "teamId" IN (SELECT id FROM "Team" WHERE name LIKE 'فريق QA%')`).catch(() => {});
    await db.query(`DELETE FROM "TeamMembership" WHERE "teamId" IN (SELECT id FROM "Team" WHERE name LIKE 'فريق QA%')`).catch(() => {});
    await db.query(`DELETE FROM "_TeamManagers" WHERE "A" IN (SELECT id FROM "Team" WHERE name LIKE 'فريق QA%') OR "B" IN (SELECT id FROM "User" WHERE email LIKE 'manager.qa-%')`).catch(() => {});
    await db.query(`DELETE FROM "AuditLog" WHERE "actorId" IN (SELECT id FROM "User" WHERE email LIKE 'manager.qa-%')`).catch(() => {});
    await db.query(`DELETE FROM "User" WHERE email LIKE 'manager.qa-%'`).catch(() => {});
    await db.query(`DELETE FROM "Suspension" WHERE "playerId" IS NOT NULL AND "playerId" NOT IN (SELECT id FROM "Player")`).catch(() => {});
    await db.query(`DELETE FROM "Team" WHERE name LIKE 'فريق QA%'`).catch(() => {});
  };

  try {
    // ---- Seed: two temp teams + future match + pending squads ----
    const teamAId = crypto.randomUUID();
    const teamBId = crypto.randomUUID();
    await db.query(
      `INSERT INTO "Team" (id, name, "shortName", city, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, now(), now())`,
      [teamAId, `فريق QA أ ${TAG}`, "QAA", "الدلتا"]
    );
    await db.query(
      `INSERT INTO "Team" (id, name, "shortName", city, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, now(), now())`,
      [teamBId, `فريق QA ب ${TAG}`, "QAB", "الإسكندرية"]
    );
    seeded.teamAId = teamAId;
    seeded.teamBId = teamBId;

    // grab a valid tournament for the future match
    const tour = await db.query(`SELECT id FROM "Tournament" ORDER BY "createdAt" ASC LIMIT 1`);
    const matchId = crypto.randomUUID();
    await db.query(
      `INSERT INTO "Match" (id, "homeTeamId", "awayTeamId", "tournamentId", "kickoffAt", status, venue, "homeScore", "awayScore", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, now() + interval '2 days', 'SCHEDULED', 'ملعب QA', 0, 0, now(), now())`,
      [matchId, teamAId, teamBId, tour.rows[0].id]
    );
    seeded.matchId = matchId;

    const squadAId = crypto.randomUUID();
    const squadBId = crypto.randomUUID();
    await db.query(
      `INSERT INTO "MatchSquad" (id, "matchId", "teamId", status, "createdAt", "updatedAt") VALUES ($1, $2, $3, 'PENDING', now(), now())`,
      [squadAId, matchId, teamAId]
    );
    await db.query(
      `INSERT INTO "MatchSquad" (id, "matchId", "teamId", status, "createdAt", "updatedAt") VALUES ($1, $2, $3, 'PENDING', now(), now())`,
      [squadBId, matchId, teamBId]
    );
    seeded.squadAId = squadAId;
    seeded.squadBId = squadBId;
    console.log("SEEDED: squadA", squadAId, "| squadB", squadBId, "| match", matchId);

    const browser = await puppeteer.launch({
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: "new",
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1400,1000"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });

    // ================= Admin: create manager account =================
    await page.goto(BASE + "/login", { waitUntil: "load", timeout: 90000 });
    await page.waitForSelector("#email");
    await page.type("#email", EMAIL);
    await page.type("#password", PASSWORD);
    await page.evaluate(() => {
      const passId = [...document.querySelectorAll("input")].find((i) => i.type === "password");
      if (passId) passId.focus();
    });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 90000 }).catch(() => {}),
      page.evaluate(() => {
        const b = [...document.querySelectorAll("button")].find((x) => x.type === "submit" || /دخول|تسجيل/.test(x.textContent || ""));
        if (b) b.click();
      }),
    ]);
    await wait(2500);

    await page.goto(BASE + "/admin/accounts", { waitUntil: "load", timeout: 90000 });
    await wait(1200);
    ok("admin accounts page loads", (await page.evaluate(() => document.body.innerText)).includes("حسابات مديري الفرق"), "");
    ok("admin accounts shows create button", await clickByText(page, "button", "إنشاء حساب مدير فريق"), "");

    const formVisible = await page.evaluate(() => !!document.querySelector('input[name="fullName"]'));
    ok("create-account form opens", formVisible, "");

    await page.type('input[name="fullName"]', MANAGER_NAME);
    await page.$eval('input[name="email"]', (el, v) => { el.value = v; }, MANAGER_EMAIL);
    await page.$eval('input[name="password"]', (el, v) => { el.value = v; }, MANAGER_PW);
    await page.evaluate((teamId) => {
      const el = document.querySelector('select[name="teamId"]');
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(el, teamId);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, teamAId);

    await page.evaluate(() => {
      const f = document.querySelector('input[name="fullName"]')?.form;
      let submit = f && f.querySelector('button[type="submit"]');
      if (!submit) submit = document.querySelector('button[type="submit"]');
      submit && submit.click();
    });
    await wait(3000);
    const errSnippet = (await page.evaluate(() => document.body.innerText)).match(/.{0,30}(تعذّ|مسجّل|مطلوب|غير صالح|خطأ|حاول بعدة|موجود).{0,30}/g) || [];
    if (errSnippet.join("")) console.log("DEBUG create error:", errSnippet.join(" || "));

    const managerRowSeen = await page.evaluate((email) => {
      return [...document.querySelectorAll("tr")].some((tr) => (tr.textContent || "").includes(email));
    }, MANAGER_EMAIL);
    ok("admin sees new manager row", managerRowSeen, MANAGER_EMAIL);

    const mgrInDb = await db.query(`SELECT id, role FROM "User" WHERE email = $1`, [MANAGER_EMAIL]);
    ok("manager user created in DB", mgrInDb.rows.length === 1 && mgrInDb.rows[0].role === "TEAM_MANAGER", mgrInDb.rows[0]?.role || "missing");
    const mgrUserId = mgrInDb.rows.length === 1 ? mgrInDb.rows[0].id : "none";
    const linked = await db.query(
      `SELECT 1 FROM "_TeamManagers" WHERE ("A" = $1 AND "B" = $2) OR ("A" = $2 AND "B" = $1)`,
      [teamAId, mgrUserId]
    );
    ok("manager linked to team A", linked.rows.length === 1, "");

    // ================= Manager login -> should land on /manage =================
    await page.goto(BASE + "/login", { waitUntil: "load", timeout: 90000 });
    await page.waitForSelector("#email");
    await page.type("#email", MANAGER_EMAIL);
    await page.type("#password", MANAGER_PW);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 90000 }).catch(() => {}),
      page.evaluate(() => {
        const b = [...document.querySelectorAll("button")].find((x) => x.type === "submit" || /دخول/.test(x.textContent || ""));
        if (b) b.click();
      }),
    ]);
    await wait(2500);

    let url = page.url();
    ok("manager redirected to /manage after login", url.includes("/manage"), url);
    if (!url.includes("/manage")) {
      await page.goto(BASE + "/manage", { waitUntil: "load", timeout: 90000 });
      await wait(1200);
    }

    const cardNames = async () =>
      (await page.evaluate(() => [...document.querySelectorAll("h2")].map((h2) => h2.textContent || "").filter((t) => t.includes("فريق QA "))));

    const cards1 = await cardNames();
    ok("portal shows team A card", cards1.includes(`فريق QA أ ${TAG}`), JSON.stringify(cards1));
    ok("portal does NOT show team B card", !cards1.includes(`فريق QA ب ${TAG}`), JSON.stringify(cards1));
    ok("portal shows upcoming match", (await page.evaluate(() => document.body.innerText)).includes("ضد"), "");
    const confirmBtn = await page.evaluate((squadId) => {
      const cards = [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").includes("تأكيد القائمة"));
      return { n: cards.length, firstNear: cards.length > 0 };
    });
    ok("portal shows ONE confirm button (only own squad)", confirmBtn.n === 1, `n=${confirmBtn.n}`);
    const editingCtrl = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].map((b) => b.textContent || "");
      const hasScoreInput = document.querySelectorAll('input[type="number"], input[name*="score"], select[name*="card"], select[name*="goal"]').length > 0;
      return { bad: btns.some((t) => /حفظ النتيجة|تعديل|حذف|إضافة/.test(t)), hasScoreInput };
    });
    ok("portal shows NO result-editing controls", !(editingCtrl.bad || editingCtrl.hasScoreInput), JSON.stringify(editingCtrl));

    // portal must NOT show team B squad confirm — only 1 button confirmed above.

    // ================= Manager confirms own squad =================
    await clickByText(page, "button", "تأكيد القائمة");
    await wait(2000);

    const squadAfter = await db.query(`SELECT status FROM "MatchSquad" WHERE id = $1`, [squadAId]);
    ok("own squad confirmed in DB", squadAfter.rows[0]?.status === "CONFIRMED", squadAfter.rows[0]?.status || "missing");

    const afterText = await page.evaluate(() => document.body.innerText);
    ok("confirm button gone after confirmation", !(afterText.includes("تأكيد القائمة")), "");

    // ================= Manager denied /admin =================
    await page.goto(BASE + "/admin", { waitUntil: "load", timeout: 90000 });
    await wait(1500);
    url = page.url();
    ok("manager blocked from /admin (redirects to login)", url.includes("/login"), url);

    // ================= Scoping: linking team B shows its squad =================
    await db.query(`INSERT INTO "_TeamManagers" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`, [teamBId, mgrUserId]);
    await page.goto(BASE + "/manage", { waitUntil: "load", timeout: 90000 });
    await wait(1200);
    const cards2 = await cardNames();
    ok("portal now shows team B card after linking", cards2.includes(`فريق QA ب ${TAG}`), JSON.stringify(cards2));
    const btn2 = await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").includes("تأكيد القائمة")).length);
    ok("portal shows confirm button for team B too", btn2 === 1, `n=${btn2}`);

    await db.query(`DELETE FROM "_TeamManagers" WHERE "A" = $1 AND "B" = $2`, [teamBId, mgrUserId]);
    await page.goto(BASE + "/manage", { waitUntil: "load", timeout: 90000 });
    await wait(1200);
    const cards3 = await cardNames();
    ok("team B removed from portal after unlink", !cards3.includes(`فريق QA ب ${TAG}`), JSON.stringify(cards3));

    // ================= Non-manager role untouched: FAN dashboard still works =================
    await page.goto(BASE + "/");
    await wait(800);
    ok("public homepage still renders", (await page.evaluate(() => document.body.innerText)).length > 50, "");

    await browser.close();
    console.log("\nRESULT:", pass, "passed /", fail, "failed");
    await finish(fail > 0 ? 1 : 0);
  } catch (e) {
    console.error("ERROR:", e && e.stack ? e.stack : e);
    fail++;
    console.log("\nRESULT:", pass, "passed /", fail, "failed");
    await finish(1);
  }

  async function finish(code) {
    await cleanup();
    const left = await db.query(
      `SELECT (SELECT count(*) FROM "Team" WHERE name LIKE 'فريق QA%') AS teams,
              (SELECT count(*) FROM "User" WHERE email LIKE 'manager.qa-%') AS users`
    ).catch(() => ({ rows: [{ teams: "?", users: "?" }] }));
    console.log("CLEANUP leftover teams:", left.rows[0].teams, "| users:", left.rows[0].users);
    await db.end().catch(() => {});
    process.exit(code);
  }
})();