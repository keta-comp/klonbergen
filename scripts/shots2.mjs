import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.QA_BASE || "http://localhost:4173";
const OUT = "scripts/shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(w, name, full, selector) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  await page.goto(BASE + "/ru", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  if (selector) {
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (el) el.scrollIntoView({ block: "start" });
    }, selector);
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: !!full });
  console.log("shot", name, full ? "(fullPage)" : "", selector || "");
  await page.close();
}

// mobile full page
await shot(375, "review-375-full", true);
// tablet full page
await shot(768, "review-768-full", true);
// desktop full page
await shot(1280, "review-1280-full", true);
// mobile timeline section focused
await shot(375, "review-375-timeline", false, "#qalay");
// mobile pricing section focused
await shot(375, "review-375-pricing", false, "#bahalar");
// mobile footer focused
await shot(375, "review-375-footer", false, "#baylanis");

await browser.close();
console.log("done");
