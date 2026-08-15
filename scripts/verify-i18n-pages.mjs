import { chromium } from "playwright";

const BASE = "http://localhost:8085";
const out = [];
const browser = await chromium.launch();

const leakRe = /(^|\s)(home|seo|builder|invitation|auth|guest)\.[a-z]+\.[a-z]+/;

async function check(locale, path, waitSel) {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${BASE}/${locale}${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector(waitSel, { timeout: 10000 });
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  const bodyText = await page.evaluate(() => document.body.innerText);
  const leak = leakRe.test(bodyText) ? "LEAK:" + JSON.stringify(bodyText.match(leakRe)) : "ok";
  await ctx.close();
  return { htmlLang, leak, errors };
}

// Builder (create invitation) page in all 4 locales
const bKaa = await check("kaa", "/taklifnoma/yangi", ".inv-shell");
const bUz  = await check("uz",  "/taklifnoma/yangi", ".inv-shell");
const bRu  = await check("ru",  "/taklifnoma/yangi", ".inv-shell");
const bEn  = await check("en",  "/taklifnoma/yangi", ".inv-shell");
out.push(`[builder kaa] lang=${bKaa.htmlLang} leak=${bKaa.leak} console=${bKaa.errors.length}`);
out.push(`[builder uz ] lang=${bUz.htmlLang}  leak=${bUz.leak}  console=${bUz.errors.length}`);
out.push(`[builder ru ] lang=${bRu.htmlLang}  leak=${bRu.leak}  console=${bRu.errors.length}`);
out.push(`[builder en ] lang=${bEn.htmlLang}  leak=${bEn.leak}  console=${bEn.errors.length}`);
out.push(`builder html lang: ${bKaa.htmlLang==="kaa"&&bUz.htmlLang==="uz"&&bRu.htmlLang==="ru"&&bEn.htmlLang==="en"?"OK":"FAIL"}`);
out.push(`builder no leak: ${[bKaa,bUz,bRu,bEn].every(x=>x.leak==="ok")?"OK":"FAIL"}`);

// Login page in 4 locales
const lKaa = await check("kaa", "/login", "form");
const lRu  = await check("ru",  "/login", "form");
out.push(`[login kaa] lang=${lKaa.htmlLang} leak=${lKaa.leak} console=${lKaa.errors.length}`);
out.push(`[login ru ] lang=${lRu.htmlLang}  leak=${lRu.leak}  console=${lRu.errors.length}`);
out.push(`login no leak: ${[lKaa,lRu].every(x=>x.leak==="ok")?"OK":"FAIL"}`);

// Language switch on the BUILDER page must preserve the /taklifnoma/yangi route
{
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/kaa/taklifnoma/yangi?step=date`, { waitUntil: "networkidle" });
  await page.waitForSelector(".premium-lang-trigger");
  await page.evaluate(() => (window.__m = "kept"));
  await page.locator(".premium-lang-trigger").click();
  await page.locator(".premium-lang-item", { hasText: "Русский" }).click();
  await page.waitForTimeout(500);
  const url = page.url().replace(BASE, "");
  const lang = await page.evaluate(() => document.documentElement.lang);
  const marker = await page.evaluate(() => window.__m);
  const preserved = /\/ru\/taklifnoma\/yangi\?step=date$/.test(url);
  out.push(`builder switch kaa->ru: url=${url} lang=${lang} noReload=${marker==="kept"?"OK":"FAIL"} routePreserved=${preserved?"OK":"FAIL"}`);
  await ctx.close();
}

await browser.close();
console.log("\n=== I18N PAGES VERIFICATION ===");
for (const l of out) console.log("  " + l);
