import fs from "fs";
import { chromium } from "playwright";

const css = fs.readFileSync("src/index.css", "utf8");

const NAV = `
<header style="position:fixed;top:0;left:0;right:0;height:72px;background:rgba(247,242,232,0.9);border-bottom:1px solid rgba(27,25,22,0.08);z-index:50;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(1.25rem,5vw,4rem);font-family:Inter,system-ui,sans-serif">
  <span style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:600;color:#1b1916;letter-spacing:0.02em">Vowly</span>
  <nav style="display:none;gap:2.25rem" class="lg-nav">
    <span style="font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;color:#6f685c">Nege Vowly?</span>
    <span style="font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;color:#6f685c">Múmkinshilikler</span>
    <span style="font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;color:#6f685c">Qalay isleydi?</span>
  </nav>
  <span style="background:#cfa43a;color:#1b1408;padding:0.5rem 1.25rem;border-radius:999px;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase">Demo soraw</span>
</header>`;

const HERO = `
<section class="hero">
  <video class="hero-video" autoplay muted loop playsinline preload="auto" src="file:///C:/Users/2026/Desktop/toyxana-dream-hub-main/public/hero.mp4"></video>
  <div class="hero-scrim"></div>
  <div class="hero-content">
    <p class="hero-eyebrow">SANLI MIRÁTNAMA</p>
    <h1 class="hero-title">Ómirińizdegi<br><span class="hero-title-accent">eń ullı kúnińiz</span></h1>
    <p class="hero-sub">Atlarıńız hám sáne — qalǵanın Vowly isleydi.</p>
    <div class="hero-cta">
      <button class="vow-btn vow-btn-gold">Tegin mirátnama jaratıw →</button>
      <button class="hero-cta-subtle">Demo soraw</button>
    </div>
  </div>
  <div class="scroll-cue" aria-hidden="true"><span>Tómenge</span><i></i></div>
</section>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0">${NAV}${HERO}</body></html>`;

const SIZES = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "390x844", width: 390, height: 844 },
];

const OUT = "C:/Users/2026/Desktop/toyxana-dream-hub-main/.hero-shots";
fs.mkdirSync(OUT, { recursive: true });

const PREVIEW = "C:/Users/2026/Desktop/toyxana-dream-hub-main/.hero-preview.html";
fs.writeFileSync(PREVIEW, html);

const browser = await chromium.launch();
let allPass = true;

for (const s of SIZES) {
  const context = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("file:///" + PREVIEW, { waitUntil: "load", timeout: 30000 }).catch((e) => errors.push("goto: " + e.message));
  await page.waitForTimeout(1800);
  await page.evaluate(() => { const v = document.querySelector("video"); if (v) { v.muted = true; v.play?.().catch(() => {}); } });
  await page.waitForTimeout(400);

  // emulate the lg-nav visibility at >=1024 widths
  await page.addStyleTag({ content: `@media (min-width:1024px){ .lg-nav{display:flex !important} }` });

  const data = await page.evaluate(() => {
    const q = (sel) => document.querySelector(sel);
    const r = (el) => {
      const b = el ? el.getBoundingClientRect() : null;
      return b ? { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), h: Math.round(b.height) } : null;
    };
    const hero = q(".hero");
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    return {
      vw, vh,
      horizOverflow: document.documentElement.scrollWidth > vw + 1,
      heroFits: hero ? Math.abs(hero.getBoundingClientRect().height - vh) <= 2 : false,
      nav: r(q("header")),
      eyebrow: r(q(".hero-eyebrow")),
      title: r(q(".hero-title")),
      sub: r(q(".hero-sub")),
      cta: r(q(".hero-cta")),
    };
  });

  const checks = [];
  const navH = data.nav?.h ?? 0;
  checks.push(["hero height == 100svh", data.heroFits]);
  checks.push(["no horizontal overflow", !data.horizOverflow]);
  checks.push(["eyebrow sits below nav", (data.eyebrow?.top ?? 9999) >= navH - 1]);
  checks.push(["CTA fully inside viewport", (data.cta?.bottom ?? 0) <= data.vh + 1 && (data.cta?.top ?? 0) >= 0]);
  if (data.eyebrow && data.title && data.sub && data.cta) {
    checks.push(["stack order eyebrow<title<sub<cta", data.eyebrow.top < data.title.top && data.title.top < data.sub.top && data.sub.top < data.cta.top]);
  }
  const pass = checks.every((c) => c[1]) && errors.length === 0;
  if (!pass) allPass = false;

  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  console.log(`\n[${s.name}] ${pass ? "PASS" : "FAIL"}`);
  console.log(JSON.stringify(data));
  for (const [n, ok] of checks) console.log(`  ${ok ? "OK " : "XX "} ${n}`);
  if (errors.length) console.log("  ERRORS:", errors.slice(0, 5));
  await context.close();
}

await browser.close();
console.log("\nALL_PASS:", allPass);
