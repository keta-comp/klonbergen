import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:8085";
const OUT = "scripts/.verify-quality";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function audit(w, label) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: w >= 768 ? 1024 : 844 },
    reducedMotion: "reduce",
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector(".premium-nav", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}[style*="opacity"],[style*="transform"]{opacity:1!important;transform:none!important}`,
  });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(80); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // nav state
  const nav = await page.evaluate(() => {
    const burger = document.querySelector(".premium-burger");
    const links = [...document.querySelectorAll(".premium-nav-link")];
    const burgerVisible = burger ? getComputedStyle(burger).display !== "none" : false;
    const linkVisible = links.length ? getComputedStyle(links[0]).display !== "none" : false;
    return { burgerVisible, linkVisible, linkCount: links.length };
  });

  // text clipping: element wider than its visible box (scrollWidth >> clientWidth) on text tags
  const clipped = await page.evaluate(() => {
    const tags = "h1,h2,h3,h4,p,a,button,span,li,div".split(",");
    const out = [];
    for (const el of document.querySelectorAll("*")) {
      const t = el.tagName.toLowerCase();
      if (!tags.includes(t)) continue;
      const cs = getComputedStyle(el);
      if (cs.overflowX === "hidden" || cs.overflowX === "auto" || cs.overflowX === "scroll") continue;
      const sw = el.scrollWidth, cw = el.clientWidth;
      // only flag real text clipping: text node present, and significant horizontal overflow
      const hasText = (el.innerText || "").trim().length > 0;
      if (hasText && cw > 0 && sw - cw > 6) {
        out.push({ tag: t, cls: (el.className && el.className.toString().slice(0, 50)) || "", sw, cw, txt: (el.innerText || "").trim().slice(0, 40) });
      }
    }
    return out.slice(0, 20);
  });

  // feature grid columns + pricing columns + timeline layout
  const layout = await page.evaluate(() => {
    const grid = document.querySelector(".premium-feature-grid");
    const pricing = document.querySelector(".pricing-premium");
    const tl = document.querySelector(".premium-timeline-grid");
    const cols = (g) => (g ? getComputedStyle(g).gridTemplateColumns.split(" ").length : null);
    return { featureCols: cols(grid), pricingCols: cols(pricing), tlCols: cols(tl) };
  });

  console.log(`\n[${label} ${w}px]`);
  console.log(`  nav: burgerVisible=${nav.burgerVisible} linkVisible=${nav.linkVisible} links=${nav.linkCount}`);
  console.log(`  layout: featureCols=${layout.featureCols} pricingCols=${layout.pricingCols} tlCols=${layout.tlCols}`);
  if (clipped.length) {
    console.log(`  POSSIBLE TEXT CLIPPING (${clipped.length}):`);
    for (const c of clipped) console.log(`    <${c.tag} class="${c.cls}"> sw=${c.sw} cw=${c.cw} "${c.txt}"`);
  } else {
    console.log("  text clipping: none");
  }
  await page.close();
  await ctx.close();
}

await audit(375, "MOBILE");
await audit(768, "TABLET");
await audit(1440, "DESKTOP");
await browser.close();
console.log("\nquality audit done");
