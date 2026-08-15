import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:8085";
const browser = await chromium.launch();
const widths = [375, 390, 393, 414, 430, 768, 1024, 1440, 1920];

async function check(width) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ru`, { waitUntil: "domcontentloaded" });
  try {
    await page.locator(".inv-video-cta").first().click({ timeout: 4000 });
    await page.locator(".inv-video-gate").waitFor({ state: "detached", timeout: 12000 }).catch(() => {});
  } catch {}
  await page.waitForSelector(".brand", { timeout: 8000 });
  await page.waitForTimeout(400);
  const data = await page.evaluate(() => {
    const brand = document.querySelector(".brand");
    const img = brand?.querySelector(".logo-mark");
    const span = brand?.querySelector("span");
    const cs = img ? getComputedStyle(img) : null;
    const brandRect = brand?.getBoundingClientRect();
    const imgRect = img?.getBoundingClientRect();
    const spanRect = span?.getBoundingClientRect();
    // vertical alignment: centers should be close
    const imgCenter = imgRect ? imgRect.top + imgRect.height / 2 : null;
    const spanCenter = spanRect ? spanRect.top + spanRect.height / 2 : null;
    const misalign = imgCenter != null && spanCenter != null ? Math.abs(imgCenter - spanCenter) : null;
    return {
      hasImg: !!img,
      src: img?.getAttribute("src"),
      imgH: cs?.height,
      imgW: cs?.width,
      objectFit: cs?.objectFit,
      order: img && span ? (img.compareDocumentPosition(span) & Node.DOCUMENT_POSITION_FOLLOWING ? "logo-before-text" : "logo-after-text") : null,
      misalignPx: misalign?.toFixed(1),
      scrollW: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  const shot = join(tmpdir(), `vowly-header-${width}-${Date.now()}.png`);
  await page.screenshot({ path: shot });
  await ctx.close();
  return { width, ...data, shot };
}

const results = [];
for (const w of widths) results.push(await check(w));
console.log("=== HEADER LOGO VERIFY (ru) ===");
for (const r of results) console.log(JSON.stringify({ w: r.width, hasImg: r.hasImg, src: r.src, imgH: r.imgH, imgW: r.imgW, order: r.order, misalign: r.misalignPx, overflow: r.overflow, scrollW: r.scrollW }));
const anyOverflow = results.some((r) => r.overflow);
console.log("ANY_OVERFLOW:", anyOverflow);
console.log("desktop shot (1440):", results.find((r) => r.width === 1440)?.shot);
console.log("mobile shot (375):", results.find((r) => r.width === 375)?.shot);
await browser.close();
