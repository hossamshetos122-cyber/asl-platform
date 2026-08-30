const puppeteer = require("puppeteer-core");

const BASE = process.env.BASE || "http://localhost:3388";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const results = [];
let browser;
let passed = 0;
let failed = 0;

function check(label, ok, detail) {
  results.push({ label, ok, detail });
  if (ok) passed++;
  else failed++;
}

async function assertHas(selector, label) {
  try {
    const el = await (selector instanceof Function ? selector() : (async () => {
      const count = await selector.count();
      return { ok: count > 0 };
    })());
    check(label, !!el, `selector ${JSON.stringify(String(selector))}`);
  } catch (err) {
    check(label, false, err.message);
  }
}

async function getText(page, selector) {
  const el = await page.$(selector);
  return el ? (await el.evaluate((n) => n.textContent.trim())) : null;
}

async function main() {
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // --- Home ---
  let res = await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
  check("home loads 200", res.status() === 200, `status=${res.status()}`);
  const navLabel = await getText(page, "nav[aria-label='القائمة الرئيسية']");
  check("navbar renders", !!navLabel, JSON.stringify(navLabel));

  // --- Navbar scroll shadow ---
  await page.goto(BASE + "/teams", { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => window.scrollTo(0, 400));
  await new Promise((r) => setTimeout(r, 500));
  const scrolledClass = await page.evaluate(() => document.querySelector("nav").className);
  check("navbar gains scroll shadow", scrolledClass.includes("shadow-deep"), scrolledClass.slice(0, 160));
  await page.evaluate(() => window.scrollTo(0, 0));

  // --- Teams list stagger ---
  const teamsGridStagger = await page.$eval(".stagger-children", (el) => el.className.includes("stagger-children"));
  check("teams grid stagger-children", !!teamsGridStagger, "grid has stagger-children");
  const teamCount = await page.$$eval("main a[href^='/teams/']", (es) => es.filter((a) => {
    const h = a.getAttribute("href");
    return h && h !== "/teams/new";
  }).length);
  check("teams list has cards", teamCount > 0, `cards=${teamCount}`);
  const teamLinkHasAnimate = await page.evaluate(() => {
    const a = [...document.querySelectorAll("main a[href^='/teams/']")].find((x) => !x.href.endsWith("/new"));
    return a ? a.className.includes("animate-fade-up") : false;
  });
  check("team card animate-fade-up", !!teamLinkHasAnimate, "card has animation class");

  // --- Team detail: next fixture + crest glow + squad stagger ---
  let nextFixtureFound = false;
  for (const href of [...new Set((await page.$$eval(
      "main a[href^='/teams/']", (es) =>
        es.map((a) => a.getAttribute("href")).filter((h) => h && h !== "/teams/new"),
    )))].slice(0, 8)) {
    await page.goto(BASE + href, { waitUntil: "networkidle2", timeout: 60000 });
    const hasNextFixture = await page.evaluate(() => {
      return [...document.querySelectorAll("a")].some((a) => a.textContent.includes("المباراة القادمة"));
    });
    if (hasNextFixture) {
      nextFixtureFound = true;
const nfCard = await page.evaluate(() => {
      const a = [...document.querySelectorAll("a")].find((x) => x.textContent.includes("المباراة القادمة"));
      const glow = document.querySelector("div[style*='linear-gradient(135deg'");
      return a ? { animate: a.className.includes("animate-fade-up"), crestGlow: !!glow } : null;
    });
      check(`team [${href}] next-fixture card`, !!nfCard, JSON.stringify(nfCard));
      check(`team [${href}] + crest glow`, !!(nfCard && nfCard.crestGlow), "hero glow wrapper present");
      break;
    }
  }
  check("at least one team shows next fixture", nextFixtureFound, "Scheduled lg-up5/cup-final teams should all have nextFixture");
  if (nextFixtureFound) {
    const statsAnim = await page.$eval("main", (m) => [...m.querySelectorAll("div")].some((d) => d.className.includes("animate-fade-in")));
    check("team stats animate-fade-in", statsAnim, "stats grid had animate-fade-in");
    const squadStagger = await page.evaluate(() => {
      const g = [...document.querySelectorAll("main div")].find((d) => d.className.includes("stagger-children"));
      if (!g) return false;
      return [...g.children].every((c) => c.className.includes("animate-fade-up"));
    });
    check("squad stagger + fade-up rows", squadStagger, "grid stagger-children with fading rows");
  }

  // --- Players list stagger ---
  await page.goto(BASE + "/players", { waitUntil: "networkidle2", timeout: 60000 });
  const playersStagger = await page.$$eval(".stagger-children", (es) => es.length);
  check("players grid stagger-children", playersStagger > 0, `found ${playersStagger}`);
  const firstPlayerHref = await page.evaluate(() => {
    const a = [...document.querySelectorAll("main a[href^='/players/']")][0];
    return a ? a.getAttribute("href") : null;
  });
  check("players list has cards", !!firstPlayerHref, firstPlayerHref);

  // --- Player detail: player card hero ---
  await page.goto(BASE + firstPlayerHref, { waitUntil: "networkidle2", timeout: 60000 });
  check("player detail loads", (await page.content()).length > 500, "content ok");
  const hero = await page.evaluate(() => {
    const section = document.querySelector("main, section");
    const h1 = document.querySelector("h1");
    const chip = [...document.querySelectorAll("span")].find(
      (s) => s.className.includes("rounded") && s.style.borderColor && s.style.color,
    );
    const glow = [...document.querySelectorAll("div")].find((d) => d.style.background && d.style.background.includes("linear-gradient(135deg") && d.className.includes("rounded-full p-[4px]"));
    const watermark = [...document.querySelectorAll("span")].find((s) => s.className.includes("text-white/5") && s.className.includes("font-num"));
    const teamPill = [...document.querySelectorAll("a[href^='/teams/']")].find((a) => a.querySelector("img"));
    return {
      hasH1: !!h1,
      posChip: chip ? chip.style.color : null,
      glowRing: !!glow,
      watermark: watermark ? watermark.textContent.trim() : null,
      teamPill: teamPill ? teamPill.href : null,
    };
  });
  check("player card: name (h1)", hero.hasH1, "h1");
  check("player card: role-colored position chip", !!hero.posChip, `color=${hero.posChip}`);
  check("player card: glow-ring avatar", hero.glowRing, "gradient ring");
  check("player card: team pill link", !!hero.teamPill, hero.teamPill);

  // --- Match hero entrance animation ---
  await page.goto(BASE + "/matches/lg-up5", { waitUntil: "networkidle2", timeout: 60000 });
  const matchHero = await page.evaluate(() => {
    const d = [...document.querySelectorAll("div")].find((x) => x.className.includes("animate-fade-up") && x.className.includes("border-line"),);
    return !!d;
  });
  check("match hero animate-fade-up", matchHero, "hero entrance anim");

  // --- Footer ---
  const footerText = await getText(page, "footer");
  check("footer renders", !!footerText, (footerText || "").slice(0, 40));
}

main()
  .then(() => {
    console.log("VERIFY-POLISH RESULTS");
    for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} | ${r.label}${r.detail ? " | " + r.detail : ""}`);
    console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  })
  .catch((err) => {
    console.error("SCRIPT ERROR:", err && err.message ? err.message : err);
    failed++;
  })
  .finally(async () => {
    if (browser) await browser.close();
    console.log(`DONE: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
      process.exitCode = 1;
    }
  });