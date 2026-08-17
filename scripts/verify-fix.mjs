import { chromium } from "playwright";
const BASE = process.env.QA_BASE || "http://localhost:4180";
const browser = await chromium.launch();
for (const w of [375, 430, 768]) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  await page.goto(BASE + "/ru", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  for (const sel of ["#bahalar", "#qalay"]) {
    await page.evaluate((s) => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: "start" }); }, sel);
    await page.waitForTimeout(450);
    const name = `verify-${w}-${sel.replace("#","")}`;
    await page.screenshot({ path: `scripts/shots/${name}.png` });
    console.log("shot", name);
  }
  await page.close();
}
await browser.close();