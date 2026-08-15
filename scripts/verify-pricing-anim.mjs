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
await page.waitForSelector(".pricing-card", { timeout: 8000 });
await page.evaluate(() => document.getElementById("bahalar")?.scrollIntoView({ behavior: "instant", block: "center" }));
await page.waitForTimeout(700);

const rest = await page.evaluate(() => {
  return [...document.querySelectorAll(".pricing-card")].map((c) => {
    const cs = getComputedStyle(c);
    const badge = c.querySelector(".pricing-badge");
    const badgeStyle = badge ? getComputedStyle(badge) : null;
    return {
      name: c.querySelector(".pricing-card-name")?.textContent?.trim(),
      featured: c.classList.contains("featured"),
      bg: cs.backgroundColor,
      border: cs.borderColor,
      backdrop: cs.backdropFilter || cs.webkitBackdropFilter,
      borderRadius: cs.borderRadius,
      boxShadow: cs.boxShadow,
      badgeAnimation: badgeStyle?.animationName,
      badgeHas: !!badge,
    };
  });
});

const restShot = join(tmpdir(), `vowly-pricing-rest-${Date.now()}.png`);
await page.screenshot({ path: restShot, fullPage: false });

// Hover the featured card and capture hover state
const featured = page.locator(".pricing-card.featured").first();
await featured.hover();
await page.waitForTimeout(500); // let shine sweep + transitions settle a bit
const hover = await page.evaluate(() => {
  const c = document.querySelector(".pricing-card.featured");
  const cs = getComputedStyle(c);
  const price = c.querySelector(".pricing-card-price");
  const ps = price ? getComputedStyle(price) : null;
  const li = c.querySelector(".pricing-card-features li");
  const lis = li ? getComputedStyle(li) : null;
  const svg = c.querySelector(".pricing-card-cta svg");
  const svgs = svg ? getComputedStyle(svg) : null;
  return {
    transform: cs.transform,
    bg: cs.backgroundColor,
    border: cs.borderColor,
    boxShadow: cs.boxShadow,
    priceTransform: ps?.transform,
    priceColor: ps?.color,
    liTransform: lis?.transform,
    svgTransform: svgs?.transform,
  };
});
const hoverShot = join(tmpdir(), `vowly-pricing-hover-${Date.now()}.png`);
await page.screenshot({ path: hoverShot, fullPage: false });

console.log("=== PRICING CARDS — REST ===");
for (const c of rest) console.log(JSON.stringify(c));
console.log("\n=== FEATURED — HOVER ===");
console.log(JSON.stringify(hover, null, 2));
console.log("\nshots:", restShot, "|", hoverShot);
await browser.close();