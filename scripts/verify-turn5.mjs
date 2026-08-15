// Turn 5 verification: video gate tap-to-play, cover centered+bigger,
// venue text middle + maps bottom, invitation text higher.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = ".verify-turn5";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:8083";

writeFileSync(`${OUT}/test-music.mp3`, Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

const results = [];
const ok = (name, cond, extra = "") => { results.push({ name, pass: !!cond }); console.log(`${cond ? "PASS" : "FAIL"} :: ${name}${extra ? " :: " + extra : ""}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, reducedMotion: "reduce", deviceScaleFactor: 2 });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));

// ---------- create a fresh invitation (reuse builder flow) ----------
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
await page.fill("#venue", "Atabek Saray");
await page.fill("#address", "Tashkent shahri, Mustaqillik 25");
await page.fill("#phone", "+998 90 123 45 67");
await page.fill("#maps", "https://maps.google.com/?q=Atabek+Saray");
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(500);
await page.setInputFiles('input[type="file"][accept="audio/*"]', `${OUT}/test-music.mp3`).catch(() => {});
await page.waitForTimeout(300);
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(400);
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(400);
await page.click('button:has-text("Taklifnomani yaratish")');
await page.waitForSelector(".inv-final-screen", { timeout: 25000 }).catch(() => null);
await page.waitForTimeout(1500);

const finalUrl = page.url();
ok("navigated to final page", /\/taklifnoma\/.+/.test(finalUrl) && !finalUrl.endsWith("/yangi"), finalUrl);

// ---------- TURN 5: video gate does NOT autoplay ----------
const entry = await page.evaluate(() => {
  const v = document.querySelector(".inv-video-gate video");
  return {
    gate: !!document.querySelector(".inv-video-gate"),
    paused: v ? v.paused : null,
    hasPlayBtn: !!document.querySelector(".inv-video-play"),
    autoplay: v ? v.autoplay : null,
  };
});
ok("video gate present on entry", entry.gate);
ok("video does NOT autoplay (paused=true)", entry.paused === true, `paused=${entry.paused}`);
ok("no autoplay attribute on video", entry.autoplay === false, `autoplay=${entry.autoplay}`);
ok("play affordance shown on entry (.inv-video-play)", entry.hasPlayBtn);
await page.screenshot({ path: `${OUT}/t5-gate-entry.png` });

// tap once -> should START playing, play button disappears
await page.click(".inv-video-gate");
await page.waitForTimeout(700);
const afterTap = await page.evaluate(() => {
  const v = document.querySelector(".inv-video-gate video");
  return { hasPlayBtn: !!document.querySelector(".inv-video-play"), paused: v ? v.paused : null, started: v ? v.currentTime > 0 || !v.paused : null };
});
ok("after first tap, play button hidden (videoStarted)", afterTap.hasPlayBtn === false);
ok("after first tap, video playing (paused=false)", afterTap.paused === false, `paused=${afterTap.paused}`);

// simulate video end -> invitation revealed
await page.evaluate(() => {
  const v = document.querySelector(".inv-video-gate video");
  if (v) { try { v.currentTime = Math.max(0, (v.duration || 1) - 0.05); } catch {} v.dispatchEvent(new Event("ended")); }
});
await page.waitForTimeout(1000);
const gateAfter = await page.locator(".inv-video-gate").count();
ok("video gate dismissed after playback ends", gateAfter === 0);
await page.screenshot({ path: `${OUT}/t5-after-dismiss.png`, fullPage: true });

// ---------- cover (screen 0): centered + bigger ----------
const cover = await page.evaluate(() => {
  const s = document.querySelector(".inv-final-screen");
  const ov = s ? s.querySelector(".inv-screen-overlay") : null;
  if (!ov) return null;
  const cs = getComputedStyle(ov);
  const names = ov.querySelector(".inv-cover-names");
  return { cls: Array.from(ov.classList), textAlign: cs.textAlign, namesFont: names ? getComputedStyle(names).fontSize : null };
});
ok("cover uses --cover variant", cover?.cls.includes("inv-screen-overlay--cover"), cover?.cls.join(" "));
ok("cover text is centered (text-align center)", cover?.textAlign === "center", `textAlign=${cover?.textAlign}`);
ok("cover names font is large (>=40px @2x ~ 20px css)", cover?.namesFont && parseFloat(cover.namesFont) >= 38, `font=${cover?.namesFont}`);

// ---------- venue (screen 1): text middle, maps at bottom ----------
const venue = await page.evaluate(() => {
  const s = document.querySelectorAll(".inv-final-screen")[1];
  const ov = s ? s.querySelector(".inv-screen-overlay") : null;
  const body = s ? s.querySelector(".inv-venue-body") : null;
  const maps = s ? s.querySelector(".inv-venue-maps") : null;
  const cs = ov ? getComputedStyle(ov) : null;
  const mcs = maps ? getComputedStyle(maps) : null;
  return {
    cls: ov ? Array.from(ov.classList) : [],
    overlayJustify: cs ? cs.justifyContent : null,
    hasBody: !!body,
    bodyText: body ? body.innerText.replace(/\s+/g, " ").trim().slice(0, 60) : null,
    mapsHref: maps ? maps.getAttribute("href") : null,
    mapsPos: mcs ? mcs.position : null,
    mapsBottom: mcs ? mcs.bottom : null,
  };
});
ok("venue overlay uses --venue variant", venue?.cls.includes("inv-screen-overlay--venue"), venue?.cls.join(" "));
ok("venue has centered text body (.inv-venue-body)", venue?.hasBody && /atabek saray/i.test(venue?.bodyText || ""), venue?.bodyText);
ok("venue maps link present", !!venue?.mapsHref, venue?.mapsHref);
ok("venue maps pinned to bottom (position absolute)", venue?.mapsPos === "absolute", `pos=${venue?.mapsPos}`);
ok("venue maps has bottom offset", venue?.mapsBottom && venue.mapsBottom !== "auto", `bottom=${venue?.mapsBottom}`);

// ---------- invitation (screen 2): higher up, off the doves ----------
const invite = await page.evaluate(() => {
  const s = document.querySelectorAll(".inv-final-screen")[2];
  const ov = s ? s.querySelector(".inv-screen-overlay") : null;
  if (!ov) return null;
  const cs = getComputedStyle(ov);
  return { cls: Array.from(ov.classList), justify: cs.justifyContent, paddingTop: cs.paddingTop, inlinePadBottom: ov.style.paddingBottom };
});
ok("invitation uses --invitation variant", invite?.cls.includes("inv-screen-overlay--invitation"), invite?.cls.join(" "));
ok("invitation text pushed up (justify-content flex-start)", invite?.justify === "flex-start", `justify=${invite?.justify}`);
ok("invitation overlay has top padding (pushed up)", invite?.paddingTop && parseFloat(invite.paddingTop) > 0, `padTop=${invite?.paddingTop}`);
ok("invitation overlay has no inline paddingBottom hack", !invite?.inlinePadBottom, `inlinePadBottom=${invite?.inlinePadBottom}`);

// screenshots of each screen individually
const bgs = await page.evaluate(() => Array.from(document.querySelectorAll(".inv-final-screen img")).map((i) => i.getAttribute("src")));
console.log("SCREEN_BGS", JSON.stringify(bgs));
const screenNames = ["cover", "venue", "invitation", "final"];
for (let i = 0; i < 4; i++) {
  await page.evaluate((idx) => { document.querySelectorAll(".inv-final-screen")[idx].scrollIntoView({ block: "center" }); }, i);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/t5-screen-${i}-${screenNames[i]}.png` });
}

console.log("CONSOLE_ERRORS", consoleErrors.length);
if (consoleErrors.length) console.log("CONSOLE_ERRORS_DETAIL", consoleErrors.slice(0, 6).join(" || "));

const failed = results.filter((r) => !r.pass);
console.log(`\nVERDICT ${failed.length === 0 ? "PASS" : "FAIL"} (${results.length - failed.length}/${results.length})`);
await browser.close();
console.log("done");
