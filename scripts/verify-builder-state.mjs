import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://localhost:8085";
mkdirSync("scripts/.verify-builder", { recursive: true });
const MUSIC = "scripts/.verify-builder/test-music.mp3";
writeFileSync(MUSIC, Buffer.from("ID3 dummy audio payload for persistence test"));

const browser = await chromium.launch();
const out = [];

// ---------- TEST A: unauthenticated protected route must NOT redirect to "/" ----------
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const url = page.url();
  out.push(`A) unauth /admin -> ${url}  ${url.includes("/404") ? "OK (sent to /404, NOT /)" : "CHECK"}`);
  await ctx.close();
}

// ---------- TEST B: builder step persistence + Back/Forward + music file ----------
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const stepNum = () => page.locator(".inv-step-bar-num").textContent();

  await page.goto(BASE + "/taklifnoma/yangi", { waitUntil: "networkidle" });
  await page.waitForSelector(".inv-shell", { timeout: 8000 });

  // fill step 0 (couple)
  await page.fill("#bride", "Aygúl");
  await page.fill("#groom", "Marat");
  await page.waitForTimeout(500);

  // advance to step 1 (date)
  await page.getByRole("button", { name: /Davom etish/ }).click();
  await page.waitForFunction(() => document.querySelector(".inv-step-bar-num")?.textContent === "02");
  await page.fill("#wedding-date", "2026-09-12");
  await page.fill("#wedding-time", "19:30");
  await page.waitForTimeout(500);

  // advance to step 2 (venue)
  await page.getByRole("button", { name: /Davom etish/ }).click();
  await page.waitForFunction(() => document.querySelector(".inv-step-bar-num")?.textContent === "03");
  out.push(`B1) advanced to step ${await stepNum()} (expect 03)`);

  // browser Back/Forward across steps (no reload)
  await page.goBack();
  await page.waitForFunction(() => document.querySelector(".inv-step-bar-num")?.textContent === "02");
  out.push(`B2) BACK -> step ${await stepNum()} (expect 02) ${await stepNum() === "02" ? "OK" : "FAIL"}`);
  await page.goForward();
  await page.waitForFunction(() => document.querySelector(".inv-step-bar-num")?.textContent === "03");
  out.push(`B3) FORWARD -> step ${await stepNum()} (expect 03) ${await stepNum() === "03" ? "OK" : "FAIL"}`);

  // REFRESH — must stay on venue step (03) AND keep typed data. The couple
  // form (#bride) is not mounted on the venue step, so we read the always-visible
  // live preview (.inv-overlay-names) which reflects the hydrated draft.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".inv-shell");
  await page.waitForFunction(() => document.querySelector(".inv-step-bar-num")?.textContent === "03");
  await page.waitForFunction(
    () => document.querySelector(".inv-overlay-names")?.textContent?.includes("Aygúl"),
    null,
    { timeout: 5000 }
  );
  const names = await page.locator(".inv-overlay-names").first().textContent();
  out.push(`B4) REFRESH -> step ${await stepNum()} (03) + preview="${names}" ${names?.includes("Aygúl") ? "OK (step+data restored)" : "FAIL"}`);

  // MUSIC: jump to message step (3), pick a file, refresh, confirm it persists
  await page.goto(BASE + "/taklifnoma/yangi?step=message", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector(".inv-step-bar-num")?.textContent === "04");
  await page.setInputFiles("input[type=file]", MUSIC);
  await page.waitForSelector(".inv-music-name", { timeout: 4000 });
  const m1 = await page.locator(".inv-music-name").textContent();
  await page.waitForTimeout(600); // let debounced IndexedDB save flush
  await page.reload({ waitUntil: "networkidle" });
  let m2 = null;
  try {
    await page.waitForSelector(".inv-music-name", { timeout: 6000 });
    m2 = await page.locator(".inv-music-name").textContent();
  } catch {}
  out.push(`B5) MUSIC select="${m1}" -> after refresh="${m2}" ${m2 === m1 && m1 ? "OK (music file persisted)" : "FAIL"}`);

  // DIRECT URL deep link (TEST 4): ?step=gallery
  await page.goto(BASE + "/taklifnoma/yangi?step=gallery", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector(".inv-step-bar-num")?.textContent === "05");
  out.push(`B6) DIRECT ?step=gallery -> step ${await stepNum()} (expect 05) ${await stepNum() === "05" ? "OK" : "FAIL"}`);

  // cleanup draft
  await page.evaluate(() => window.indexedDB.deleteDatabase("vowly"));
  await ctx.close();
}

await browser.close();
console.log("\n=== BUILDER STATE PERSISTENCE TEST ===");
for (const l of out) console.log("  " + l);
