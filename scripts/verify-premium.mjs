import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:8085";
const OUT = "scripts/.verify-premium";
mkdirSync(OUT, { recursive: true });

// New premium spec breakpoints
const widths = [375, 390, 414, 768, 1024, 1440];
const browser = await chromium.launch();

let hasBlocking = false;

for (const w of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: w >= 768 ? 1024 : 844 },
    reducedMotion: "reduce", // skip envelope gate (returns null on reduced motion)
    deviceScaleFactor: w >= 1440 ? 1 : 2,
  });
  const page = await ctx.newPage();

  const pageErrors = [];
  const failedResponses = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("response", (res) => {
    const u = res.url();
    if (u.startsWith(BASE) && res.status() >= 400) {
      failedResponses.push(`${res.status()} ${u}`);
    }
  });

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("main, .hero, .vow-section, .premium-nav", { timeout: 8000 }).catch(() => {});
  // give video + images a moment
  await page.waitForTimeout(1200);

  // Framer Motion's whileInView respects prefers-reduced-motion and keeps elements
  // at opacity:0. FORCE them visible to capture a true visual snapshot.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.001ms !important;
        transition-delay: 0ms !important;
      }
      [style*="opacity"], [style*="transform"] {
        opacity: 1 !important;
        transform: none !important;
      }
    `,
  });

  // walk through the page to trigger any remaining observers / lazy loads
  const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < totalHeight; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // ---- asset integrity checks ----
  const assets = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].map((i) => ({
      src: i.currentSrc || i.src,
      ok: i.complete && i.naturalWidth > 0,
      w: i.naturalWidth,
      h: i.naturalHeight,
    }));
    const vids = [...document.querySelectorAll("video")].map((v) => ({
      src: v.currentSrc || v.querySelector("source")?.src || v.src,
      ok: v.readyState >= 2 || !!v.currentSrc,
      paused: v.paused,
    }));
    return { imgs, vids };
  });

  const brokenImgs = assets.imgs.filter((i) => i.src && !i.ok);
  const heroVid = assets.vids.find((v) => (v.src || "").includes("hero.mp4"));
  const phone5 = assets.imgs.find((i) => (i.src || "").includes("5.png"));
  const phone6 = assets.imgs.find((i) => (i.src || "").includes("6.png"));

  // ---- overflow check ----
  const metrics = await page.evaluate(() => {
    const de = document.documentElement;
    const sw = de.scrollWidth;
    const iw = window.innerWidth;
    const offenders = [];
    for (const el of de.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > iw + 1.5 || r.left < -1.5)) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.toString().slice(0, 70)) || "",
          right: Math.round(r.right),
          left: Math.round(r.left),
          w: Math.round(r.width),
        });
      }
    }
    const seen = new Set();
    const uniq = offenders.filter((o) => {
      const k = o.cls + "|" + o.right;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return { sw, iw, offenders: uniq.slice(0, 12) };
  });

  const overflow = metrics.sw > metrics.iw;
  const name = `${OUT}/premium-${w}`;
  await page.screenshot({ path: `${name}.png`, fullPage: false });
  if (w <= 414) await page.screenshot({ path: `${name}-full.png`, fullPage: true });

  const pass = !overflow && brokenImgs.length === 0 && pageErrors.length === 0 && failedResponses.length === 0;
  if (!pass) hasBlocking = true;

  console.log(
    `\n[${w}px] ${pass ? "PASS" : "REVIEW"} | scrollW=${metrics.sw} innerW=${metrics.iw} overflow=${overflow ? "YES+" + (metrics.sw - metrics.iw) : "no"} | offenders=${metrics.offenders.length}`
  );
  for (const o of metrics.offenders) console.log(`   <${o.tag} class="${o.cls}"> right=${o.right} left=${o.left} w=${o.w}`);
  if (heroVid) console.log(`   hero.mp4 ok=${heroVid.ok} paused=${heroVid.paused}`);
  if (phone5) console.log(`   5.png   ok=${phone5.ok} ${phone5.w}x${phone5.h}`);
  if (phone6) console.log(`   6.png   ok=${phone6.ok} ${phone6.w}x${phone6.h}`);
  if (brokenImgs.length) console.log("   BROKEN IMAGES:", brokenImgs.map((b) => b.src).join(" | "));
  if (failedResponses.length) console.log("   FAILED RESPONSES:", failedResponses.join(" | "));
  if (pageErrors.length) console.log("   PAGE ERRORS:", pageErrors.join(" | "));

  await page.close();
  await ctx.close();
}

await browser.close();
console.log("\n" + (hasBlocking ? "RESULT: review needed (see above)" : "RESULT: all widths PASS") + "\nscreenshots in " + OUT);
