import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:8085";
const out = [];

// ---- generate a tiny valid WAV so we have a real File to upload ----
function makeWav() {
  const sr = 8000, secs = 0.3, ch = 1, bps = 16;
  const dataSize = sr * secs * ch * (bps / 8);
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(ch, 22); buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * ch * (bps / 8), 28); buf.writeUInt16LE(ch * (bps / 8), 32);
  buf.writeUInt16LE(bps, 34); buf.write("data", 36); buf.writeUInt32LE(dataSize, 40);
  return buf;
}
const musicPath = join(tmpdir(), `vowly-test-music-${Date.now()}.wav`);
writeFileSync(musicPath, makeWav());

const browser = await chromium.launch();
const ctx = await browser.newContext({ reducedMotion: "reduce" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

async function dismissGate() {
  await page.locator(".inv-video-cta").first().click();
  try {
    await page.locator(".inv-video-cta--fallback").waitFor({ timeout: 6000 });
    await page.locator(".inv-video-cta--fallback").click();
  } catch {
    await page.locator(".inv-video-gate").waitFor({ state: "detached", timeout: 12000 });
  }
}
const audioState = () =>
  page.evaluate(() => {
    const a = document.querySelector("audio");
    return a ? { src: a.currentSrc || a.src, loop: a.loop, paused: a.paused } : null;
  });
const clickPrimary = () => page.locator(".inv-nav button.inv-btn-primary:not([disabled])").click();

// ===== TEST A — builder music survives refresh =====
await page.goto(`${BASE}/kaa/taklifnoma/yangi`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".inv-shell");
// Clean slate: discard any leftover builder draft from a prior run so we start
// on step 1 with empty fields.
await page.evaluate(() => new Promise((res) => {
  const r = indexedDB.open("vowly");
  r.onsuccess = () => {
    const db = r.result;
    try {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").delete("vowly_builder_draft_v1");
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); res(); };
    } catch { db.close(); res(); }
  };
  r.onerror = () => res();
}));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".inv-shell");
await page.fill("#bride", "Aygúl");
await page.fill("#groom", "Marat");
await clickPrimary(); // -> date
await page.fill("#wedding-date", "2026-10-01");
await page.fill("#wedding-time", "18:00");
await clickPrimary(); // -> venue
await page.fill("#venue", "Test Hall");
await clickPrimary(); // -> message (music step)
await page.waitForTimeout(400);
await page.setInputFiles('input[type=file][accept="audio/*"]', musicPath);
await page.waitForSelector(".inv-music-chip", { timeout: 5000 });
out.push(`[A] music chip shown after upload: OK`);
// Quick refresh right after picking (user's reported scenario) — relies on the
// immediate save + flush-on-hide.
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".inv-shell");
await page.waitForTimeout(700);
const chipAfterReload = await page.locator(".inv-music-chip").count();
out.push(`[A] music chip after REFRESH: ${chipAfterReload > 0 ? "OK (persisted)" : "FAIL (lost)"}`);

// ===== TEST B — published page plays music + survives refresh =====
// jump to template step (draft is in IndexedDB) and create
await page.goto(`${BASE}/kaa/taklifnoma/yangi?step=template`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".inv-shell");
await page.waitForTimeout(500);
await clickPrimary(); // create
// Wait for the REAL published page: /taklifnoma/<slug> (not /taklifnoma/yangi)
await page.waitForURL(/\/taklifnoma\/(?!yangi)/, { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForSelector(".inv-video-gate", { timeout: 8000 });
const url = page.url();
out.push(`[B] created invitation: ${url.replace(BASE, "")}`);
await page.waitForSelector(".inv-video-gate", { timeout: 8000 });
await dismissGate();
await page.waitForTimeout(800);
const a1 = await audioState();
out.push(`[B] music after dismiss: ${JSON.stringify(a1)}`);
out.push(`[B] plays local file (blob): ${a1 && a1.src.startsWith("blob:") ? "OK" : "FAIL"} | loop: ${a1?.loop ? "OK" : "FAIL"}`);

// refresh the published page — music must come back from IndexedDB
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".inv-video-gate", { timeout: 8000 });
await dismissGate();
await page.waitForTimeout(800);
const a2 = await audioState();
out.push(`[B] music after REFRESH of published page: ${JSON.stringify(a2)}`);
out.push(`[B] survives refresh (blob): ${a2 && a2.src.startsWith("blob:") ? "OK" : "FAIL"}`);

out.push(`console errors: ${errors.length}`);
for (const e of errors) out.push(`  err: ${e}`);
await browser.close();
console.log("\n=== MUSIC FLOW VERIFICATION ===");
for (const l of out) console.log("  " + l);
