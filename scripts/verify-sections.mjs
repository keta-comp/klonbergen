// Capture each landing section individually for visual verification.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = "http://localhost:8080/";
const OUT = ".verify-sections";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForTimeout(2500);

  // Each entry: section id (or selector) and a human label
  const targets = [
    { id: "nege", label: "01-qr-experience" },
    { id: "mumkinshilikler", label: "03-live-toy-timeline" },
    { id: "qalay", label: "04-sezimleri-gallery" },
    { id: "bahalar", label: "06-pricing" },
    { id: "baylanis", label: "07-footer" },
  ];

  for (const t of targets) {
    const el = await page.$(`#${t.id}`);
    if (!el) {
      console.log(`MISS ${t.id}`);
      continue;
    }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await el.screenshot({ path: `${OUT}/${t.label}.png` });
    console.log(`captured ${t.label}`);
  }

  // Capture the features section (no id)
  const features = await page.$(".features-grid");
  if (features) {
    await features.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const parent = await features.evaluateHandle((el) => el.closest("section"));
    await parent.asElement()?.screenshot({ path: `${OUT}/02-features.png` });
    console.log("captured 02-features");
  }

  // Capture venue-panel section
  const venue = await page.$(".venue-grid");
  if (venue) {
    await venue.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const parent = await venue.evaluateHandle((el) => el.closest("section"));
    await parent.asElement()?.screenshot({ path: `${OUT}/05-venue.png` });
    console.log("captured 05-venue");
  }

  // Capture qr-flow + qr-phone-pair explicitly
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForTimeout(2000);
  const qrflow = await page.$(".qr-flow");
  if (qrflow) {
    await qrflow.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await qrflow.screenshot({ path: `${OUT}/01b-qr-flow.png` });
    console.log("captured 01b-qr-flow");
  }
  const qrphone = await page.$(".qr-phone-pair");
  if (qrphone) {
    await qrphone.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await qrphone.screenshot({ path: `${OUT}/01c-qr-phones.png` });
    console.log("captured 01c-qr-phones");
  }
  const ht = await page.$(".horizontal-timeline");
  if (ht) {
    await ht.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await ht.screenshot({ path: `${OUT}/03b-horizontal-timeline.png` });
    console.log("captured 03b-horizontal-timeline");
  }
  const sez = await page.$(".sezimleri-grid");
  if (sez) {
    await sez.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await sez.screenshot({ path: `${OUT}/04b-sezimleri-grid.png` });
    console.log("captured 04b-sezimleri-grid");
  }
} finally {
  await browser.close();
}
console.log("done");