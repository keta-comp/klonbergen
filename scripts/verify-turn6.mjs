// Turn 6 verification: venue "Alakoz Saray" big + envelope video gate rework
// (no center play icon, bottom BOSING CTA, autoplay-on-tap, smooth fade/scale
// transition, fallback on load failure).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = ".verify-turn6";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:8084";

writeFileSync(`${OUT}/test-music.mp3`, Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

const results = [];
const ok = (name, cond, extra = "") => { results.push({ name, pass: !!cond }); console.log(`${cond ? "PASS" : "FAIL"} :: ${name}${extra ? " :: " + extra : ""}`); };

const browser = await chromium.launch();

// ---------- PASS A: normal flow ----------
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, reducedMotion: "reduce", deviceScaleFactor: 2 });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));

await page.goto(`${BASE}/taklifnoma/yangi`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1200);
await page.fill("#bride", "Ayzada");
await page.fill("#groom", "Nursultan");
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(400);
await page.fill("#wedding-date", "2026-09-18");
await page.fill("#wedding-time", "18:00");
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(400);
await page.fill("#venue", "Alakoz Saray");
await page.fill("#address", "Tashkent shahri, Mustaqillik 25");
await page.fill("#phone", "+998 90 123 45 67");
await page.fill("#maps", "https://maps.google.com/?q=Alakoz+Saray");
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(500);
await page.setInputFiles('input[type="file"][accept="audio/*"]', `${OUT}/test-music.mp3`).catch(() => {});
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(400);
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(400);
await page.click('button:has-text("Taklifnomani yaratish")');
await page.waitForSelector(".inv-final-screen", { timeout: 25000 }).catch(() => null);
await page.waitForTimeout(1500);

const finalUrl = page.url();
ok("navigated to final page", /\/taklifnoma\/.+/.test(finalUrl) && !finalUrl.endsWith("/yangi"), finalUrl);

// gate entry: no center play button, BOSING CTA present, video paused, no autoplay
const entry = await page.evaluate(() => {
  const v = document.querySelector(".inv-video-gate video");
  const gate = document.querySelector(".inv-video-gate");
  const cta = document.querySelector(".inv-video-cta");
  const gb = gate ? gate.getBoundingClientRect() : null;
  const cb = cta ? cta.getBoundingClientRect() : null;
  return {
    gate: !!gate,
    centerPlay: !!document.querySelector(".inv-video-play"),
    paused: v ? v.paused : null,
    autoplay: v ? v.autoplay : null,
    muted: v ? v.muted : null,
    controls: v ? v.controls : null,
    ctaText: cta ? cta.innerText.trim() : null,
    ctaBottom: cb && gb ? cb.top > gb.height * 0.6 : null, // lower 40%
  };
});
ok("video gate present on entry", entry.gate);
ok("NO center play button (.inv-video-play absent)", entry.centerPlay === false);
ok("video does NOT autoplay (paused=true)", entry.paused === true, `paused=${entry.paused}`);
ok("video has no autoplay attribute", entry.autoplay === false);
ok("video is muted (autoplay-safe)", entry.muted === true);
ok("video has no native controls", entry.controls === false);
ok("BOSING CTA shown on entry", entry.ctaText === "BOSING", `text=${entry.ctaText}`);
ok("BOSING CTA sits at the BOTTOM (not center)", entry.ctaBottom === true);
await page.screenshot({ path: `${OUT}/t6-gate-entry.png` });

// tap BOSING -> video starts, BOSING hidden, no other buttons during play
await page.click(".inv-video-cta");
await page.waitForTimeout(600);
const afterTap = await page.evaluate(() => {
  const v = document.querySelector(".inv-video-gate video");
  return {
    ctaGone: !document.querySelector(".inv-video-cta"),
    paused: v ? v.paused : null,
  };
});
ok("after BOSING tap, BOSING button hidden", afterTap.ctaGone === true);
ok("after BOSING tap, video playing (paused=false)", afterTap.paused === false, `paused=${afterTap.paused}`);

