import { chromium } from "playwright";

const BASE = "http://localhost:8085";
const out = [];
const browser = await chromium.launch();

async function hero(locale) {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(`${BASE}/${locale}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".hero-premium-title", { timeout: 10000 });
  const title = (await page.locator(".hero-premium-title").textContent())?.replace(/\s+/g, " ").trim();
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  // Detect any untranslated keys leaked into visible text.
  const bodyText = await page.evaluate(() => document.body.innerText);
  const leakMatch = bodyText.match(/(^|\s)((home|seo)\.[a-z]+\.[a-z]+)/g);
  const leaked = leakMatch ? "LEAK:" + JSON.stringify(leakMatch.slice(0, 6)) : "ok";
  out.push(`[${locale}] lang=${htmlLang} title="${title}" leak=${leaked} consoleErrors=${errors.length}`);
  await ctx.close();
  return { title, htmlLang, leaked, errors };
}

const a = await hero("kaa");
const b = await hero("uz");
const c = await hero("ru");
const d = await hero("en");

out.push(`titles differ: ${new Set([a.title, b.title, c.title, d.title]).size === 4 ? "OK" : "CHECK"}`);
out.push(`html lang per locale: ${a.htmlLang === "kaa" && b.htmlLang === "uz" && c.htmlLang === "ru" && d.htmlLang === "en" ? "OK" : "FAIL"}`);
out.push(`no leaked keys: ${[a, b, c, d].every((x) => x.leaked === "ok") ? "OK" : "FAIL"}`);

// Root redirect + switch-without-reload test
{
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const rootUrl = page.url();
  out.push(`root "/" -> ${rootUrl.replace(BASE, "")} ${rootUrl.replace(BASE, "").match(/^\/(kaa|uz|ru|en)/) ? "OK" : "CHECK"}`);

  // Go to a specific locale and switch language via the switcher
  await page.goto(`${BASE}/kaa`, { waitUntil: "networkidle" });
  await page.waitForSelector(".premium-lang-trigger");
  await page.evaluate(() => (window.__marker = "kept"));
  await page.locator(".premium-lang-trigger").click();
  await page.locator(".premium-lang-item", { hasText: "Русский" }).click();
  await page.waitForTimeout(500);
  const afterUrl = page.url();
  const afterLang = await page.evaluate(() => document.documentElement.lang);
  const marker = await page.evaluate(() => window.__marker);
  const afterTitle = (await page.locator(".hero-premium-title").textContent())?.replace(/\s+/g, " ").trim();
  out.push(`switch kaa->ru: url=${afterUrl.replace(BASE, "")} lang=${afterLang} noReload=${marker === "kept" ? "OK" : "FAIL"} titleChanged=${afterTitle !== a.title ? "OK" : "FAIL"}`);
  await ctx.close();
}

// Direct deep-link to a builder route keeps working
{
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const r = await page.goto(`${BASE}/en/taklifnoma/yangi`, { waitUntil: "networkidle" });
  out.push(`deep-link /en/taklifnoma/yangi -> HTTP ${r.status()} ${r.status() === 200 ? "OK" : "FAIL"}`);
  await ctx.close();
}

await browser.close();
console.log("\n=== I18N VERIFICATION ===");
for (const l of out) console.log("  " + l);
