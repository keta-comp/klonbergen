// Verify the rebuilt Vowly wedding-day timeline section.
// Checks: 9 events, desktop horizontal layout + gold connector + markers,
// scroll-reveal opacity, image load, mobile vertical stacking, no page h-scroll,
// i18n switching (uz/ru/en), reduced-motion visible-by-default.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE || "http://localhost:5179";
const out = [];
const log = (label, data) => { out.push({ label, ...data }); console.log(`\n=== ${label} ===`); console.log(JSON.stringify(data, null, 2)); };

const browser = await chromium.launch();

async function newPage(viewport, reducedMotion) {
  const ctx = await browser.newContext({ viewport, reducedMotion, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.log("  [console.error]", m.text()); });
  return { ctx, page };
}

// ---- 1. Desktop, reduced-motion OFF (real reveal animation) ----
{
  const { ctx, page } = await newPage({ width: 1440, height: 900 }, "no-preference");
  await page.goto(`${BASE}/uz`, { waitUntil: "networkidle" });
  await page.waitForSelector(".premium-tl-step", { timeout: 10000 });
  const stepsBefore = await page.locator(".premium-tl-step").count();
  const timeline = page.locator(".premium-timeline").first();
  await timeline.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200); // allow staggered reveal + images

  const info = await page.evaluate(() => {
    const tl = document.querySelector(".premium-timeline");
    const steps = [...document.querySelectorAll(".premium-tl-step")];
    const markers = document.querySelectorAll(".premium-tl-marker");
    const scrollEl = document.querySelector(".premium-tl-scroll");
    const firstNode = document.querySelector(".premium-tl-node");
    const lineBefore = firstNode ? getComputedStyle(firstNode, "::before") : null;
    const imgs = [...document.querySelectorAll(".premium-tl-step img")];
    const opacities = steps.map((s) => parseFloat(getComputedStyle(s).opacity));
    const imgOk = imgs.map((i) => i.naturalWidth > 0);
    return {
      inView: tl?.classList.contains("in-view") ?? false,
      stepCount: steps.length,
      markerCount: markers.length,
      scrollOverflowX: scrollEl ? getComputedStyle(scrollEl).overflowX : null,
      goldLine: lineBefore ? (lineBefore.backgroundImage || lineBefore.background) : null,
      minOpacity: Math.min(...opacities),
      maxOpacity: Math.max(...opacities),
      imgLoaded: imgOk.filter(Boolean).length,
      imgTotal: imgs.length,
      docScrollW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
    };
  });
  const shot = join(tmpdir(), `vowly-tl-desktop-${Date.now()}.png`);
  await page.screenshot({ path: shot, fullPage: false });
  log("DESKTOP (1440 / reveal)", { stepCount: info.stepCount, markerCount: info.markerCount, inView: info.inView, minOpacity: info.minOpacity, maxOpacity: info.maxOpacity, goldLine: (info.goldLine || "").slice(0, 60), scrollOverflowX: info.scrollOverflowX, imgLoaded: `${info.imgLoaded}/${info.imgTotal}`, pageHScroll: info.docScrollW - info.winW, shot });
  await ctx.close();
}

// ---- 2. Mobile, reduced-motion OFF (vertical stacking) ----
{
  const { ctx, page } = await newPage({ width: 390, height: 844 }, "no-preference");
  await page.goto(`${BASE}/uz`, { waitUntil: "networkidle" });
  await page.waitForSelector(".premium-tl-step", { timeout: 10000 });
  await page.locator(".premium-timeline").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => {
    const tl = document.querySelector(".premium-timeline");
    const scrollEl = document.querySelector(".premium-tl-scroll");
    const steps = [...document.querySelectorAll(".premium-tl-step")];
    const boxes = steps.map((s) => s.getBoundingClientRect());
    // vertical stacking: each step's top should be >= previous step's top + something
    let vertical = true;
    for (let i = 1; i < boxes.length; i++) {
      if (boxes[i].top < boxes[i - 1].top - 1) vertical = false;
    }
    // horizontal centering: steps span roughly full width (not squeezed in one row)
    const rowSpan = Math.max(...boxes.map((b) => b.right)) - Math.min(...boxes.map((b) => b.left));
    const descOverflow = [...document.querySelectorAll(".premium-tl-desc")].map((d) => d.scrollWidth - d.clientWidth);
    const maxDescOverflow = Math.max(0, ...descOverflow);
    return {
      stepCount: steps.length,
      scrollOverflowX: scrollEl ? getComputedStyle(scrollEl).overflowX : null,
      verticalStacked: vertical,
      rowSpanPx: Math.round(rowSpan),
      maxDescOverflowPx: Math.round(maxDescOverflow),
      docScrollW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
    };
  });
  const shot = join(tmpdir(), `vowly-tl-mobile-${Date.now()}.png`);
  await page.screenshot({ path: shot, fullPage: false });
  log("MOBILE (390 / vertical)", { stepCount: info.stepCount, scrollOverflowX: info.scrollOverflowX, verticalStacked: info.verticalStacked, rowSpanPx: info.rowSpanPx, maxDescOverflowPx: info.maxDescOverflowPx, pageHScroll: info.docScrollW - info.winW, shot });
  await ctx.close();
}

// ---- 3. i18n: en / ru / uz titles + html lang + no page h-scroll ----
async function checkLocale(locale, expectTitle) {
  const { ctx, page } = await newPage({ width: 1440, height: 900 }, "no-preference");
  await page.goto(`${BASE}/${locale}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".premium-tl-step", { timeout: 10000 });
  await page.locator(".premium-timeline").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const info = await page.evaluate((want) => {
    const titles = [...document.querySelectorAll(".premium-tl-title")].map((e) => e.textContent.trim());
    return {
      htmlLang: document.documentElement.lang,
      hasExpectedTitle: titles.includes(want),
      firstTitle: titles[0],
      titleCount: titles.length,
      docScrollW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
    };
  }, expectTitle);
  log(`I18N /${locale}`, { htmlLang: info.htmlLang, expectedTitle: expectTitle, foundExpected: info.hasExpectedTitle, firstTitle: info.firstTitle, titleCount: info.titleCount, pageHScroll: info.docScrollW - info.winW });
  await ctx.close();
}
await checkLocale("en", "Guests Arrive");
await checkLocale("ru", "Прибытие гостей");
await checkLocale("uz", "Mehmonlar kelishi");

// ---- 4. reduced-motion: steps visible WITHOUT scrolling into view ----
{
  const { ctx, page } = await newPage({ width: 1440, height: 900 }, "reduce");
  await page.goto(`${BASE}/uz`, { waitUntil: "networkidle" });
  await page.waitForSelector(".premium-tl-step", { timeout: 10000 });
  // do NOT scroll the timeline into view
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const steps = [...document.querySelectorAll(".premium-tl-step")];
    const opacities = steps.map((s) => parseFloat(getComputedStyle(s).opacity));
    return { stepCount: steps.length, minOpacity: Math.min(...opacities), maxOpacity: Math.max(...opacities) };
  });
  log("REDUCED-MOTION (visible by default)", { stepCount: info.stepCount, minOpacity: info.minOpacity, maxOpacity: info.maxOpacity });
  await ctx.close();
}

await browser.close();
writeFileSync(join(tmpdir(), "vowly-timeline-verify.json"), JSON.stringify(out, null, 2));
console.log("\nDONE");
