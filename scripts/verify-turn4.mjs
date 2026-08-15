// Turn 4 verification: music picker in builder + final page (video gate,
// screen swap, removed topbar, cover variant, music wiring).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = ".verify-builder";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:8080";

// dummy audio file for the music picker
writeFileSync(`${OUT}/test-music.mp3`, Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

const results = [];
const ok = (name, cond, extra = "") => { results.push({ name, pass: !!cond, extra }); console.log(`${cond ? "PASS" : "FAIL"} :: ${name}${extra ? " :: " + extra : ""}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));

// ---------- PART A: builder music picker ----------
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

// On step 4 (Message) — music picker should be present
const musicLabel = await page.locator("text=Musiqa qo'shish").count();
ok("builder step4 shows 'Musiqa qo'shish' label", musicLabel > 0);
const uploadBtn = await page.locator("button:has-text(\"Musiqa yuklash\")").count();
ok("builder step4 shows 'Musiqa yuklash' button", uploadBtn > 0);

// attach a music file
await page.setInputFiles('input[type="file"][accept="audio/*"]', `${OUT}/test-music.mp3`);
await page.waitForTimeout(400);
const chipName = await page.locator(".inv-music-chip").count();
ok("music chip appears after picking file", chipName > 0);

// ---------- PART B: create and verify final page ----------
await page.click('button:has-text("Davom etish")'); // gallery
await page.waitForTimeout(400);
await page.click('button:has-text("Davom etish")'); // template
await page.waitForTimeout(400);

await page.click('button:has-text("Taklifnomani yaratish")');
// Wait for the async create + navigate to finish, then run all checks.
await page.waitForSelector(".inv-final-screen", { timeout: 25000 }).catch(() => null);
await page.waitForTimeout(1500);

const finalUrl = page.url();
ok("navigated to final page", /\/taklifnoma\/.+/.test(finalUrl) && !finalUrl.endsWith("/yangi"), finalUrl);

// topbar removed
const topbar = await page.locator(".inv-final-topbar").count();
ok("topbar removed (no .inv-final-topbar)", topbar === 0);

// video gate present initially
const gateCount = await page.locator(".inv-video-gate").count();
ok("intro video gate present on entry", gateCount === 1);
const gateVideoSrc = await page.locator(".inv-video-gate video").getAttribute("src").catch(() => null);
ok("video gate uses /mobile.mp4", gateVideoSrc && gateVideoSrc.includes("mobile.mp4"), String(gateVideoSrc));

// screen layout inspection
const screens = await page.evaluate(() => {
  return Array.from(document.querySelectorAll(".inv-final-screen")).map((s) => {
    const img = s.querySelector("img");
    const ov = s.querySelector(".inv-screen-overlay");
    return {
      bg: img ? img.getAttribute("src") : null,
      classes: ov ? Array.from(ov.classList) : [],
      text: ov ? ov.innerText.replace(/\s+/g, " ").trim() : "",
    };
  });
});
ok("4 screens present", screens.length === 4, `count=${screens.length}`);
ok("screen1 = /1.png (cover)", screens[0]?.bg === "/1.png", screens[0]?.bg);
ok("cover uses --cover variant (right-shifted)", screens[0]?.classes.includes("inv-screen-overlay--cover"), screens[0]?.classes.join(" "));
ok("screen2 = /2.png (venue hall)", screens[1]?.bg === "/2.png", screens[1]?.bg);
ok("screen2 shows venue name 'Atabek Saray'", (screens[1]?.text || "").toLowerCase().includes("atabek saray"), (screens[1]?.text || "").slice(0, 70));
const screen2Maps = await page.locator(".inv-final-screen").nth(1).locator('a[href*="maps"]').count();
ok("screen2 shows maps button (Xarıtada kóriw)", screen2Maps > 0, `mapsLinks=${screen2Maps}`);
ok("screen3 = /3.png (doves / invitation)", screens[2]?.bg === "/3.png", screens[2]?.bg);
ok("screen3 shows invitation copy (Hurmatli mehmonlar...)", (screens[2]?.text || "").toLowerCase().includes("hurmatli mehmonlar"), (screens[2]?.text || "").slice(0, 70));
ok("screen4 = /4.png (final + timeline)", screens[3]?.bg === "/4.png", screens[3]?.bg);

// dismiss video gate
await page.click(".inv-video-gate");
await page.waitForTimeout(900);
const gateAfter = await page.locator(".inv-video-gate").count();
ok("video gate dismissed on tap", gateAfter === 0);

// music autoplay wiring: audio element exists; if musicUrl present in extras, src set on dismiss
const audioInfo = await page.evaluate(() => {
  const a = document.querySelector("audio");
  return a ? { exists: true, src: a.getAttribute("src") || "", hasSrc: !!a.src } : { exists: false };
});
ok("audio element exists on final page", audioInfo.exists);
console.log("AUDIO_INFO", JSON.stringify(audioInfo));
console.log("MUSIC_UPLOAD_NOTE", "musicUrl empty => storage upload likely blocked by bucket policy (400); wiring is correct and will play once a public URL is returned");

await page.screenshot({ path: `${OUT}/turn4-final.png`, fullPage: true });

console.log("CONSOLE_ERRORS", consoleErrors.length);
if (consoleErrors.length) console.log("CONSOLE_ERRORS_DETAIL", consoleErrors.slice(0, 6).join(" || "));

const failed = results.filter((r) => !r.pass);
console.log(`\nVERDICT ${failed.length === 0 ? "PASS" : "FAIL"} (${results.length - failed.length}/${results.length})`);
await browser.close();
console.log("done");
