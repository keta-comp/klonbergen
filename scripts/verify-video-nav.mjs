import { chromium } from "playwright";
const BASE = "http://localhost:8085";
const browser = await chromium.launch();

async function dismissEnvelope(page) {
  // OpeningExperience gate is active under default motion; click to open
  const btn = page.locator('[aria-label*="ashıw"], [role="button"][tabindex="0"]').first();
  if (await btn.count()) {
    try { await btn.click({ timeout: 4000 }); } catch {}
  }
  await page.waitForTimeout(700);
}

// 1) Desktop nav scroll (dismiss envelope first) — read in ONE evaluate after settle
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await dismissEnvelope(page);
  await page.waitForSelector(".premium-nav-link", { timeout: 8000 });
  const navLinks = page.locator(".premium-nav-link");
  const n = await navLinks.count();
  for (let i = 0; i < n; i++) {
    const t = (await navLinks.nth(i).innerText()).toLowerCase();
    if (t.includes("bahalar")) { await navLinks.nth(i).click(); break; }
  }
  await page.waitForTimeout(1600);
  const res = await page.evaluate(() => {
    const el = document.getElementById("bahalar");
    const top = el ? Math.round(el.getBoundingClientRect().top) : null;
    return { y: Math.round(window.scrollY), bahalarTop: top };
  });
  const ok = res.bahalarTop !== null && Math.abs(res.bahalarTop) < 6;
  console.log(`DESKTOP nav Bahalar -> scrollY=${res.y} #bahalar top=${res.bahalarTop} => ${ok ? "OK (section at top)" : "CHECK"}`);
  await ctx.close();
}

// 2) Hero video autoplay under DEFAULT motion (real visitors) — after dismissing envelope
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await dismissEnvelope(page);
  await page.waitForSelector("video", { timeout: 8000 });
  const t0 = await page.evaluate(() => { const v = document.querySelector(".hero video, video"); return v ? v.currentTime : -1; });
  await page.waitForTimeout(2500);
  const v = await page.evaluate(() => {
    const vid = document.querySelector(".hero video") || document.querySelector("video");
    return vid ? { paused: vid.paused, ct: vid.currentTime, ready: vid.readyState, w: vid.videoWidth, h: vid.videoHeight, src: (vid.currentSrc || vid.src || "").split("/").pop() } : null;
  });
  const playing = v && !v.paused && v.ct > t0 + 0.1;
  console.log(`HERO video (default motion): src=${v?.src} paused=${v?.paused} currentTime=${v?.ct} (was ${t0}) ready=${v?.ready} dims=${v?.w}x${v?.h} => ${playing ? "PLAYING OK" : "CHECK (paused/static)"}`);
  await ctx.close();
}

await browser.close();
console.log("done");
