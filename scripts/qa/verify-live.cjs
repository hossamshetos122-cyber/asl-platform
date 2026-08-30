const a2n = (s) => String(s).replace(/[\u0660-\u0669]/g, (d) => String("\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669".indexOf(d))).replace(/[\u06F0-\u06F9]/g, (d) => String("\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9".indexOf(d)));
const strip = (s) => a2n(s).replace(/<!--.*?-->/g, "");
async function get(p) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch("https://asl-platform.vercel.app" + p, { headers: { "user-agent": "Mozilla/5.0" } });
      if (res.ok) return await res.text();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}
(async () => {
  const home = strip(await get("/"));
  const ts = strip(await get("/top-scorers"));
  const about = strip(await get("/about"));
  const detail = strip(await get("/matches/lg-m28"));
  const checks = [
    ["hero total goals = 68", />(\d+)<\/div>\s*<div[^>]*>[^<]*هدف/.exec(home)?.[1] === "68"],
    ["top-scorers محمد صلاح = 7", new RegExp("محمد صلاح[\\s\\S]{0,2500}?text-emerald-500[^>]*>(\\d+)<").exec(ts)?.[1] === "7"],
    ["home season 2026/2027", home.includes("الموسم 2026/2027")],
    ["about season 2026/2027", about.includes("موسم 2026/2027")],
    ["match lg-m28 UTC date", detail.includes("13 أغسطس 2026 في 04:42")],
  ];
  let pass = 0;
  for (const [n, ok] of checks) { console.log(`${ok ? "PASS" : "FAIL"}  ${n}`); if (ok) pass++; }
  console.log(`\n${pass}/${checks.length} live checks passed`);
  process.exit(pass === checks.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });