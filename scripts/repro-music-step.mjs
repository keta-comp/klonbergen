import { chromium } from "playwright";

const BASE = "http://localhost:8085";
const FIXTURE = "scripts/fixtures/sample.mp3";
const log = (...a) => console.log(...a);

const browser = await chromium.launch();

async function runOnce(iter) {
  const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));
  await page.addInitScript(() => { window.__loadCount = (window.__loadCount || 0) + 1; });

  const stepIndicator = () => page.locator(".inv-header-back").last().textContent().then(t => (t||"").trim());
  const onCouple = () => page.locator("#bride").isVisible().catch(() => false);
  const onMessage = () => page.locator("#welcome").isVisible().catch(() => false);

  await page.goto(BASE + "/taklifnoma/yangi", { waitUntil: "networkidle" });
  await page.waitForSelector("#bride", { timeout: 10000 });

  await page.fill("#bride", "Aygúl");
  await page.fill("#groom", "Marat");
  await page.getByRole("button", { name: "Davom etish" }).click();
  await page.waitForSelector("#wedding-date", { timeout: 5000 });
  await page.fill("#wedding-date", "2026-09-12");
  await page.fill("#wedding-time", "18:00");
  await page.getByRole("button", { name: "Davom etish" }).click();
  await page.waitForSelector("#venue", { timeout: 5000 });
  await page.fill("#venue", "Alakoz Saray");
  await page.getByRole("button", { name: "Davom etish" }).click();
  await page.waitForSelector("#welcome", { timeout: 5000 });

  const before = await stepIndicator();
  // Mirror the real user action: click the "Musiqa yuklash" button, then feed a file.
  await page.getByRole("button", { name: "Musiqa yuklash" }).click().catch(() => {});
  const fileInput = page.locator('input[type="file"][accept="audio/*"]');
  await fileInput.setInputFiles(FIXTURE);
  await page.waitForTimeout(1000);

  const after = await stepIndicator();
  const couple = await onCouple();
  const msg = await onMessage();
  const loads = await page.evaluate(() => window.__loadCount);
  const chip = await page.locator(".inv-music-chip").isVisible().catch(() => false);

  log(`ITER ${iter}: before=${before} after=${after} | onCouple=${couple} onMessage=${msg} | loadCount=${loads} chip=${chip} | errors=${consoleErrors.length?consoleErrors:'(none)'}`);
  const reset = couple && !msg;
  await page.close();
  return reset;
}

let anyReset = false;
for (let i = 1; i <= 3; i++) {
  anyReset = (await runOnce(i)) || anyReset;
}
log("=== BUG (reset to step 1 on music upload) reproduced in any iteration:", anyReset, "===");
await browser.close();
process.exit(anyReset ? 2 : 0);
