import { chromium } from "playwright";
const BASE = process.env.QA_BASE || "http://localhost:4180";
const browser = await chromium.launch();
for (const w of [375, 430, 768, 900, 1024, 1280]) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  await page.goto(BASE + "/ru", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.evaluate(() => { const e = document.querySelector("#bahalar"); if (e) e.scrollIntoView({block:"start"}); });
  await page.waitForTimeout(400);
  const data = await page.evaluate(() => {
    const h2 = document.querySelector("#bahalar .premium-heading");
    if (!h2) return null;
    const em = h2.querySelector("em");
    const cs = getComputedStyle(em);
    const emR = em.getBoundingClientRect();
    const hR = h2.getBoundingClientRect();
    // Find the dark text node's last rect (approx the line-1 text)
    return {
      emDisplay: cs.display,
      emMarginTop: cs.marginTop,
      emTop: Math.round(emR.top),
      emLeft: Math.round(emR.left),
      emWidth: Math.round(emR.width),
      h2Top: Math.round(hR.top),
      h2Height: Math.round(hR.height),
      emText: em.textContent.trim().slice(0, 30),
      h2Text: h2.textContent.replace(/\s+/g," ").trim().slice(0, 40),
    };
  });
  console.log(`w=${w}`, JSON.stringify(data));
  await page.close();
}
await browser.close();