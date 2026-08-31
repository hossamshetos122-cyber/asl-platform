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

function runSeed(args) {
  execFileSync(process.execPath, [path.join(__dirname, "seed-team-of-week.cjs"), ...args], { stdio: "inherit" });
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

async function homeText(page) {
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
  return page.evaluate(() => document.body.innerText);
}

async function homePanelInfo(page) {
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
  return page.evaluate(() => {
    const panel = document.querySelector("[data-team-of-week]");
    if (!panel) return null;
    const cards = panel.querySelectorAll("img[alt]:not([class*='team-logo'])");
    const count = panel.querySelectorAll("div").length;
    return {
      exists: !!panel,
      playerImgs: panel.querySelectorAll("img").length,
      text: panel.innerText.slice(0, 400),
    };
  });
}

(async () => {
  if (!EMAIL || !PASSWORD || !DATABASE_URL) {
    console.log("SKIP: ROTATE_ADMIN_EMAIL / ROTATE_ADMIN_PASSWORD / DATABASE_URL not found");
    process.exit(0);
  }

  runSeed([]);
  const db = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();
  const seeded = await db.query(
    `SELECT tow."playerId", u."fullName", tow.position
     FROM "TeamOfWeekPlayer" tow
     JOIN "Player" p ON p.id = tow."playerId"
     JOIN "User" u ON u.id = p."userId"
     ORDER BY tow."sortOrder" ASC`);
  const name0 = seeded.rows[0]?.fullName ?? null;

  const browser = await launch();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 900 });

    // 1. HOME shows the seeded XI
    const p1 = await homeText(page);
    ok("HOME Team of the Week titles", p1.includes("فريق الأسبوع") && p1.includes("تشكيلة الأسبوع"), "titles present");
    ok("HOME XI badge", /XI/.test(p1), "XI badge present");
    const groupLabels = ["حارس المرمى", "خط الدفاع", "خط الوسط", "خط الهجوم"].filter((l) => p1.includes(l));
    ok("HOME position group labels", groupLabels.length >= 1, groupLabels.join(" / ") || "none");
    ok("HOME seeded best player rendered", name0 && p1.includes(name0), name0 || "?");

    const panel = await homePanelInfo(page);
    ok("HOME panel exists with player photos", !!panel && panel.playerImgs >= 10, `img count=${panel?.playerImgs ?? 0}`);

    // 2. LOGIN
    await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 45000 });
    await page.waitForSelector("#email");
    await page.type("#email", EMAIL);
    await page.type("#password", PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 45000 }).catch(() => {}),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((b) => /دخول|تسجيل/i.test(b.textContent || "") || b.type === "submit");
        if (btn) btn.click();
      }),
    ]);
    await new Promise((r) => setTimeout(r, 2000));
    ok("LOGIN as admin", /dashboard|admin/.test(page.url()), page.url());

    // 3. ADMIN lineup builder
    await page.goto(BASE + "/admin/team-of-week", { waitUntil: "networkidle2", timeout: 45000 });
    const adminText = await page.evaluate(() => document.body.innerText);
    ok("ADMIN page renders lineup builder", adminText.includes("تشكيلة الأسبوع") && adminText.includes("اختر اللاعب"), "builder present");
    ok("ADMIN sidebar nav has link", /فريق الأسبوع/.test(adminText), "sidebar/item present");
    ok("ADMIN shows seeded player in build table", name0 && adminText.includes(name0), name0 || "?");

    const slotCount = await page.evaluate(() =>
      document.querySelectorAll("tbody tr").length);
    ok("ADMIN build table has 11 slots", slotCount === 11, `rows=${slotCount}`);

    // 4. Swap slot 1 to a different player via UI
    const swapInfo = await page.evaluate(() => {
      const playerSelects = [...document.querySelectorAll("tbody tr select")];
      const slot1 = playerSelects[1]; // 2nd select of row 1 (player select)
      if (!slot1) return { ok: false, reason: "no slot1 select" };
      const current = slot1.value;
      const alt = [...slot1.options].find((o) => o.value && o.value !== current);
      if (!alt) return { ok: false, reason: "no alternative" };
      slot1.value = alt.value;
      slot1.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, label: alt.textContent.trim(), total: slot1.options.length };
    });
    ok("ADMIN swap slot1 available", swapInfo.ok && swapInfo.total > 11, swapInfo.reason || `options=${swapInfo.total}`);
    if (swapInfo.ok) {
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((b) => /حفظ تشكيلة الأسبوع/.test(b.textContent || ""));
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 3000));
      const newName = swapInfo.label.replace(/^\d+ — /, "");
      const p2 = await homeText(page);
      ok("HOME reflects swapped slot1", p2.includes(newName), newName);
    }

    // 5. Clear via UI -> home shows empty state
    await page.goto(BASE + "/admin/team-of-week", { waitUntil: "networkidle2", timeout: 45000 });
    const clearVisible = await page.evaluate(() =>
      [...document.querySelectorAll("button")].some((b) => /إزالة التشكيلة/.test(b.textContent || "")));
    ok("ADMIN clear button visible", clearVisible, "إزالة التشكيلة present");
    if (clearVisible) {
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((b) => /إزالة التشكيلة/.test(b.textContent || ""));
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 3000));
      const p3 = await homeText(page);
      ok("HOME empty state after clear", p3.includes("لم يتم اختيار تشكيلة الأسبوع بعد"), "empty message shown");
    }

    // 6. Restore demo XI and confirm
    runSeed([]);
    const p4 = await homeText(page);
    ok("HOME demo XI restored", name0 && p4.includes(name0), name0 || "?");

    console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
  } catch (err) {
    fail++;
    console.log("FAIL  script error =>", err.message);
    console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
    runSeed([]);
  } finally {
    await db.end();
    await browser.close();
  }
  process.exit(fail ? 1 : 0);
})();