// simulate video end -> smooth transition reveals invitation
await page.evaluate(() => {
  const v = document.querySelector(".inv-video-gate video");
  if (v) { try { v.currentTime = Math.max(0, (v.duration || 1) - 0.05); } catch {} v.dispatchEvent(new Event("ended")); }
});
await page.waitForTimeout(1100);
const gateAfter = await page.locator(".inv-video-gate").count();
ok("video gate dismissed after playback ends (smooth transition)", gateAfter === 0);

// venue screen (index 1): big "Alakoz Saray" name, centered, 18:00 below, maps at bottom
const venue = await page.evaluate(() => {
  const s = document.querySelectorAll(".inv-final-screen")[1];
  const ov = s ? s.querySelector(".inv-screen-overlay--venue") : null;
  const name = s ? s.querySelector(".inv-venue-name") : null;
  const maps = s ? s.querySelector(".inv-venue-maps") : null;
  const cs = ov ? getComputedStyle(ov) : null;
  const ncs = name ? getComputedStyle(name) : null;
  return {
    hasNameClass: !!name,
    nameText: name ? name.innerText.trim() : null,
    namePx: ncs ? parseFloat(ncs.fontSize) : null,
    textAlign: cs ? cs.textAlign : null,
    justify: cs ? cs.justifyContent : null,
    mapsHref: maps ? maps.getAttribute("href") : null,
    bodyText: s ? s.innerText.replace(/\s+/g, " ").trim() : null,
  };
});
ok("venue uses dedicated .inv-venue-name class", venue.hasNameClass);
ok("venue name shows 'Alakoz Saray'", /alakoz saray/i.test(venue.nameText || ""), venue.nameText);
ok("venue name is large (>=40px @2x)", venue.namePx && venue.namePx >= 40, `px=${venue.namePx}`);
ok("venue overlay text centered", venue.textAlign === "center");
ok("venue 18:00 time present below name", /18:00/.test(venue.bodyText || ""));
const mapsEl = await page.locator(".inv-final-screen").nth(1).locator(".inv-venue-maps").count();
ok("venue maps button present (Xarıtada kóriw)", mapsEl > 0 && !!venue.mapsHref, `${mapsEl} :: ${venue.mapsHref}`);

// screenshots of each screen after dismiss
const screenNames = ["cover", "venue", "invitation", "final"];
for (let i = 0; i < 4; i++) {
  await page.evaluate((idx) => { document.querySelectorAll(".inv-final-screen")[idx].scrollIntoView({ block: "center" }); }, i);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/t6-screen-${i}-${screenNames[i]}.png` });
}

// ---------- PASS B: fallback when video fails to load ----------
const ctx2 = await browser.newContext({ viewport: { width: 430, height: 932 }, reducedMotion: "reduce", deviceScaleFactor: 2 });
const page2 = await ctx2.newPage();
await page2.route("**/mobile.mp4", (route) => route.abort());
await page2.goto(finalUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
await page2.waitForTimeout(2500);
const fb = await page2.evaluate(() => {
  const cta = document.querySelector(".inv-video-cta");
  return { present: !!cta, text: cta ? cta.innerText.trim() : null, isFallback: cta ? cta.classList.contains("inv-video-cta--fallback") : false };
});
ok("video load failure shows fallback CTA (not stranded)", fb.present && fb.isFallback, `text=${fb.text}`);

console.log("CONSOLE_ERRORS", consoleErrors.length);
if (consoleErrors.length) console.log("CONSOLE_ERRORS_DETAIL", consoleErrors.slice(0, 6).join(" || "));

const failed = results.filter((r) => !r.pass);
console.log(`\nVERDICT ${failed.length === 0 ? "PASS" : "FAIL"} (${results.length - failed.length}/${results.length})`);
await browser.close();
console.log("done");
