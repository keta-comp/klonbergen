// Capture full-page screenshots at 4 viewports for visual verification.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = "http://localhost:8080/";
const VIEWS = [
  { name: "1440x900", w: 1440, h: 900 },
  { name: "1920x1080", w: 1920, h: 1080 },
  { name: "1366x768", w: 1366, h: 768 },
  { name: "390x844", w: 390, h: 844 },
];
const OUT = ".verify-shots";

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  for (const v of VIEWS) {
    const ctx = await browser.newContext({
      viewport: { width: v.w, height: v.h },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 25000 });
    // give the hero video time to mount and reveal animations to settle
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: `${OUT}/full-${v.name}.png`,
      fullPage: true,
    });
    // also capture above-the-fold only
    await page.screenshot({
      path: `${OUT}/fold-${v.name}.png`,
      fullPage: false,
    });
    console.log(`captured ${v.name}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log("done");