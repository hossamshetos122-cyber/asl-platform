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

async function waitForText(page, text, timeout = 20000) {
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
    `SELECT towp."positionSlot", u."fullName", p.rating, towp.captain
     FROM "TeamOfTheWeekPlayer" towp
     JOIN "Player" p ON p.id = towp."playerId"
     JOIN "User" u ON u.id = p."userId"
     WHERE towp."teamOfTheWeekId" = (SELECT id FROM "TeamOfTheWeek" ORDER BY "createdAt" DESC LIMIT 1)
     ORDER BY towp."sortOrder" ASC`);
  const first = seeded.rows[0] ?? {};
  const captainName = seeded.rows.find((r) => r.captain)?.fullName ?? first.fullName ?? null;

  const candidates = await db.query(
    `SELECT p.id, u."fullName"
     FROM "TeamMembership" tm
     JOIN "Player" p ON p.id = tm."playerId"
     JOIN "User" u ON u.id = p."userId"
     WHERE tm.status = 'ACTIVE'
       AND p.id NOT IN (SELECT "playerId" FROM "TeamOfTheWeekPlayer")
     ORDER BY u."fullName"
     LIMIT 2`);
  const candA = candidates.rows[0]?.fullName ?? null;
  const candB = candidates.rows[1]?.fullName ?? null;
  const activeCount = await db.query(
    `SELECT count(DISTINCT tm."playerId")::int AS n FROM "TeamMembership" tm WHERE tm.status = 'ACTIVE'`);
  const registeredPlayers = activeCount.rows[0]?.n ?? 0;

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

    // 1b. MOBILE 375px (iPhone) — the pitch must be compact, readable, no horizontal scroll
    const mpage = await browser.newPage();
    await mpage.setViewport({ width: 375, height: 812 });
    await mpage.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
    const mob = await mpage.evaluate((ratingsArr, namesArr) => {
      const panel = document.querySelector("[data-team-of-week]");
      if (!panel) return { found: false };
      const vw = window.innerWidth;
      const doc = document.documentElement.scrollWidth;
      const shields = [...panel.querySelectorAll("div")].filter((el) => (window.getComputedStyle(el).clipPath || "").startsWith("polygon"));
      const rect = shields[0]?.getBoundingClientRect();
      const cardW = rect ? rect.width : 0;
      const panelH = panel.getBoundingClientRect().height;
      const tops = [...new Set(shields.map((s) => Math.round(s.getBoundingClientRect().top)))];
      const badge = shields
        .map((s) =>
          [...s.querySelectorAll("div")].find((d) =>
            [...d.childNodes].some((n) => n.nodeType === 3 && ratingsArr.includes((n.textContent || "").trim()))
          )
        )
        .filter(Boolean)[0];
      const texts = shields.map((s) => {
        const p = [...s.parentElement.querySelectorAll("p")];
        return { name: p[0]?.textContent || "", label: p[1]?.textContent || "" };
      });
      const overflowing = [...panel.querySelectorAll("p")]
        .filter((el) => el.scrollWidth > el.clientWidth + 2)
        .map((el) => (el.textContent || "").slice(0, 20));
      const overlap = (a, b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
      let avatarTouches = 0;
      for (const s of shields) {
        const parent = s.parentElement;
        const caps = parent.textContent || "";
        const imgs = [...parent.querySelectorAll("img")];
        const coin = imgs.find((i) => namesArr.includes(i.alt));
        const crest = imgs.find((i) => i !== coin);
        if (!coin || !crest) continue;
        const c = coin.getBoundingClientRect();
        const t = crest.getBoundingClientRect();
        if (overlap({ x: c.x, y: c.y, w: c.width, h: c.height }, { x: t.x, y: t.y, w: t.width, h: t.height })) avatarTouches++;
      }
      return { found: true, vw, doc, shields: shields.length, rows: tops.length, cardW, panelH, badgeH: badge?.getBoundingClientRect().height || 0, texts, overflowing, avatarTouches };
    }, seeded.rows.map((r) => String(r.rating)), seeded.rows.map((r) => r.fullName));
    ok("MOBILE panel found at 375px", mob.found, "present");
    ok("MOBILE no horizontal scroll", mob.found && mob.doc <= mob.vw + 2, `scrollW=${mob.doc} vw=${mob.vw}`);
    ok("MOBILE all 11 shields rendered", mob.found && mob.shields >= 11, `shields=${mob.shields}`);
    ok("MOBILE 4-player bands stay on one line (4 rows total)", mob.found && mob.rows === 4, `rows=${mob.rows}`);
    ok("MOBILE compact card width", mob.found && mob.cardW > 44 && mob.cardW <= 80, `cardW=${mob.cardW.toFixed(1)}px`);
    ok("MOBILE pitch panel compact height", mob.found && mob.panelH <= 1200, `panelH=${mob.panelH.toFixed(0)}px`);
    ok("MOBILE rating badge still visible", mob.found && mob.badgeH >= 20, `badgeH=${mob.badgeH.toFixed(1)}px`);
    ok("MOBILE names + labels all present", mob.found && mob.texts.length >= 11 && mob.texts.every((t) => t.name && t.label), `texts=${mob.texts.length}`);
    ok("MOBILE no text cut/overlap", mob.found && mob.overflowing.length === 0, mob.overflowing.length ? mob.overflowing.join(" | ") : "clean");
    ok("MOBILE crest does not touch avatar ring", mob.found && mob.avatarTouches === 0, `touches=${mob.avatarTouches}`);
    await mpage.close();

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

    // REAL-click helpers: drive the actual input pipeline (respects pointer-events + scroll hit-testing).
    const clickAt = async (finder, ...args) => {
      const pt = await page.evaluate(finder, ...args);
      if (!pt) return false;
      await page.mouse.click(pt.x, pt.y);
      await sleep(700);
      return true;
    };
    const counterText = () =>
      page.evaluate(() => {
        const s = [...document.querySelectorAll("span")].find((sp) => (sp.textContent || "").includes("/ 11 لاعب"));
        return s ? s.textContent.trim() : "";
      });
    const hasCard = (name) =>
      page.evaluate(
        (n) =>
          [...document.querySelectorAll("button")].some(
            (b) => (b.textContent || "").includes(n) && b.getAttribute("title") === "اضغط لتغيير اللاعب"
          ),
        name
      );
    const columnControls = async (name, control) => {
      const card = [...document.querySelectorAll("button")].find(
        (b) => (b.textContent || "").includes(name) && b.getAttribute("title") === "اضغط لتغيير اللاعب"
      );
      if (!card) return null;
      const btn = [...card.parentElement.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === control);
      if (!btn) return null;
      btn.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 350));
      const r = btn.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    };
    // 3. REAL-CLICK × removes the player, slot turns into an empty placeholder instantly
    const removed = await clickAt(columnControls, first.fullName ?? "", "×");
    ok("ADMIN × real-click removes player", removed === true, first.fullName || "?");
    ok("ADMIN slot emptied instantly without refresh (10/11)", (await counterText()).startsWith("10 / 11"), await counterText());
    ok("ADMIN empty placeholder appears", await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => (b.textContent || "").trim().startsWith("+"))), "plus box present");
    ok("ADMIN removed player gone from pitch", !(await hasCard(first.fullName ?? "__none__")), first.fullName || "?");

    // 4. REAL-CLICK the empty placeholder -> picker opens, refill the slot
    const ph = await clickAt(async () => {
      const b = [...document.querySelectorAll("button")].find((bb) => (bb.textContent || "").trim().startsWith("+"));
      if (!b) return null;
      b.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 350));
      const r = b.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    ok("ADMIN empty slot (placeholder) real-click opens picker", ph === true, "modal");
    if (candA) {
      await page.type('input[placeholder="ابحث بالاسم..."]', candA);
      await sleep(800);
      const pickA = await clickAt((name) => {
        const overlay = [...document.querySelectorAll("div")].find((el) => String(el.className || "").includes("z-[60]"));
        const btn = [...(overlay ? overlay.querySelectorAll("button") : [])].find((b) => (b.textContent || "").includes(name));
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }, candA);
      ok("ADMIN candidate A picked via real click", pickA === true, candA);
    }
    ok("ADMIN refilled slot instantly without refresh (11/11)", (await counterText()).startsWith("11 / 11"), await counterText());
    ok("ADMIN candA now on pitch", candA ? await hasCard(candA) : true, candA || "skip");

    // 5. REAL-CLICK تبديل on a filled slot -> picker lists EVERY registered player, same slot swapped
    const couldSwap = !!(candA && candB);
    if (couldSwap) {
      const swapBtn = await clickAt(columnControls, candA, "تبديل");
      ok("ADMIN تبديل real-click opens picker", swapBtn === true, candA);
      if (swapBtn) {
        const nRows = await page.evaluate(() => {
          const overlay = [...document.querySelectorAll("div")].find((el) => String(el.className || "").includes("z-[60]"));
          const grid = overlay ? overlay.querySelector("div.grid") : null;
          return grid ? grid.querySelectorAll("button").length : 0;
        });
        ok("ADMIN picker lists every registered player (not just current XI)", nRows >= registeredPlayers && registeredPlayers >= 11, `rows=${nRows} registered=${registeredPlayers}`);
        await page.type('input[placeholder="ابحث بالاسم..."]', candB);
        await sleep(800);
        const pickB = await clickAt((name) => {
          const overlay = [...document.querySelectorAll("div")].find((el) => String(el.className || "").includes("z-[60]"));
          const btn = [...(overlay ? overlay.querySelectorAll("button") : [])].find((b) => (b.textContent || "").includes(name));
          if (!btn) return null;
          const r = btn.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        }, candB);
        ok("ADMIN candidate B picked via تبديل", pickB === true, candB);
      }
    }
    ok("ADMIN swapped instantly without refresh (11/11)", (await counterText()).startsWith("11 / 11"), await counterText());
    ok("ADMIN candB now on pitch in same slot", candB ? await hasCard(candB) : true, candB || "skip");
    if (couldSwap) ok("ADMIN candA left the pitch", !(await hasCard(candA)), candA || "skip");

    // 6. REAL-CLICK save -> new week persisted & visible on home
    const saved = await clickAt(async () => {
      const b = [...document.querySelectorAll("button")].find((bb) => (bb.textContent || "").trim().startsWith("حفظ فريق"));
      if (!b) return null;
      b.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 350));
      const r = b.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    ok("ADMIN save new week succeeds (real click)", saved && (await waitForText(page, "تم حفظ فريق الأسبوع بنجاح")), "success message");
    ok("DB two weeks after save", (await countWeeks()) === 2, `weeks=2`);
    if (candB) {
      const p2 = await homeInnerText(page);
      ok("HOME reflects swapped player", p2.includes(candB), candB);
    }

    // 7. REAL-CLICK delete the latest week from history
    await page.goto(BASE + "/admin/team-of-week", { waitUntil: "networkidle2", timeout: 45000 });
    const del = await clickAt(async () => {
      const btn = [...document.querySelectorAll("tbody button")].find((b) => /حذف/.test(b.textContent || ""));
      if (!btn) return null;
      btn.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 350));
      const r = btn.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    ok("ADMIN delete latest week (real click)", del && (await waitForText(page, "تم حذف فريق الأسبوع.")), "delete message");
    ok("DB back to one week", (await countWeeks()) === 1, `weeks=1`);
    const p3 = await homeInnerText(page);
    ok("HOME restored previous week", first.fullName && p3.includes(first.fullName), first.fullName || "?");
    if (candB) ok("HOME dropped swapped player", !p3.includes(candB), candB || "?");

    // 8. Restore demo XI
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
