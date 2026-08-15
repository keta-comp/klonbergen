import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:8085";
const browser = await chromium.launch();
const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/uz`, { waitUntil: "domcontentloaded" });
try {
  await page.locator(".inv-video-cta").first().click({ timeout: 4000 });
  await page.locator(".inv-video-gate").waitFor({ state: "detached", timeout: 12000 }).catch(() => {});
} catch {}
await page.waitForSelector(".hero", { timeout: 8000 });
await page.waitForTimeout(600);

// Pricing section: scroll into view, read card prices
await page.evaluate(() => document.getElementById("bahalar")?.scrollIntoView({ behavior: "instant", block: "center" }));
await page.waitForTimeout(700);
const cards = await page.evaluate(() => {
  return [...document.querySelectorAll(".pricing-card")].map((c) => {
    const price = c.querySelector(".pricing-card-price")?.textContent?.trim();
    const unit = c.querySelector(".pricing-card-unit")?.textContent?.trim();
    const cta = c.querySelector(".pricing-card-cta");
    const cs = cta ? getComputedStyle(cta) : null;
    return {
      name: c.querySelector(".pricing-card-name")?.textContent?.trim(),
      price, unit,
      ctaBg: cs?.backgroundColor, ctaBorder: cs?.borderColor, ctaColor: cs?.color,
      ctaBackdrop: cs?.backdropFilter || cs?.webkitBackdropFilter,
    };
  });
});
const pricingShot = join(tmpdir(), `vowly-pricing-${Date.now()}.png`);
await page.screenshot({ path: pricingShot });

// Landing buttons: sample computed styles for nav + hero + a section cta
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
const navBtn = await page.evaluate(() => {
  const b = document.querySelector(".premium-nav .vow-btn");
  if (!b) return null;
  const cs = getComputedStyle(b);
  return { text: b.textContent.trim(), bg: cs.backgroundColor, border: cs.borderColor, color: cs.color, backdrop: cs.backdropFilter || cs.webkitBackdropFilter };
});
const heroBtns = await page.evaluate(() =>
  [...document.querySelectorAll(".hero-premium-cta .vow-btn")].map((b) => {
    const cs = getComputedStyle(b);
    return { text: b.textContent.trim(), bg: cs.backgroundColor, color: cs.color, backdrop: cs.backdropFilter || cs.webkitBackdropFilter };
  })
);

console.log("=== PRICING CARDS (uz) ===");
for (const c of cards) console.log(JSON.stringify(c));
console.log("pricing screenshot:", pricingShot);
console.log("nav button:", JSON.stringify(navBtn));
console.log("hero buttons:", JSON.stringify(heroBtns));
await browser.close();
