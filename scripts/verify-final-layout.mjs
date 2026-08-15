// Create a fresh test invitation, then capture each of the 4 final-page
// screens individually to verify the new layout (bigger text, centered
// cover, big venue info in open space, visual timeline without NaN).
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync } from "node:fs";

const OUT = ".verify-builder";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:8080";

const env = readFileSync(".env", "utf8").split("\n").map((l) => l.trim()).filter(Boolean)
  .reduce((acc, line) => {
    const i = line.indexOf("=");
    if (i > 0) {
      let v = line.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      acc[line.slice(0, i)] = v;
    }
    return acc;
  }, {});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const rand = Math.random().toString(36).slice(2, 8);
const slug = `layout-ayzada-nursultan-${rand}`;
const { error: seedErr } = await supabase.from("invitations").insert({
  slug,
  bride_name: "Ayzada",
  groom_name: "Nursultan",
  wedding_date: "2026-09-18",
  wedding_time: "18:00",
  hall_name: "Atabek Saray",
  address: "Tashkent shahri, Mustaqillik 25",
  photos: [],
  template: "luxury",
  views: 0,
});
if (seedErr) console.log("SEED_ERROR", seedErr.message);
else console.log("SEEDED", slug);

const browser = await chromium.launch();
// phone-shaped viewport so each screen renders at ~390px
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGE_ERROR", e.message));

// Pre-seed localStorage extras so the final page shows custom messages/phone/maps
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.evaluate(
  ([s, extras]) => {
    localStorage.setItem(`vowly:invitation-extras:${s}`, JSON.stringify(extras));
  },
  [
    slug,
    {
      welcomeText: "Hurmatli mehmonlar, biz sizlarni quvonchli kunimiz — to'yimizga taklif qilamiz.",
      invitationText: "Sizlarning ishtirokingiz biz uchun alohida ahamiyatga ega.",
      finalText: "Sizni intizorlik bilan kutamiz.",
      phone: "+998 90 123 45 67",
      mapsUrl: "https://maps.google.com/?q=Atabek+Saray",
      templateId: "t1",
    },
  ]
);

await page.goto(`${BASE}/taklifnoma/${slug}`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2500);

// Screenshot each of the 4 final screens
const screens = await page.$$(".inv-final-screen");
console.log("SCREENS_FOUND", screens.length);
for (let i = 0; i < screens.length; i++) {
  await screens[i].scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await screens[i].screenshot({ path: `${OUT}/layout-screen-0${i + 1}.png` });
  console.log(`captured layout-screen-0${i + 1}`);
}

// Also full page for context
await page.screenshot({ path: `${OUT}/layout-full.png`, fullPage: true });
console.log("captured layout-full");

// Verify countdown is NOT NaN
const timelineText = await page.evaluate(() => {
  const t = document.querySelector(".inv-timeline");
  return t ? t.innerText : "";
}).catch(() => "");
const hasNaN = /NaN/.test(timelineText);
console.log("TIMELINE_TEXT", JSON.stringify(timelineText));
console.log("HAS_NAN", hasNaN);

await browser.close();
console.log("done");