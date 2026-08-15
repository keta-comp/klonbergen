import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:8085";
const browser = await chromium.launch();
const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/kaa`, { waitUntil: "domcontentloaded" });
// dismiss OpeningExperience gate if present
try {
  await page.locator(".inv-video-cta").first().click({ timeout: 4000 });
  await page.locator(".inv-video-gate").waitFor({ state: "detached", timeout: 12000 }).catch(() => {});
} catch {}
await page.waitForSelector(".hero", { timeout: 8000 });
await page.waitForTimeout(800);

const btns = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll(".hero-premium-cta .vow-btn").forEach((b, i) => {
    const cs = getComputedStyle(b);
    out.push({
      i,
      text: b.textContent.trim(),
      cls: b.className,
      background: cs.backgroundColor,
      borderColor: cs.borderColor,
      color: cs.color,
      backdrop: cs.backdropFilter || cs.webkitBackdropFilter,
    });
  });
  return out;
});
const shot = join(tmpdir(), `vowly-hero-glass-${Date.now()}.png`);
await page.screenshot({ path: shot });
console.log("=== HERO GLASS BUTTONS ===");
for (const b of btns) console.log(JSON.stringify(b));
console.log("screenshot:", shot);
await browser.close();
