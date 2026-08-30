/*
 * Phase 3 verification v3:
 *  - DB date baselines come from `AT TIME ZONE 'UTC'` SQL text (node-pg
 *    parses offset-less timestamptz as the local zone, shifting -3h).
 *  - DOM is normalized: Arabic-Indic digits -> ASCII, React comments stripped.
 *  - Standings/scorers parsed by <tbody>/<tr> rows (names also appear in
 *    streamed RSC flight JSON, which broke naive indexOf slicing).
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const PROJECT = "C:\\Users\\Enter Computer\\OneDrive\\Desktop\\asl-platform 2";
const envFile = fs.readFileSync(path.join(PROJECT, ".env"), "utf8");
const DATABASE_URL = envFile.match(/DATABASE_URL\s*=\s*"([^"]+)"/)[1];

const BASE = process.env.BASE || "http://localhost:3000";

const a2n = (s) =>
  String(s)
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
const strip = (s) => a2n(s).replace(/<!--.*?-->/g, "");

const AR = "ar-EG";
const fmtUTC = (d) =>
  a2n(new Intl.DateTimeFormat(AR, { timeZone: "UTC", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(d));
const fmtCalUTC = (d) =>
  a2n(new Intl.DateTimeFormat(AR, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }).format(d));
const utcDate = (y, mo, d, hh, mi, ss) => new Date(Date.UTC(y, mo - 1, d, hh, mi, ss || 0));

const results = [];
const warns = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  => " + detail : ""}`);
}
function note(name, detail) {
  warns.push({ name, detail });
  console.log(`NOTE  ${name}  => ${detail}`);
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.text();
}

// Parse a <tbody> into rows: { name, played, points, goals, found }
function parseRows(html, type) {
  const rows = [];
  const tbodies = html.match(/<tbody>([\s\S]*?)<\/tbody>/g) || [];
  for (const tbody of tbodies) {
    const trs = tbody.match(/<tr([\s\S]*?)<\/tr>/g) || [];
    for (const tr of trs) {
      const nameM = tr.match(/truncate">([^<]+)<\/span><\/a><\/td>/) || tr.match(/alt="([^"]{2,60})"/);
      const playedM = tr.match(/text-text-dim">(\d+)<\/td>/);
      const ptsM = tr.match(/min-w-\[24px\][^>]*text-emerald-500[^>]*>(\d+)<\/span>/);
      const goalsM = tr.match(/font-num text-\[12px\] font-bold text-emerald-500[^>]*>(\d+)</);
      rows.push({
        name: nameM ? nameM[1].trim() : null,
        played: playedM ? Number(playedM[1]) : null,
        points: ptsM ? Number(ptsM[1]) : null,
        goals: goalsM ? Number(goalsM[1]) : null,
        found: !!nameM,
      });
    }
  }
  return rows;
}

// Browser-backed table extractor (streaming Suspense placeholders break no-JS html parsing)
async function browserRows(url) {
  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(45000);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));
    return await page.evaluate(() =>
      [...document.querySelectorAll("tbody tr")].map((tr) =>
        [...tr.querySelectorAll("td")].map((c) => c.textContent.replace(/\s+/g, " ").trim())
      )
    );
  } finally {
    await browser.close();
  }
}
const fromCells = (cells) => {
  const nums = [];
  for (const c of cells) { const n = Number(c); if (Number.isInteger(n)) nums.push(n); }
  const hasRank = cells.length > 1 && /^\d+$/.test(cells[0].trim());
  return { name: (hasRank ? cells[1] : cells[0]) || null, points: nums.length ? nums[nums.length - 1] : null, played: nums.length > 1 ? nums[1] : null, goals: nums.length ? nums[nums.length - 1] : null };
};

// Find a home top-scorer row: goal chip near the player name
function homeScorerGoals(homeS, playerName, expected) {
  const re = new RegExp(playerName.replace(/\s+/g, "\\s+"), "g");
  let m;
  while ((m = re.exec(homeS))) {
    const slice = homeS.slice(m.index, m.index + 1200);
    const g = slice.match(/text-lg font-bold text-emerald-500">(\d+)<\/span>\s*<span[^>]*>هدف/);
    if (g && Number(g[1]) === expected) return Number(g[1]);
  }
  return null;
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // ---- 1. Featured tournament -----------------------------------------
  const { rows: featuredRows } = await client.query(`
    SELECT t.id, t.name, COUNT(m.id)::int AS match_count
    FROM "Tournament" t
    LEFT JOIN "Match" m ON m."tournamentId" = t.id
    WHERE t.status = 'ONGOING'
    GROUP BY t.id ORDER BY t."startDate" DESC;
  `);
  const featured = featuredRows.reduce((best, t) => (t.match_count > best.match_count ? t : best), featuredRows[0]);
  console.log("TOURNAMENTS:", featuredRows.map((t) => `${t.name}[${t.match_count}]`).join(" | "));
  console.log("FEATURED:", featured.name, featured.id);

  // ---- 2. Canonical standings -----------------------------------------
  const { rows: matches } = await client.query(
    `SELECT m.id, m."homeScore", m."awayScore", m."homeTeamId", m."awayTeamId",
            h.name AS "homeName", a.name AS "awayName"
     FROM "Match" m
     JOIN "Team" h ON h.id = m."homeTeamId"
     JOIN "Team" a ON a.id = m."awayTeamId"
     WHERE m."tournamentId" = $1 AND m.status = 'FINISHED'`,
    [featured.id]
  );
  const table = new Map();
  const ensure = (teamId, name) => {
    let r = table.get(teamId);
    if (!r) { r = { teamId, name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 }; table.set(teamId, r); }
    return r;
  };
  for (const m of matches) {
    const h = ensure(m.homeTeamId, m.homeName);
    const a = ensure(m.awayTeamId, m.awayName);
    h.played++; a.played++;
    h.gf += m.homeScore; h.ga += m.awayScore; a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.won++; a.lost++; }
    else if (m.homeScore < m.awayScore) { a.won++; h.lost++; }
    else { h.drawn++; a.drawn++; }
  }
  const standings = Array.from(table.values())
    .map((r) => ({ ...r, points: r.won * 3 + r.drawn }))
    .sort((x, y) => y.points - x.points || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || String(x.name ?? "").localeCompare(String(y.name ?? ""), "ar"));
  console.log("FINISHED MATCHES:", matches.length, "TEAMS:", standings.length);
  console.log("STANDINGS TOP3:", standings.slice(0, 3).map((s) => `${s.name} ${s.points}p (${s.played})`).join(" | "));

  // ---- 3. Top scorers + hero total ------------------------------------
  const { rows: scRaw } = await client.query(
    `SELECT e."playerId", COUNT(*)::int AS goals
     FROM "MatchEvent" e JOIN "Match" m ON m.id = e."matchId"
     WHERE m."tournamentId" = $1 AND m.status = 'FINISHED' AND e.type IN ('GOAL','PENALTY_SCORED')
     GROUP BY e."playerId" ORDER BY goals DESC, e."playerId" ASC LIMIT 60`,
    [featured.id]
  );
  const playerIds = scRaw.map((r) => r.playerId);
  const { rows: playerNames } = await client.query(
    `SELECT p.id, u."fullName" FROM "Player" p JOIN "User" u ON u.id = p."userId" WHERE p.id = ANY($1)`,
    [playerIds]
  );
  const nameById = new Map(playerNames.map((p) => [p.id, p.fullName]));
  const scorers = scRaw.map((r, i) => ({ rank: i + 1, name: nameById.get(r.playerId), goals: r.goals })).filter((s) => s.name);
  console.log("TOP SCORERS:", scorers.slice(0, 5).map((s) => `${s.name}=${s.goals}`).join(" "));
  const heroTotal = scorers.reduce((sum, s) => sum + s.goals, 0);

  // ---- 4. Featured season label ----------------------------------------
  const { rows: seasonRows } = await client.query(
    `SELECT s.label, COUNT(*)::int AS n
     FROM "Match" m JOIN "Season" s ON s.id = m."seasonId"
     WHERE m."tournamentId" = $1 AND m.status = 'FINISHED' AND m."seasonId" IS NOT NULL
     GROUP BY s.label ORDER BY n DESC LIMIT 1`,
    [featured.id]
  );
  const featuredSeason = seasonRows[0]?.label ?? null;
  console.log("FEATURED SEASON LABEL:", featuredSeason);

  // ---- 5. Probe players -------------------------------------------------
  const { rows: probe } = await client.query(
    `SELECT p.id, u."fullName" AS name
     FROM "Player" p JOIN "User" u ON u.id = p."userId"
     WHERE u."fullName" IN ('محمد صلاح','أحمد سمير','حسن علي')
     ORDER BY u."fullName"`
  );
  for (const pl of probe) {
    const { rows: g } = await client.query(
      `SELECT COUNT(*)::int AS n FROM "MatchEvent" e JOIN "Match" m ON m.id = e."matchId"
       WHERE m."tournamentId"=$1 AND m.status='FINISHED' AND e."playerId"=$2 AND e.type IN ('GOAL','PENALTY_SCORED')`,
      [featured.id, pl.id]
    );
    const { rows: mp } = await client.query(
      `SELECT COUNT(DISTINCT sq."matchId")::int AS n
       FROM "MatchSquadPlayer" msp
       JOIN "MatchSquad" sq ON sq.id = msp."squadId"
       JOIN "Match" m ON m.id = sq."matchId"
       WHERE m."tournamentId"=$1 AND m.status='FINISHED' AND sq.status='CONFIRMED' AND msp."playerId"=$2`,
      [featured.id, pl.id]
    );
    pl.goals = g[0].n;
    pl.matchesPlayed = mp[0].n;
  }
  console.log("PROBE:", probe.map((p) => `${p.name} goals=${p.goals} mp=${p.matchesPlayed}`).join(" | "));

  // ---- Fetch pages ------------------------------------------------------
  const home = strip(await fetchText(`${BASE}/`));
  const standingsPage = strip(await fetchText(`${BASE}/standings`));
  const scorersPage = strip(await fetchText(`${BASE}/top-scorers`));
  const playersPage = strip(await fetchText(`${BASE}/players`));
  const aboutPage = strip(await fetchText(`${BASE}/about`));
  const privacyPage = strip(await fetchText(`${BASE}/privacy`));

  // ---- A. Featured is the league ---------------------------------------
  check("featured = league (30+ matches)", featured.match_count >= 30 && /دوري الإسكندرية الممتاز/.test(featured.name), `${featured.name} (${featured.match_count} matches)`);

  // ---- B. Standings top-8 ----------------------------------------------
  const stRows = (await browserRows(`${BASE}/standings`)).map(fromCells);
  let stAllOk = true, stDetail = [];
  for (const row of standings.slice(0, 8)) {
    const found = stRows.find((r) => r.name === row.name && r.points === row.points && r.played === row.played);
    if (!found) { stAllOk = false; stDetail.push(`${row.name}: exp ${row.points}p/${row.played}, rows=${stRows.filter((r) => r.name === row.name).map((r) => `${r.points}p/${r.played}`).join(",")}`); }
  }
  check("standings top-8 (points+played) match DB", stAllOk, stDetail.join("; ") || `top=${standings[0].name} ${standings[0].points}p`);

  // ---- C. Home standings row1 ------------------------------------------
  const homeStRows = (await browserRows(`${BASE}/`)).map(fromCells);
  const h1 = standings[0];
  const h1found = homeStRows.find((r) => r.name === h1.name && r.points === h1.points && r.played === h1.played);
  check("home standings row1 = DB", !!h1found, `${h1.name} ${h1.points}p/${h1.played}`);

  // ---- D. Top scorers page ---------------------------------------------
  const scRows = (await browserRows(`${BASE}/top-scorers`)).map((c) => {
    const team = c.length > 2 ? c[2] : "";
    let name = c[1] || "";
    if (team && name.endsWith(team)) name = name.slice(0, name.length - team.length);
    const nums = c.map(Number).filter((n) => Number.isInteger(n));
    return { name, goals: nums.length ? nums[nums.length - 1] : null };
  });
  let scOk = true, scDetail = [];
  for (const s of scorers.slice(0, 8)) {
    const found = scRows.find((r) => r.name === s.name && r.goals === s.goals);
    if (!found) { scOk = false; scDetail.push(`${s.name}: exp ${s.goals}, got ${scRows.filter((r) => r.name === s.name).map((r) => r.goals).join(",")}`); }
  }
  check("top-scorers top-8 goals match DB", scOk, scDetail.join("; ") || `top=${scorers[0].name} ${scorers[0].goals}`);

  // ---- E. Home scorer panel row1 ----------------------------------------
  const eGo1 = homeScorerGoals(home, scorers[0].name, scorers[0].goals);
  check("home top-scorer row1 = DB", eGo1 === scorers[0].goals, `${scorers[0].name} ${eGo1 ?? "?"} (exp ${scorers[0].goals})`);

  // ---- F. Hero total + season labels ------------------------------------
  const heroGoals = home.match(/>(\d+)<\/div>\s*<div[^>]*>[^<]*هدف/);
  check("hero total goals = DB", heroGoals && Number(heroGoals[1]) === heroTotal, `hero ${heroGoals?.[1]} db ${heroTotal}`);
  check("hero season tag = DB season", featuredSeason ? home.includes(`الموسم ${featuredSeason}`) : true, featuredSeason);
  check("about season = DB season", featuredSeason ? aboutPage.includes(`موسم ${featuredSeason}`) : true, featuredSeason);
  check("privacy season = DB season", featuredSeason ? privacyPage.includes(featuredSeason) : true, featuredSeason);

  // ---- G. Player cross-check --------------------------------------------
  for (const pl of probe) {
    const chipMatch = playersPage.match(new RegExp(`${pl.name.replace(/\s+/g, "\\s+")}[\\s\\S]{0,1500}?title="الأهداف"[\\s\\S]*?>(\\d+)<\\/span>`));
    const chipGoals = chipMatch ? Number(chipMatch[1]) : null;
    check(`players list chip ${pl.name} = DB (${pl.goals})`, chipGoals === pl.goals, `chip ${chipGoals}`);

    const prof = strip(await fetchText(`${BASE}/players/${pl.id}`) ?? "");
    const pg = prof.match(/font-num text-2xl font-bold text-emerald-500[^>]*>(\d+)</);
    const pm = prof.match(/font-num text-2xl font-bold text-text[^>]*>(\d+)</);
    check(`profile ${pl.name} goals = DB`, pg ? Number(pg[1]) === pl.goals : false, `profile ${pg?.[1]} db ${pl.goals}`);
    check(`profile ${pl.name} matchesPlayed = DB`, pm ? Number(pm[1]) === pl.matchesPlayed : false, `profile ${pm?.[1]} db ${pl.matchesPlayed}`);
  }

  // ---- H. Date consistency (UTC baseline from SQL text) ------------------
  const { rows: dMatch } = await client.query(
    `SELECT m.id,
            to_char(m."kickoffAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') AS utc
     FROM "Match" m
     WHERE m."tournamentId"=$1 AND m.status='FINISHED'
     ORDER BY m."kickoffAt" DESC LIMIT 1`,
    [featured.id]
  );
  if (dMatch[0]) {
    const [y, mo, d, hh, mi] = dMatch[0].utc.split(/[- :]/).map(Number);
    const k = utcDate(y, mo, d, hh, mi, 0);
    const fmtMatch = fmtUTC(k);
    const fmtCal = fmtCalUTC(k);
    const detail = strip(await fetchText(`${BASE}/matches/${dMatch[0].id}`) ?? "");
    const list = strip(await fetchText(`${BASE}/matches`) ?? "");
    check("match detail date = UTC(DB)", detail.includes(fmtMatch), `${fmtMatch} in ${dMatch[0].id}`);
    check("matches list shows UTC calendar date", list.includes(fmtCal), fmtCal);
    note("date source", `latest finished ${dMatch[0].id} kickoff UTC=${dMatch[0].utc}`);
  }

  // ---- I. Score-vs-event integrity (informational) -----------------------
  const { rows: mismatch } = await client.query(
    `SELECT m.id, m."homeScore", m."awayScore",
       (SELECT COUNT(*) FROM "MatchEvent" e WHERE e."matchId"=m.id AND e.type IN ('GOAL','PENALTY_SCORED') AND e."teamId"=m."homeTeamId") AS hg,
       (SELECT COUNT(*) FROM "MatchEvent" e WHERE e."matchId"=m.id AND e.type IN ('GOAL','PENALTY_SCORED') AND e."teamId"=m."awayTeamId") AS ag
     FROM "Match" m
     WHERE m."tournamentId"=$1 AND m.status='FINISHED'
       AND (m."homeScore" != (SELECT COUNT(*) FROM "MatchEvent" e WHERE e."matchId"=m.id AND e.type IN ('GOAL','PENALTY_SCORED') AND e."teamId"=m."homeTeamId")
         OR m."awayScore" != (SELECT COUNT(*) FROM "MatchEvent" e WHERE e."matchId"=m.id AND e.type IN ('GOAL','PENALTY_SCORED') AND e."teamId"=m."awayTeamId"))`,
    [featured.id]
  );
  note("score/event mismatches (featured FINISHED)", mismatch.length ? mismatch.map((m) => `${m.id} ${m.homeScore}-${m.awayScore} (events ${m.hg}-${m.ag})`).join(" ; ") : "none");

  // ---- J. Scheduled-but-past (informational) ---------------------------
  const { rows: overdue } = await client.query(
    `SELECT count(*)::int AS n FROM "Match" WHERE status='SCHEDULED' AND "kickoffAt" < now() - interval '10 minutes'`
  );
  note("SCHEDULED matches already in the past", `${overdue[0].n}`);

  // ---- Summary ----------------------------------------------------------
  const failed = results.filter((r) => !r.pass);
  console.log(`\n==== ${results.length - failed.length}/${results.length} PASS ====`);
  if (failed.length) {
    console.log("FAILED:");
    for (const f of failed) console.log(`  - ${f.name} :: ${f.detail}`);
  }
  await client.end();
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });