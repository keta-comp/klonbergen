import { chromium } from "playwright";
const BASE = process.env.QA_BASE || "http://localhost:4180";
const browser = await chromium.launch();
const widths = [1280, 1024, 900];
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 800 } });
  await page.goto(BASE + "/ru", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  for (const sel of ["#bahalar", "#qalay"]) {
    await page.evaluate((s) => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: "start" }); }, sel);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `scripts/shots/desktop-${w}-${sel.replace("#","")}.png` });
    console.log("shot desktop", w, sel);
  }
  await page.close();
}
await browser.close();