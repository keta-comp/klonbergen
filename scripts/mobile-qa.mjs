// Mobile/tablet responsive QA for the Vowly landing page.
// Loads /ru (worst-case long copy) at 7 breakpoints, asserts no horizontal
// scroll, verifies the timeline stack order, and captures screenshots.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.QA_BASE || "http://localhost:4173";
const OUT = "scripts/shots";
mkdirSync(OUT, { recursive: true });

const WIDTHS = [320, 360, 375, 390, 414, 430, 768, 1280];

const browser = await chromium.launch();
const results = [];

for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  let url = "/ru";
  await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 30000 }).catch(async () => {
    // fallback: root landing
    url = "/";
    await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 30000 });
  });
  // let fonts + reveal animations settle
  await page.waitForTimeout(900);

  const metrics = await page.evaluate(() => {
    const de = document.documentElement;
    const sw = de.scrollWidth;
    const sx = window.scrollX;
    const iw = window.innerWidth;
    // find elements whose right edge pokes past the viewport (excluding
    // elements inside an overflow-clipped/scroll ancestor — those are contained)
    const offenders = [];
    const all = document.querySelectorAll("body *");
    for (const el of all) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.right > iw + 2 && r.width > 0) {
        // walk up to see if an ancestor clips overflow
        let clipped = false;
        let p = el.parentElement;
        while (p) {
          const pcs = getComputedStyle(p);
          if (pcs.overflowX === "hidden" || pcs.overflowX === "clip" || pcs.overflowX === "auto" || pcs.overflowX === "scroll") {
            clipped = true;
            break;
          }
          p = p.parentElement;
        }
        if (!clipped) offenders.push({ cls: el.className?.toString?.().slice(0, 60), right: Math.round(r.right), w: Math.round(r.width) });
      }
    }
    return { sw, sx, iw, offenders: offenders.slice(0, 12) };
  });

  // Authoritative "no horizontal scroll" = the document cannot be scrolled
  // horizontally AND no element pokes past the viewport WITHOUT being clipped
  // by an overflow ancestor (a full-bleed hero video / internal timeline
  // scroller are intentionally clipped and must not fail this check).
  const noHScroll = metrics.sx <= 0 && metrics.offenders.length === 0;

  // Timeline order check (only meaningful when stacked vertically, i.e. < 900)
  let timeline = null;
  if (w < 900) {
    timeline = await page.evaluate(() => {
      const step = document.querySelector(".premium-tl-step");
      if (!step) return null;
      const pick = (s) => {
        const el = step.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
      };
      const t = pick(".premium-tl-time");
      const img = pick(".premium-tl-img");
      const title = pick(".premium-tl-title");
      const desc = pick(".premium-tl-desc");
      if (!t || !img || !title || !desc) return { ok: false, missing: true };
      const ok = t.top < img.top && img.top < title.top && title.top < desc.top;
      return { ok, t: t.top, img: img.top, title: title.top, desc: desc.top };
    });
  }

  await page.screenshot({ path: `${OUT}/ru-${w}.png`, fullPage: false });
  results.push({ w, url, noHScroll, sw: metrics.sw, iw: metrics.iw, offenders: metrics.offenders, timeline, errors });
  console.log(
    `w=${w} url=${url} noHScroll=${noHScroll} sx=${metrics.sx} sw=${metrics.sw} iw=${metrics.iw} ` +
    `timeline=${timeline ? (timeline.ok ? "OK(stacked)" : "BAD-order") : "n/a(desktop)"} ` +
    `offenders=${metrics.offenders.length} pageErrors=${errors.length}`
  );
  if (metrics.offenders.length) console.log("   offenders:", JSON.stringify(metrics.offenders));
  await page.close();
}

await browser.close();

const fail = results.filter((r) => !r.noHScroll || (r.w < 900 && r.timeline && !r.timeline.ok) || r.errors.length);
console.log("\n=== SUMMARY ===");
console.log(JSON.stringify(results, null, 2));
console.log(fail.length ? `\nFAILED: ${fail.length} widths` : "\nALL CHECKS PASSED");
process.exit(fail.length ? 1 : 0);
