import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 320, height: 844 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto("http://localhost:8085/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const navs = document.querySelectorAll("nav, header");
  const allBtns = Array.from(document.querySelectorAll("button, a")).filter(b => /Demo soraw/i.test(b.textContent || ""));
  return {
    navCount: navs.length,
    btnCount: allBtns.length,
    btns: allBtns.map(b => {
      const cs = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return {
        cls: b.className || "",
        display: cs.display,
        visibility: cs.visibility,
        w: Math.round(r.width),
        h: Math.round(r.height),
        right: Math.round(r.right),
        text: (b.textContent || "").trim().slice(0, 30),
      };
    }),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
