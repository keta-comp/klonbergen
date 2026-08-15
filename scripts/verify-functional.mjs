import { chromium } from "playwright";

const BASE = "http://localhost:8085";
const browser = await chromium.launch();
const results = [];

// ---------- MOBILE: hamburger menu + anchor scroll + demo nav ----------
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 844 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push("console:" + m.text()); });

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector(".premium-burger", { timeout: 8000 });

  // open mobile menu
  await page.click(".premium-burger");
  await page.waitForTimeout(400);
  const menuVisible = await page.isVisible(".premium-mobile-menu");
  results.push(`mobile menu opens: ${menuVisible ? "OK" : "FAIL"}`);

  // click "Qalay isleydi?" (4th link, id=qalay)
  const links = page.locator(".premium-mobile-menu button:not(.premium-mobile-cta)");
  const count = await links.count();
  results.push(`mobile menu link count: ${count} (expect 5)`);

  // click the link whose text includes "Qalay"
  let clicked = false;
  for (let i = 0; i < count; i++) {
    const t = (await links.nth(i).innerText()).toLowerCase();
    if (t.includes("qalay")) { await links.nth(i).click(); clicked = true; break; }
  }
  await page.waitForTimeout(900);
  const yAfter = await page.evaluate(() => window.scrollY);
  const qalay = await page.evaluate(() => {
    const el = document.getElementById("qalay");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return Math.round(r.top + window.scrollY);
  });
  results.push(`clicked Qalay link: ${clicked ? "OK" : "FAIL"} | scrollY=${yAfter} | #qalay offset=${qalay} | scrolled-to-section=${qalay !== null && Math.abs(yAfter - qalay) < 40 ? "OK" : "FAIL"}`);

  // demo CTA in mobile menu
  await page.click(".premium-burger"); // reopen if closed (go() closes it)
  await page.waitForTimeout(300);
  await page.click(".premium-mobile-cta");
  await page.waitForTimeout(800);
  const url = page.url();
  results.push(`demo CTA routes to: ${url} ${url.endsWith("/login") ? "OK" : "CHECK"}`);
  results.push(`mobile console/page errors: ${errs.length ? errs.join(" | ") : "none"}`);
  await ctx.close();
}

// ---------- DESKTOP: inline nav anchor scroll + hero video ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector(".premium-nav-link", { timeout: 8000 });

  const navLinks = page.locator(".premium-nav-link");
  const n = await navLinks.count();
  results.push(`desktop inline nav link count: ${n} (expect 5)`);

  // click "Bahalar"
  let clicked = false;
  for (let i = 0; i < n; i++) {
    const t = (await navLinks.nth(i).innerText()).toLowerCase();
    if (t.includes("bahalar")) { await navLinks.nth(i).click(); clicked = true; break; }
  }
  await page.waitForTimeout(900);
  const y = await page.evaluate(() => window.scrollY);
  const bahalar = await page.evaluate(() => { const el = document.getElementById("bahalar"); return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null; });
  results.push(`clicked Bahalar: ${clicked ? "OK" : "FAIL"} | #bahalar offset=${bahalar} | scrolled-to-section=${bahalar !== null && Math.abs(y - bahalar) < 40 ? "OK" : "FAIL"}`);

  const vid = await page.evaluate(() => { const v = document.querySelector("video"); return v ? { paused: v.paused, ok: v.readyState >= 2 } : null; });
  results.push(`hero video: ${vid ? `paused=${vid.paused} ready=${vid.ok}` : "MISSING"}`);
  results.push(`desktop page errors: ${errs.length ? errs.join(" | ") : "none"}`);
  await ctx.close();
}

await browser.close();
console.log("\n=== FUNCTIONAL SMOKE TEST ===");
for (const r of results) console.log("  " + r);
