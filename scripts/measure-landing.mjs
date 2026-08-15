import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:8085";
const OUT = "scripts/.verify-landing";
mkdirSync(OUT, { recursive: true });

const widths = [320, 375, 390, 414, 430];
const browser = await chromium.launch();

for (const w of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: 844 },
    reducedMotion: "reduce", // skip envelope gate (returns null on reduced motion)
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("main, .hero, .vow-section", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);

  // Framer Motion's whileInView respects prefers-reduced-motion and keeps elements
  // at opacity:0. We need to FORCE them visible to capture a true visual snapshot.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.001ms !important;
        transition-delay: 0ms !important;
      }
      [style*="opacity"], [style*="transform"] {
        opacity: 1 !important;
        transform: none !important;
      }
    `,
  });

  // walk through the page to trigger any remaining observers
  const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < totalHeight; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  // viewport screenshot
  await page.screenshot({ path: `${OUT}/landing-${w}.png`, fullPage: false });
  // full page screenshot
  await page.screenshot({ path: `${OUT}/landing-${w}-full.png`, fullPage: true });

  // overflow check
  const metrics = await page.evaluate(() => {
    const de = document.documentElement;
    const sw = de.scrollWidth;
    const iw = window.innerWidth;
    const offenders = [];
    for (const el of de.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > iw + 1.5 || r.left < -1.5)) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.toString().slice(0, 60)) || "",
          right: Math.round(r.right),
          left: Math.round(r.left),
          w: Math.round(r.width),
        });
      }
    }
    const seen = new Set();
    const uniq = offenders.filter((o) => {
      const k = o.cls + "|" + o.right;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return { sw, iw, offenders: uniq.slice(0, 10) };
  });

  console.log(
    `\n[${w}px] scrollWidth=${metrics.sw} innerWidth=${metrics.iw} overflow=${metrics.sw > metrics.iw ? "YES (" + (metrics.sw - metrics.iw) + "px)" : "no"} | offenders=${metrics.offenders.length}`
  );
  for (const o of metrics.offenders) {
    console.log(`   <${o.tag} class="${o.cls}"> right=${o.right} left=${o.left} w=${o.w}`);
  }
  if (errors.length) console.log("   pageerrors:", errors);
  await page.close();
  await ctx.close();
}

await browser.close();
console.log("\nscreenshots in", OUT);
