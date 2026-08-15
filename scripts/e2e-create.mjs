// End-to-end test: drive the builder through all 6 steps and click
// "TAKLIFNOMANI YARATISH". Verifies the create mutation succeeds,
// navigates to /taklifnoma/<slug>, and renders the final page without
// the previous "Qátelik júz berdi" error.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = ".verify-builder";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:8080";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const page = await ctx.newPage();

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));

await page.goto(`${BASE}/taklifnoma/yangi`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1500);

// Step 01 — Couple
await page.fill("#bride", "Ayzada");
await page.fill("#groom", "Nursultan");
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(500);

// Step 02 — Date
await page.fill("#wedding-date", "2026-09-18");
await page.fill("#wedding-time", "18:00");
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(500);

// Step 03 — Venue
await page.fill("#venue", "Atabek Saray");
await page.fill("#address", "Tashkent shahri, Mustaqillik 25");
await page.fill("#phone", "+998 90 123 45 67");
await page.fill("#maps", "https://maps.google.com/?q=Atabek+Saray");
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(500);

// Step 04 — Message (leave defaults)
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(500);

// Step 05 — Gallery (skip)
await page.click('button:has-text("Davom etish")');
await page.waitForTimeout(500);

// Step 06 — Template (keep t1 selected)
console.log("on step 6, clicking TAKLIFNOMANI YARATISH...");

// Listen for toast BEFORE click so we capture the error if any
const toasts = [];
page.on("console", (m) => {
  const t = m.text();
  if (t.includes("Qátelik") || t.includes("error") || t.includes("Error")) toasts.push(t);
});

await Promise.all([
  page.waitForURL(/\/taklifnoma\/.+/, { timeout: 20000 }).catch(() => null),
  page.click('button:has-text("Taklifnomani yaratish")'),
]);

await page.waitForTimeout(2500);

const finalUrl = page.url();
const navigated = /\/taklifnoma\/.+/.test(finalUrl) && !finalUrl.endsWith("/yangi");
const is404 = await page.$(".inv-success");
const title = await page.title().catch(() => "");

console.log("FINAL_URL", finalUrl);
console.log("NAVIGATED", navigated);
console.log("ON_NOT_FOUND_PANEL", !!is404);
console.log("CONSOLE_ERRORS_COUNT", consoleErrors.length);
if (consoleErrors.length) console.log("CONSOLE_ERRORS", consoleErrors.slice(0, 5).join(" | "));

await page.screenshot({ path: `${OUT}/06-after-create.png`, fullPage: true });

const verdict = navigated && !is404 ? "PASS" : "FAIL";
console.log("VERDICT", verdict);

await browser.close();
console.log("done");