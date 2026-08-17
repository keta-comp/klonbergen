import { chromium } from "playwright";
const BASE = process.env.QA_BASE || "http://localhost:4183";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
await page.goto(BASE + "/ru", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const data = await page.evaluate(() => {
  const h1 = document.querySelector(".hero-premium-title");
  const span = document.querySelector(".hero-title-accent");
  const cs = getComputedStyle(h1);
  const spanCs = getComputedStyle(span);
  const h1R = h1.getBoundingClientRect();
  const spanR = span.getBoundingClientRect();
  // Walk text nodes to find line 1 bottom and line 2 top using Range
  const range = document.createRange();
  // line1 = text before <br>
  const br = h1.querySelector("br");
  range.setStart(h1.firstChild, 0);
  range.setEndBefore(br);
  const l1R = range.getBoundingClientRect();
  range.setStartAfter(br);
  range.setEnd(h1.lastChild, h1.lastChild.length);
  const l2R = range.getBoundingClientRect();
  return {
    h1LineHeight: cs.lineHeight,
    h1FontSize: cs.fontSize,
    spanDisplay: spanCs.display,
    spanMarginTop: spanCs.marginTop,
    spanTop: Math.round(spanR.top),
    spanBottom: Math.round(spanR.bottom),
    line1Bottom: Math.round(l1R.bottom),
    line2Top: Math.round(l2R.top),
    gap: Math.round(l2R.top - l1R.bottom),
  };
});
console.log(JSON.stringify(data, null, 2));
await page.close();
await browser.close();