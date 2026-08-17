import { chromium } from "playwright";
const BASE = "http://localhost:4173";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 844 } });
await page.goto(BASE + "/ru", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

async function sx() {
  return await page.evaluate(() => {
    window.scrollTo(9999, 0);
    const v = window.scrollX;
    window.scrollTo(0, 0);
    return v;
  });
}
const base = await sx();
console.log("baseline scrollX =", base);

const sections = await page.evaluate(() =>
  [...document.querySelectorAll("main > section, footer")].map((s, i) => ({ i, id: s.id || s.className?.toString?.().slice(0, 30) }))
);
for (const s of sections) {
  await page.evaluate((idx) => {
    const el = document.querySelectorAll("main > section, footer")[idx];
    el.dataset._hide = el.style.display;
    el.style.display = "none";
  }, s.i);
  const v = await sx();
  console.log(`hide #${s.i} (${s.id}) -> scrollX=${v} ${v === 0 ? "  <-- CULPRIT" : ""}`);
  await page.evaluate((idx) => {
    const el = document.querySelectorAll("main > section, footer")[idx];
    el.style.display = el.dataset._hide || "";
  }, s.i);
}
await browser.close();
