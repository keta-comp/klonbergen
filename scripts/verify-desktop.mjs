import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto("http://localhost:8085/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.addStyleTag({ content: `*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}[style*="opacity"],[style*="transform"]{opacity:1!important;transform:none!important}` });
const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < totalHeight; y += 500) { await page.evaluate(yy => window.scrollTo(0, yy), y); await page.waitForTimeout(80); }
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/.verify-landing/desktop-1440-full.png", fullPage: true });
await page.screenshot({ path: "scripts/.verify-landing/desktop-1440-hero.png", fullPage: false });
const m = await page.evaluate(() => {
  const de = document.documentElement;
  return { sw: de.scrollWidth, iw: window.innerWidth, sh: de.scrollHeight };
});
console.log("desktop 1440:", JSON.stringify(m));
await browser.close();
