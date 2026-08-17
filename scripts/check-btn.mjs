import { chromium } from "playwright";
const BASE = process.env.QA_BASE || "http://localhost:4182";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 768, height: 900 } });
await page.goto(BASE + "/ru", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.evaluate(() => { const e = document.querySelector("#qalay"); if (e) e.scrollIntoView({block:"start"}); });
await page.waitForTimeout(400);
const data = await page.evaluate(() => {
  const grid = document.querySelector("#qalay .grid");
  const btn = document.querySelector("#qalay .vow-btn");
  const sub = document.querySelector("#qalay .premium-sub");
  const gridR = grid.getBoundingClientRect();
  const btnR = btn.getBoundingClientRect();
  const subR = sub.getBoundingClientRect();
  const cs = getComputedStyle(btn);
  return {
    gridLeft: Math.round(gridR.left), gridRight: Math.round(gridR.right), gridWidth: Math.round(gridR.width),
    btnLeft: Math.round(btnR.left), btnRight: Math.round(btnR.right), btnWidth: Math.round(btnR.width),
    subRight: Math.round(subR.right),
    btnMaxWidth: cs.maxWidth,
    btnComputedWidth: cs.width,
    overlap: btnR.left < subR.right + 2,
    gap: Math.round(btnR.left - subR.right),
  };
});
console.log(JSON.stringify(data, null, 2));
await page.close();
await browser.close();