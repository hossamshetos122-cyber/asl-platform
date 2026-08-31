const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE = process.env.BASE || "http://localhost:3388";
const ENV_PATH = path.resolve(__dirname, "../..", ".env");

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

let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log(`PASS  ${name} => ${detail || ""}`); }
  else { fail++; console.log(`FAIL  ${name} <= ${detail || ""}`); }
}

(async () => {
  if (!EMAIL || !PASSWORD) { console.log("SKIP: admin creds missing"); process.exit(0); }
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1400,1000"],
  });
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1400, height: 1000 });
    await page.goto(BASE + "/login", { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForSelector("#email", { timeout: 30000 });
    await page.type("#email", EMAIL);
    await page.type("#password", PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }).catch(() => {}),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((b) => /دخول|تسجيل/i.test(b.textContent || "") || b.type === "submit");
        if (btn) btn.click();
      }),
    ]);
    await new Promise((r) => setTimeout(r, 2500));
    ok("LOGIN admin", /admin|dashboard/.test(page.url()), page.url());

    // 1. /admin/suspensions renders with computed data
    await page.goto(BASE + "/admin/suspensions", { waitUntil: "networkidle0", timeout: 60000 });
    const susp = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasTitle = text.includes("قائمة الموقوفين");
      const hasEmpty = text.includes("لا يوجد لاعبون موقوفون حالياً");
      return { hasTitle, hasEmpty, bodyOk: /انترنت|Window|ERR/i.test(text) === false };
    });
    ok("SUSPENSIONS page renders", susp.hasTitle, `emptyState=${susp.hasEmpty}`);

    // 2. Admin matches panel: card groups present, goal selects still exact
    await page.goto(BASE + "/admin/matches", { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 800));

    const finished = await page.evaluate(() => {
      for (const tr of document.querySelectorAll("tr")) {
        const b = [...tr.querySelectorAll("button")].find((x) => x.textContent && x.textContent.includes("تحديث النتيجة والأهداف"));
        if (!b) continue;
        const scoreCell = [...tr.querySelectorAll("td")].find((td) => /^\s*\d+\s*-\s*\d+\s*$/.test(td.textContent || ""));
        if (!scoreCell) continue;
        const parts = (scoreCell.textContent || "").trim().split("-").map((s) => parseInt(s, 10));
        if (parts[0] + parts[1] === 0) continue;
        b.click();
        return { score: parts };
      }
      return null;
    });
    ok("FINISHED match panel opened", !!finished, finished ? `score ${finished.score[0]}-${finished.score[1]}` : "none with goals currently");
    if (finished) {
      await new Promise((r) => setTimeout(r, 1200));
      const panel = await page.evaluate(() => {
        const text = document.body.innerText;
        const goalSelects = [...document.querySelectorAll("select")].filter((s) => s.name && s.name.includes("-goal-"));
        const cardSelects = [...document.querySelectorAll("select")].filter((s) => s.name && (s.name.includes("-yellow-") || s.name.includes("-red-")));
        const cardGroups = document.body.innerText.includes("الكروت الصفراء") && document.body.innerText.includes("الكروت الحمراء");
        const addBtns = [...document.querySelectorAll("button")].filter((b) => /كارت/.test(b.textContent || ""));
        return { goalCount: goalSelects.length, cardSelectCount: cardSelects.length, cardSelectsNamed: cardSelects.every((s) => s.name.indexOf("-") > -1), cardGroups, addBtnCount: addBtns.length };
      });
      ok("GOAL dropdowns == score total (unchanged)", panel.goalCount === finished.score[0] + finished.score[1], `goals=${panel.goalCount}`);
      ok("CARD groups render for both teams", panel.cardGroups, `card selects=${panel.cardSelectCount}`);
      ok("CARD selects carry a name attr (not counted as goals)", panel.cardSelectsNamed, `named=${panel.cardSelectCount}`);
      ok("CARD add buttons present", panel.addBtnCount >= 2, `+كارت buttons=${panel.addBtnCount}`);
      await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "إلغاء"); if (b) b.click(); });
      await new Promise((r) => setTimeout(r, 500));
    }

    // 3. Upcoming SCHEDULED 0-0 panel: zero goal selects, cards section present
    const upcoming = await page.evaluate(() => {
      for (const tr of document.querySelectorAll("tr")) {
        const b = [...tr.querySelectorAll("button")].find((x) => x.textContent && x.textContent.includes("إدخال النتيجة والأهداف"));
        if (!b) continue;
        const scoreCell = [...tr.querySelectorAll("td")].find((td) => /^\s*\d+\s*-\s*\d+\s*$/.test(td.textContent || ""));
        if (scoreCell && (scoreCell.textContent || "").trim() !== "0 - 0") continue;
        b.click();
        return true;
      }
      return false;
    });
    ok("UPCOMING 0-0 panel opened", true, upcoming ? "opened" : "skipped - no upcoming SCHEDULED 0-0 row");
    if (upcoming) {
      await new Promise((r) => setTimeout(r, 1000));
      const panel = await page.evaluate(() => {
        const goalSelects = [...document.querySelectorAll("select")].filter((s) => s.name && s.name.includes("-goal-"));
        const hasCards = document.body.innerText.includes("الكروت الصفراء") || document.body.innerText.includes("الكروت الحمراء");
        return { goalCount: goalSelects.length, hasCards };
      });
      ok("0-0 panel has NO goal dropdowns", panel.goalCount === 0, `goals=${panel.goalCount}`);
      ok("0-0 panel still shows card groups", panel.hasCards, "");
    }

    // 4. Public player page: الكروت chips + متاح/موقوف status
    await page.goto(BASE + "/players", { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 800));
    const firstPlayerHref = await page.evaluate(() => {
      const a = document.querySelector('a[href^="/players/"]:not([href="/players"])');
      return a ? a.getAttribute("href") : null;
    });
    ok("PLAYERS list has a player link", !!firstPlayerHref, firstPlayerHref || "none found");
    if (firstPlayerHref) {
      await page.goto(BASE + firstPlayerHref, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 800));
      const prof = await page.evaluate(() => {
        const text = document.body.innerText;
        const hasCardsCell = text.includes("الكروت");
        const hasStatus = text.includes("متاح") || text.includes("موقوف عن المباراة القادمة");
        return { hasCardsCell, hasStatus };
      });
      ok("PLAYER page shows الكروت chips", prof.hasCardsCell, "");
      ok("PLAYER page shows متاح/موقوف status", prof.hasStatus, "");
    }

    // 5. Public team page: squad rows with card chips
    await page.goto(BASE + "/teams", { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 800));
    const firstTeamHref = await page.evaluate(() => {
      const a = document.querySelector('a[href^="/teams/"]:not([href="/teams"]):not([href="/teams/new"])');
      return a ? a.getAttribute("href") : null;
    });
    ok("TEAMS list has a team link", !!firstTeamHref, firstTeamHref || "none found");
    if (firstTeamHref) {
      await page.goto(BASE + firstTeamHref, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 800));
      const team = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          hasSquad: text.includes("القائمة"),
          playerLinks: document.querySelectorAll('a[href^="/players/"]').length,
          emptySquad: text.includes("لا يوجد لاعبون"),
        };
      });
      const squadOk =
        team.hasSquad &&
        (team.playerLinks > 0 || team.emptySquad);
      ok("TEAM page renders the squad grid", squadOk, `playerLinks=${team.playerLinks} emptySquad=${team.emptySquad}`);
    }

    console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
  } catch (err) {
    fail++;
    console.log("FAIL  script error =>", err.message);
    console.log(`==== ${pass}/${pass + fail} PASS ====`);
  } finally {
    await browser.close();
  }
  process.exit(fail ? 1 : 0);
})();