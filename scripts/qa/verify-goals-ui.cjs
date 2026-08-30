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

    await page.goto(BASE + "/admin/matches", { waitUntil: "networkidle0", timeout: 60000 });

    // 1. FINISHED match with a recorded score -> open goals panel, check prefilled scorers
    const finishedInfo = await page.evaluate(() => {
      for (const tr of document.querySelectorAll("tr")) {
        const btn = [...tr.querySelectorAll("button")].find((b) => b.textContent && b.textContent.includes("تحديث النتيجة والأهداف"));
        if (!btn) continue;
        const scoreCell = [...tr.querySelectorAll("td")].find((td) => /^\s*\d+\s*-\s*\d+\s*$/.test(td.textContent || ""));
        if (!scoreCell) continue;
        const parts = (scoreCell.textContent || "").trim().split("-").map((s) => parseInt(s, 10));
        if (parts[0] + parts[1] === 0) continue;
        return { clickable: true, score: parts };
      }
      return { clickable: false };
    });
    ok("FINISHED row with goals has score button", finishedInfo.clickable === true, finishedInfo.score ? `score ${finishedInfo.score[0]}-${finishedInfo.score[1]}` : "n/a");

    if (finishedInfo.clickable) {
      const clicked = await page.evaluate(() => {
        for (const tr of document.querySelectorAll("tr")) {
          const btn = [...tr.querySelectorAll("button")].find((b) => b.textContent && b.textContent.includes("تحديث النتيجة والأهداف"));
          if (!btn) continue;
          const scoreCell = [...tr.querySelectorAll("td")].find((td) => /^\s*\d+\s*-\s*\d+\s*$/.test(td.textContent || ""));
          if (!scoreCell) continue;
          const parts = (scoreCell.textContent || "").trim().split("-").map((s) => parseInt(s, 10));
          if (parts[0] + parts[1] === 0) continue;
          btn.click();
          return true;
        }
        return false;
      });
      await new Promise((r) => setTimeout(r, 1200));

      const panel = await page.evaluate(() => {
        const text = document.body.innerText;
        const panelSelects = [...document.querySelectorAll("select")].filter((s) => !s.name);
        const filled = panelSelects.filter((s) => s.value !== "").map((s) => s.selectedOptions[0]?.textContent?.trim());
        const hasPanel = text.includes("أهداف") && text.includes("حفظ النتيجة والأهداف");
        const cancelBtn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "إلغاء");
        return { selectCount: panelSelects.length, filledCount: filled.length, filled, hasPanel, hasClose: !!cancelBtn };
      });
      ok("CLICK opens goals panel", clicked && panel.hasPanel, `panel=${panel.hasPanel}`);
      ok("GOAL dropdowns == score total", panel.selectCount === finishedInfo.score[0] + finishedInfo.score[1], `selects=${panel.selectCount} score=${finishedInfo.score[0]}+${finishedInfo.score[1]}`);
      ok("PREFILLED scorers present", panel.filledCount > 0, panel.filled.slice(0, 5).join(" | "));
      if (panel.hasClose) {
        await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "إلغاء"); if (b) b.click(); });
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    // 2. Overdue SCHEDULED match -> "إدخال النتيجة والأهداف" opens with 0 dropdowns by default
    const overdueInfo = await page.evaluate(() => {
      const trs = [...document.querySelectorAll("tr")];
      for (const tr of trs) {
        const text = tr.textContent || "";
        if (!text.includes("إدخال النتيجة والأهداف")) continue;
        const statusBadge = [...tr.querySelectorAll("span")].map((s) => s.textContent.trim());
        return { hasBtn: true, badges: statusBadge.filter(Boolean).slice(0, 6) };
      }
      return { hasBtn: false };
    });
    ok("OVERDUE row has result button", overdueInfo.hasBtn, overdueInfo.badges ? overdueInfo.badges.join(",") : "n/a");

    if (overdueInfo.hasBtn) {
      const clicked = await page.evaluate(() => {
        const trs = [...document.querySelectorAll("tr")];
        for (const tr of trs) {
          const btn = [...tr.querySelectorAll("button")].find((b) => b.textContent && b.textContent.includes("إدخال النتيجة والأهداف"));
          if (btn) { btn.click(); return true; }
        }
        return false;
      });
      await new Promise((r) => setTimeout(r, 1000));
      const panel = await page.evaluate(() => {
        const text = document.body.innerText;
        const panelSelects = [...document.querySelectorAll("select")].filter((s) => !s.name);
        return { hasTeamNames: text.includes("تسجيل نتيجة"), goalsSelects: panelSelects.length, hasSave: text.includes("حفظ النتيجة والأهداف") };
      });
      ok("PANEL opens for overdue (default 0-0)", clicked && panel.hasTeamNames && panel.goalsSelects === 0 && panel.hasSave, `goals selects=${panel.goalsSelects}`);
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