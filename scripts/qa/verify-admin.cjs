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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = value;
  }
  return out;
}

const env = loadEnv(ENV_PATH);
const EMAIL = env.ROTATE_ADMIN_EMAIL;
const PASSWORD = env.ROTATE_ADMIN_PASSWORD;

let pass = 0;
let fail = 0;
let notes = [];

function ok(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`PASS  ${name} => ${detail || ""}`);
  } else {
    fail++;
    console.log(`FAIL  ${name} <= ${detail || ""}`);
  }
}

async function launch() {
  return puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1280,900"],
  });
}

(async () => {
  if (!EMAIL || !PASSWORD) {
    console.log("SKIP: ROTATE_ADMIN_EMAIL / ROTATE_ADMIN_PASSWORD not found in ../../.env");
    process.exit(0);
  }

  const browser = await launch();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 900 });
    // 1. LOGIN
    await page.goto(BASE + "/login", { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForSelector("#email", { timeout: 30000 });
    await page.type("#email", EMAIL);
    await page.type("#password", PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }).catch(() => {}),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")]
          .find((b) => /دخول|تسجيل/i.test(b.textContent || "") || b.type === "submit");
        if (btn) btn.click();
      }),
    ]);
    await new Promise((r) => setTimeout(r, 2500));
    ok("LOGIN as admin", /dashboard|admin/.test(page.url()), page.url());

    // 2. /admin dashboard alert panel
    await page.goto(BASE + "/admin", { waitUntil: "networkidle0", timeout: 60000 });
    const dashText = await page.evaluate(() => document.body.innerText);
    ok(
      "ADMIN dashboard overdue panel",
      dashText.includes("مباريات فات موعدها بدون نتيجة") || dashText.includes("لا توجد مباريات متأخرة بدون نتيجة"),
      dashText.slice(0, 80).replace(/\s+/g, " ") || "no text",
    );

    // 3. /admin/matches controls
    await page.goto(BASE + "/admin/matches", { waitUntil: "networkidle0", timeout: 60000 });
    const matchesText = await page.evaluate(() => document.body.innerText);
    ok("ADMIN matches overview", matchesText.includes("النتيجة") && matchesText.includes("الموعد"), "table headers/الموعد button");
    if (matchesText.includes("مباريات متأخرة بدون نتيجة")) {
      ok("ADMIN matches OVERDUE banner", matchesText.includes("حفظ وإنهاء"), "banner + result button present");
      notes.push("overdue banner shown => reschedule/result buttons on live table");
    } else {
      ok("ADMIN matches no-overdue state", true, "no overdue matches currently (banner hidden)");
    }

    // 4. /admin/players birthdate column
    await page.goto(BASE + "/admin/players", { waitUntil: "networkidle0", timeout: 60000 });
    const playersText = await page.evaluate(() => document.body.innerText);
    ok("ADMIN players birthdate column", playersText.includes("تاريخ الميلاد"), "header/field present");

    // 5. /admin/tournaments featured control
    await page.goto(BASE + "/admin/tournaments", { waitUntil: "networkidle0", timeout: 60000 });
    const toursText = await page.evaluate(() => document.body.innerText);
    ok("ADMIN tournaments featured control", toursText.includes("المميزة حاليًا") || toursText.includes("اجعلها المميزة"), "featured button/badge present");

    console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
    for (const n of notes) console.log("NOTE", n);
  } catch (err) {
    fail++;
    console.log("FAIL  script error =>", err.message);
    console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
  } finally {
    await browser.close();
  }
  process.exit(fail ? 1 : 0);
})();