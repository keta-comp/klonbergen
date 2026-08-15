import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE || "http://localhost:8085";
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

const geom = await page.evaluate(() => {
  const card = document.querySelector(".pricing-card.featured");
  if (!card) return { error: "no featured card" };
  const badge = card.querySelector(".pricing-badge");
  if (!badge) return { error: "no badge" };
  const cr = card.getBoundingClientRect();
  const br = badge.getBoundingClientRect();
  // walk ancestors to find any that clip overflow
  const clippers = [];
  let el = card;
  while (el && el !== document.body) {
    const cs = getComputedStyle(el);
    if (cs.overflow === "hidden" || cs.overflowY === "hidden" || cs.overflowX === "hidden") {
      clippers.push({ tag: el.className || el.tagName, overflow: cs.overflow, overflowY: cs.overflowY });
    }
    el = el.parentElement;
  }
  return {
    cardTop: Math.round(cr.top),
    cardBottom: Math.round(cr.bottom),
    badgeTop: Math.round(br.top),
    badgeBottom: Math.round(br.bottom),
    badgeHeight: Math.round(br.height),
    badgeOverflowsAbove: br.top < cr.top,          // badge sticks out above the card edge
    badgeFullyAboveCard: br.bottom <= cr.top,       // whole badge sits above the card top
    badgeVerticallyCenteredOnEdge: Math.abs((br.top + br.bottom) / 2 - cr.top) < 6,
    cardClippers: clippers,
  };
});

const shot = join(tmpdir(), `vowly-badge-fix-${Date.now()}.png`);
await page.screenshot({ path: shot, fullPage: false });

// zoom into the featured card for a clean look
const card = page.locator(".pricing-card.featured").first();
const box = await card.boundingBox();
if (box) {
  const pad = 24;
  await page.screenshot({
    path: join(tmpdir(), `vowly-badge-fix-zoom-${Date.now()}.png`),
    clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad - 30), width: box.width + pad * 2, height: box.height + pad * 2 + 30 },
  });
}

console.log("=== BADGE CLIP CHECK ===");
console.log(JSON.stringify(geom, null, 2));
console.log("shot:", shot);
await browser.close();
