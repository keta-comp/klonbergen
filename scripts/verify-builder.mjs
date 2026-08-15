// Visual verification for the new Taklifnoma editorial builder.
// 1) Seeds a base-column test invitation via the anon insert policy.
// 2) Captures the builder at desktop + after live typing + a later step + mobile.
// 3) Captures the final invitation page for the seeded slug.
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync } from "node:fs";
import { readFileSync } from "node:fs";

const OUT = ".verify-builder";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:8080";

// ---- parse .env ----
const env = readFileSync(".env", "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .reduce((acc, line) => {
    const i = line.indexOf("=");
    if (i > 0) {
      let v = line.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      acc[line.slice(0, i)] = v;
    }
    return acc;
  }, {});
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ---- seed a test invitation (base columns only) ----
const rand = Math.random().toString(36).slice(2, 8);
const slug = `verify-azizbek-maftuna-${rand}`;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const { data: seed, error: seedErr } = await supabase
  .from("invitations")
  .insert({
    slug,
    bride_name: "Aygúl",
    groom_name: "Marat",
    wedding_date: "2026-10-18",
    wedding_time: "19:00",
    hall_name: "Zarafshon Ceremony Hall",
    address: "Nukus shahri, Berdaq ko‘chasi 12",
    photos: [],
    template: "luxury",
    views: 0,
  })
  .select()
  .single();
if (seedErr) {
  console.log("SEED_ERROR", JSON.stringify(seedErr));
} else {
  console.log("SEEDED_SLUG", slug);
}

const browser = await chromium.launch();
const log = [];
try {
  // ---------------- DESKTOP ----------------
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/taklifnoma/yangi`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/01-builder-desktop.png`, fullPage: true });
  log.push("captured 01-builder-desktop");

  // ---- LIVE PREVIEW TEST: type names, verify preview updates ----
  await page.fill("#bride", "Aygúl");
  await page.fill("#groom", "Marat");
  await page.waitForTimeout(900);
  const preview = await page.$(".inv-preview-col");
  await preview.screenshot({ path: `${OUT}/02-builder-live-preview.png` });
  log.push("captured 02-builder-live-preview");

  // confirm names appear in preview
  const previewText = await page.$eval(".inv-preview-col", (el) => el.innerText).catch(() => "");
  const liveOk = previewText.includes("Aygúl") && previewText.includes("Marat");
  log.push(`LIVE_PREVIEW_NAMES_VISIBLE=${liveOk}`);

  // ---- advance to venue step ----
  await page.click('button:has-text("Davom etish")');
  await page.waitForTimeout(600);
  await page.fill("#wedding-date", "2026-10-18");
  await page.fill("#wedding-time", "19:00");
  await page.click('button:has-text("Davom etish")');
  await page.waitForTimeout(600);
  await page.fill("#venue", "Zarafshon Ceremony Hall");
  await page.fill("#address", "Nukus shahri, Berdaq ko‘chasi 12");
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/03-builder-step3-venue.png`, fullPage: true });
  log.push("captured 03-builder-step3-venue");
  await ctx.close();

  // ---------------- MOBILE ----------------
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
    isMobile: true,
  });
  const mpage = await mctx.newPage();
  await mpage.goto(`${BASE}/taklifnoma/yangi`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await mpage.waitForTimeout(2500);
  await mpage.screenshot({ path: `${OUT}/04-builder-mobile.png`, fullPage: true });
  log.push("captured 04-builder-mobile");
  await mctx.close();

  // ---------------- FINAL PAGE ----------------
  if (seed) {
    const fctx = await browser.newContext({ viewport: { width: 420, height: 900 }, reducedMotion: "reduce" });
    const fpage = await fctx.newPage();
    await fpage.goto(`${BASE}/taklifnoma/${slug}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await fpage.waitForTimeout(3000);
    await fpage.screenshot({ path: `${OUT}/05-final-page.png`, fullPage: true });
    log.push("captured 05-final-page");
    await fctx.close();
  }
} finally {
  await browser.close();
}
console.log(log.join("\n"));
console.log("done");
