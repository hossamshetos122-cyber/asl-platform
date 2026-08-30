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

const TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

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

  try {
    const found = await db.query(
      `SELECT m.id, m.venue, m."venueImageUrl", m.status, m."homeScore", m."awayScore", m."kickoffAt",
              ht.name AS "homeName", at.name AS "awayName"
       FROM "Match" m
       JOIN "Team" ht ON ht.id = m."homeTeamId"
       JOIN "Team" at ON at.id = m."awayTeamId"
       WHERE m.status = 'SCHEDULED' AND m.venue IS NOT NULL
       ORDER BY m."kickoffAt" ASC LIMIT 1`
    );
    if (found.rows.length === 0) { console.log("SKIP: no SCHEDULED match with a venue"); process.exit(0); }
    const match = found.rows[0];
    const originalImage = match.venueImageUrl;
    const venueName = match.venue;
    console.log("TARGET:", match.homeName, "vs", match.awayName, "|", match.id, "| venue:", venueName);

    await db.query(`UPDATE "Match" SET "venueImageUrl" = $2 WHERE id = $1`, [match.id, TINY_PNG]);

    const browser = await puppeteer.launch({
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: "new",
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1400,1000"],
    });
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1400, height: 1000 });

      // 1. Public detail page
      await page.goto(BASE + `/matches/${match.id}`, { waitUntil: "load", timeout: 90000 });
      await new Promise((r) => setTimeout(r, 800));
      const detail = await page.evaluate(() => {
        const text = document.body.innerText;
        const imgs = [...document.querySelectorAll("img")].map((i) => i.getAttribute("src") || "").filter((s) => s.startsWith("data:image/png"));
        return { hasLabel: text.includes("الملعب"), imgs };
      });
      ok("detail page shows venue label", detail.hasLabel, "");
      ok("detail page shows venue name", detail.hasLabel && textIncludesVenue(await page.evaluate(() => document.body.innerText), venueName), "");
      ok("detail page shows venue image", detail.imgs.length > 0, `imgs=${detail.imgs.length}`);

      // 2. Public matches list
      await page.goto(BASE + "/matches", { waitUntil: "load", timeout: 90000 });
      await new Promise((r) => setTimeout(r, 800));
      const listName = await page.evaluate(() => document.body.innerText);
      ok("matches list shows venue name", textIncludesVenue(listName, venueName), venueName);

      // 3. Admin schedule edit form shows venue image picker + supplied values
      await page.goto(BASE + "/login", { waitUntil: "load", timeout: 90000 });
      await page.waitForSelector("#email");
      await page.type("#email", EMAIL);
      await page.type("#password", PASSWORD);
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load", timeout: 90000 }).catch(() => {}),
        page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((x) => x.type === "submit" || /دخول|تسجيل/.test(x.textContent || ""));
          if (b) b.click();
        }),
      ]);
      await new Promise((r) => setTimeout(r, 2500));

      await page.goto(BASE + "/admin/matches", { waitUntil: "load", timeout: 90000 });
      await new Promise((r) => setTimeout(r, 1000));
      const openedSched = await page.evaluate(({ hn, an }) => {
        for (const tr of document.querySelectorAll("tr")) {
          const text = tr.textContent || "";
          if (!text.includes(hn) || !text.includes(an)) continue;
          const btn = [...tr.querySelectorAll("button")].find((b) => b.textContent && b.textContent.includes("الموعد"));
          if (!btn) return false;
          btn.click();
          return true;
        }
        return false;
      }, { hn: match.homeName, an: match.awayName });
      ok("admin 'الموعد' panel opened", openedSched);
      await new Promise((r) => setTimeout(r, 900));
      const sched = await page.evaluate(() => {
        const text = document.body.innerText;
        const imgs = [...document.querySelectorAll("img")].map((i) => i.getAttribute("src") || "").filter((s) => s.startsWith("data:image/png"));
        const venueInput = [...document.querySelectorAll("input[name='venue']")][0]?.value || "";
        return {
          hasVenueLabel: text.includes("صورة الملعب"),
          hasPreview: imgs.length > 0,
          venueInputVal: venueInput,
        };
      });
      ok("schedule form has venue image picker", sched.hasVenueLabel, "");
      ok("schedule form pre-supplies venue image preview", sched.hasPreview, `imgs=${sched.hasPreview}`);
      ok("schedule form pre-supplies venue name", sched.venueInputVal.includes?.(venueName) ?? false, sched.venueInputVal.trim() || "empty");

      // Restore exact prior state
      await db.query(`UPDATE "Match" SET "venueImageUrl" = $2 WHERE id = $1`, [match.id, originalImage]);
      const restored = await db.query(
        `SELECT "venueImageUrl", "status", "homeScore", "awayScore", "kickoffAt" FROM "Match" WHERE id = $1`, [match.id]);
      const r = restored.rows[0];
      const kickOk = new Date(r.kickoffAt).getTime() === new Date(match.kickoffAt).getTime();
      ok("DB restored exactly", r.venueImageUrl === originalImage && r.status === match.status && r.homeScore === match.homeScore && r.awayScore === match.awayScore && kickOk, `img restored=${r.venueImageUrl === originalImage}`);

      console.log(`\n==== ${pass}/${pass + fail} PASS ====`);
    } catch (err) {
      fail++;
      console.log("FAIL  script error =>", err.message);
      console.log(`==== ${pass}/${pass + fail} PASS ====`);
    } finally {
      await browser.close();
      await db.query(`UPDATE "Match" SET "venueImageUrl" = $2 WHERE id = $1`, [match.id, originalImage]).catch(() => {});
    }
    process.exit(fail ? 1 : 0);
  } catch (err) {
    console.log("FAIL  db error =>", err.message);
    process.exit(1);
  }
})();

function textIncludesVenue(text, venueName) {
  return text.includes(venueName);
}