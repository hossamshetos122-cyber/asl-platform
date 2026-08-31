const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
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

function runSeed() {
  execFileSync(process.execPath, [path.join(__dirname, "seed-team-of-week.cjs")], { stdio: "inherit" });
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

async function launch() {
  return puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1280,900"],
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function homeInnerText(page) {
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
  return page.evaluate(() => document.body.innerText);
}

async function waitForText(page, text, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const t = await page.evaluate(() => document.body.innerText);
    if (t.includes(text)) return true;
    await sleep(500);
  }
  return false;
}

(async () => {
  if (!EMAIL || !PASSWORD || !DATABASE_URL) {
    console.log("SKIP: ROTATE_ADMIN_EMAIL / ROTATE_ADMIN_PASSWORD / DATABASE_URL not found");
    process.exit(0);
  }

  runSeed();
  const db = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();

  const seeded = await db.query(
    `SELECT towp."positionSlot", u."fullName", p.rating, towp.captain, p.id AS "playerId"
     FROM "TeamOfTheWeekPlayer" towp
     JOIN "Player" p ON p.id = towp."playerId"
     JOIN "User" u ON u.id = p."userId"
     WHERE towp."teamOfTheWeekId" = (SELECT id FROM "TeamOfTheWeek" ORDER BY "createdAt" DESC LIMIT 1)
     ORDER BY towp."sortOrder" ASC`);
  const first = seeded.rows[0] ?? {};
  const captainName = seeded.rows.find((r) => r.captain)?.fullName ?? first.fullName ?? null;

  const candidate = await db.query(
    `SELECT p.id, u."fullName", p.rating
     FROM "TeamMembership" tm
     JOIN "Player" p ON p.id = tm."playerId"
     JOIN "User" u ON u.id = p."userId"
     WHERE tm.status = 'ACTIVE'
       AND p.id NOT IN (SELECT "playerId" FROM "TeamOfTheWeekPlayer")
     LIMIT 1`);
  const newName = candidate.rows[0]?.fullName ?? null;

  const countWeeks = async () => {
    const r = await db.query(`SELECT count(*)::int AS n FROM "TeamOfTheWeek"`);
    return r.rows[0].n;
  };

  const browser = await launch();
  const page = await browser.newPage();
  page.on("dialog", (d) => d.accept());

  try {
    await page.setViewport({ width: 1280, height: 900 });

    // 1. HOME shows the seeded pitch XI
    const p1 = await homeInnerText(page);
    ok("HOME Team of the Week title", p1.includes("فريق الأسبوع") && p1.includes("TEAM OF THE WEEK"), "titles present");
    ok("HOME shows formation 4-4-2", p1.includes("4-4-2"), "44 2 found");
    const slotLabels = ["حارس المرمى", "قلب دفاع أول", "قلب دفاع ثاني", "ظهير أيمن", "جناح أيسر", "رأس حربة"].filter((l) => p1.includes(l));
    ok("HOME pitch slot labels", slotLabels.length >= 4, slotLabels.join(" / ") || "none");
    ok("HOME seeded captain rendered", captainName && p1.includes(captainName), captainName || "?");

    const homeStyles = await page.evaluate(() => {
      const panel = document.querySelector("[data-team-of-week]");
      if (!panel) return { colors: [], count: 0, captain: false };
      const colors = [];
      let n = 0;
      for (const el of Array.from(panel.querySelectorAll("div"))) {
        const cls = String(el.className || "");
        if (!cls.includes("overflow-hidden")) continue;
        const style = window.getComputedStyle(el);
        if (style.borderTopWidth !== "0px") colors.push(style.borderTopColor);
        n++;
      }
      const captain = !!Array.from(panel.querySelectorAll("*")).find((el) => el.textContent === "C" && String(el.className || "").includes("bg-accent"));
      return { colors: [...new Set(colors)], count: n, captain };
    });
    ok("HOME tier colors (green+diamond+gold)", ["rgba(0, 214, 143, 0.7)", "rgba(46, 214, 245, 0.7)", "rgba(245, 197, 24, 0.7)"].every((c) => homeStyles.colors.includes(c)), homeStyles.colors.join(" | "));
    ok("HOME captain badge C", homeStyles.captain, "C badge present");
    ok("HOME rendered > 0 cards", homeStyles.count >= 11, `cards=${homeStyles.count}`);

    ok("DB seeded ratings persisted", seeded.rows.every((r) => typeof r.rating === "number"), `ratings=${seeded.rows.map((r) => r.rating).join(",")}`);
    ok("DB single week seeded", (await countWeeks()) === 1, `weeks=1`);

    // 2. ADMIN editor
    await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 45000 });
    await page.waitForSelector("#email");
    await page.type("#email", EMAIL);
    await page.type("#password", PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 45000 }).catch(() => {}),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((b) => /دخول|تسجيل/.test(b.textContent || "") || b.type === "submit");
        if (btn) btn.click();
      }),
    ]);
    await sleep(2200);
    ok("LOGIN as admin", /\/admin/.test(page.url()), page.url());

    await page.goto(BASE + "/admin/team-of-week", { waitUntil: "networkidle2", timeout: 45000 });
    const adminText = await page.evaluate(() => document.body.innerText);
    ok("ADMIN pitch editor renders", adminText.includes("حفظ فريق الأسبوع") && adminText.includes("اختر التشكيلة"), "editor present");
    ok("ADMIN formation default 4-4-2", adminText.includes("4-4-2"), "formation listed");

    const adminSel = await page.evaluate(() => {
      const selects = [...document.querySelectorAll("select")];
      const formationSel = selects.find((s) => [...s.options].some((o) => o.value === "4-4-2"));
      const slotBoxes = document.querySelectorAll("div.w-\\[104px\\], div.w-\\[112px\\]");
      return { formationValue: formationSel?.value ?? null, slotCount: slotBoxes.length };
    });
    ok("ADMIN 11 pitch slots", adminSel.slotCount >= 11, `boxes=${adminSel.slotCount}`);
    ok("ADMIN seeded player prefilled", adminText.includes(first.fullName ?? ""), first.fullName || "?");
    ok("ADMIN history row present", (await page.evaluate(() => document.querySelectorAll("tbody tr").length)) >= 1, ">=1 history rows");

    // 3. SWAP a player via the picker + save a new week via UI
    if (newName) {
      await page.evaluate((name) => {
        const btn = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes(name));
        if (btn) btn.click();
      }, first.fullName ?? "");
      await sleep(1200);
      const modalOpen = await page.evaluate(() => !!document.querySelector('input[placeholder="ابحث بالاسم..."]'));
      ok("ADMIN picker modal opens", modalOpen, "search input present");
      if (modalOpen) {
        await page.type('input[placeholder="ابحث بالاسم..."]', newName);
        await sleep(1200);
        const picked = await page.evaluate((name) => {
          const overlay = [...document.querySelectorAll("div")].find((el) => String(el.className || "").includes("z-[60]"));
          const list = overlay ? overlay.querySelectorAll("button") : document.querySelectorAll("button");
          const btn = [...list].find((b) => (b.textContent || "").includes(name));
          if (!btn) return false;
          btn.click();
          return true;
        }, newName);
        ok("ADMIN candidate selected", picked === true, newName);
        await sleep(1200);

        await page.evaluate(() => {
          const btn = [...document.querySelectorAll("button")].find((b) => /حفظ فريق الأسبوع/.test(b.textContent || ""));
          if (btn) btn.click();
        });
        const saved = await waitForText(page, "تم حفظ فريق الأسبوع بنجاح");
        ok("ADMIN save new week succeeds", saved, "success message");
        ok("DB two weeks after save", (await countWeeks()) === 2, `weeks=2`);
        const p2 = await homeInnerText(page);
        ok("HOME reflects swapped player", p2.includes(newName), newName);
      }
    }

    // 4. DELETE the latest week via history
    await page.goto(BASE + "/admin/team-of-week", { waitUntil: "networkidle2", timeout: 45000 });
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("tbody button")].find((b) => /حذف/.test(b.textContent || ""));
      if (btn) btn.click();
    });
    const deleted = await waitForText(page, "تم حذف فريق الأسبوع.");
    ok("ADMIN delete latest week", deleted, "delete message");
    ok("DB back to one week", (await countWeeks()) === 1, `weeks=1`);
    const p3 = await homeInnerText(page);
    ok("HOME restored previous week", first.fullName && p3.includes(first.fullName), first.fullName || "?");
    if (newName) ok("HOME dropped swapped player", !p3.includes(newName), newName || "?");

    // 5. Restore demo XI
    runSeed();
    const p4 = await homeInnerText(page);
    ok("HOME demo XI restored", first.fullName && p4.includes(first.fullName), first.fullName || "?");

    console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
  } catch (err) {
    fail++;
    console.log("FAIL  script error =>", err.message);
    console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
    try { runSeed(); } catch {}
  } finally {
    await db.end();
    await browser.close();
  }
  process.exit(fail ? 1 : 0);
})();