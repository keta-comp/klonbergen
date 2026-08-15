// Focused test: prove the music autoplay wiring. We seed localStorage extras
// with a musicUrl for an existing slug, reload, dismiss the video gate, and
// assert the <audio> element's src is set to that URL.
import { chromium } from "playwright";

const BASE = "http://localhost:8080";
const SLUG = process.argv[2] || "ayzada-nursultan-pxs8e9";
const MUSIC = "https://example.com/sample-music.mp3";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Load once to establish origin, then seed extras + reload.
await page.goto(`${BASE}/taklifnoma/${SLUG}`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.evaluate(
  ([slug, url]) => {
    window.localStorage.setItem(
      `vowly:invitation-extras:${slug}`,
      JSON.stringify({ musicUrl: url })
    );
  },
  [SLUG, MUSIC]
);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".inv-video-gate", { timeout: 15000 }).catch(() => null);
await page.waitForTimeout(800);

// Video gate should be present with the seeded musicUrl merged in.
const before = await page.evaluate(() => {
  const a = document.querySelector("audio");
  return a ? a.getAttribute("src") || "" : "NO_AUDIO";
});
console.log("AUDIO_SRC_BEFORE_DISMISS", JSON.stringify(before));

// Dismiss the gate -> music should start (src set, play() attempted).
await page.click(".inv-video-gate");
await page.waitForTimeout(700);

const after = await page.evaluate(() => {
  const a = document.querySelector("audio");
  return {
    src: a ? a.getAttribute("src") || "" : "NO_AUDIO",
    elementSrc: a && a.src ? a.src : "",
  };
});
console.log("AUDIO_SRC_AFTER_DISMISS", JSON.stringify(after));

const pass = after.src === MUSIC || after.elementSrc === MUSIC;
console.log(pass ? "PASS :: music url wired to <audio> after video dismiss" : "FAIL :: audio not wired");
await browser.close();
console.log("done");
