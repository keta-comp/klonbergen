import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5179";
const results = [];
const check = (name, cond, detail = "") =>
  results.push({ name, pass: !!cond, detail: String(detail).slice(0, 220) });

// Neutralise the pre-existing full-screen "opening.mp4" intro splash so the
// gallery can actually receive hover (test-only; app unchanged).
async function dismissSplash(page) {
  await page.evaluate(() => {
    const v = [...document.querySelectorAll("video")].find((x) =>
      (x.currentSrc || x.getAttribute("src") || "").includes("opening")
    );
    if (!v) return;
    const wrap = v.parentElement; // splash wrapper DIV directly containing the video
    if (wrap) wrap.style.display = "none";
  });
}

const browser = await chromium.launch();

/* ---------------- Desktop ---------------- */
try {
  const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageD = await ctxD.newPage();
  const errors = [];
  pageD.on("pageerror", (e) => errors.push(e.message));

  await pageD.goto(BASE + "/en", { waitUntil: "networkidle" });
  await pageD.waitForSelector(".gallery-editorial", { timeout: 10000 });
  await pageD.evaluate(() =>
    document.querySelector(".gallery-editorial").scrollIntoView({ block: "center" })
  );
  await pageD.waitForTimeout(1800);

  const tiles = await pageD.$$eval(".gallery-editorial .gallery-tile", (els) =>
    els.map((el) => {
      const img = el.querySelector("img");
      const cap = el.querySelector(".gallery-tile-cap");
      const r = el.getBoundingClientRect();
      return {
        cls: el.className,
        src: img ? img.getAttribute("src") : null,
        nw: img ? img.naturalWidth : 0,
        nh: img ? img.naturalHeight : 0,
        w: Math.round(r.width),
        h: Math.round(r.height),
        cap: cap ? cap.textContent.trim() : null,
        loading: img ? img.getAttribute("loading") : null,
      };
    })
  );

  check("5 tiles rendered", tiles.length === 5, "got " + tiles.length);
  check(
    "all local /gallery-N.jpg",
    tiles.every((t) => t.src && /^\/gallery-[1-5]\.jpg$/.test(t.src)),
    JSON.stringify(tiles.map((t) => t.src))
  );
  check(
    "all images decoded (naturalWidth>0)",
    tiles.every((t) => t.nw > 0 && t.nh > 0),
    JSON.stringify(tiles.map((t) => [t.nw, t.nh]))
  );
  const hero = tiles.find((t) => t.cls.includes("--hero"));
  const det = tiles.find((t) => t.cls.includes("--details"));
  check("hero dominant (taller than details tile)", hero && det && hero.h > det.h * 1.5,
    `hero.h=${hero?.h} det.h=${det?.h}`);
  check("captions present & non-empty", tiles.every((t) => t.cap && t.cap.length > 0),
    JSON.stringify(tiles.map((t) => t.cap)));
  check("hero image eager", hero?.loading === "eager", hero?.loading);
  check("other images lazy",
    tiles.filter((t) => !t.cls.includes("--hero")).every((t) => t.loading === "lazy"),
    JSON.stringify(tiles.filter((t) => !t.cls.includes("--hero")).map((t) => t.loading)));

  // Gallery-scoped horizontal-overflow check (the page also contains the
  // pre-existing timeline grid, which is out of scope for this redesign).
  const galOverflow = await pageD.evaluate(() => {
    const sec = document.querySelector(".gallery-editorial").closest("section");
    const r = sec.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), vw: window.innerWidth };
  });
  check("gallery section within viewport (no gallery h-overflow)",
    galOverflow.left >= -1 && galOverflow.right <= galOverflow.vw + 1, JSON.stringify(galOverflow));
  const galFit = await pageD.evaluate(() => {
    const g = document.querySelector(".gallery-editorial").getBoundingClientRect();
    return g.left >= -1 && g.right <= window.innerWidth + 1;
  });
  check("gallery grid fits viewport width", galFit, "");

  check("no console/page errors", errors.length === 0, errors.join(" | "));

  /* hover scale — isolate from the pre-existing splash overlay */
  try {
    await dismissSplash(pageD);
    const heroEl = await pageD.$(".gallery-tile--hero");
    const box = await heroEl.boundingBox();
    await pageD.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await pageD.waitForTimeout(600);
    const hoverT = await pageD.$eval(
      ".gallery-tile--hero img",
      (el) => getComputedStyle(el).transform
    );
    check("hover applies scale(1.03)",
      hoverT && hoverT !== "none" && hoverT !== "matrix(1, 0, 0, 1, 0, 0)", hoverT);
  } catch (e) {
    check("hover scale check", false, e.message.split("\n")[0]);
  }

  /* i18n captions */
  async function caps(locale) {
    await pageD.goto(BASE + "/" + locale, { waitUntil: "networkidle" });
    await pageD.waitForSelector(".gallery-editorial");
    await pageD.waitForTimeout(500);
    return pageD.$$eval(".gallery-tile-cap", (els) => els.map((e) => e.textContent.trim()));
  }
  const enCaps = await caps("en");
  const ruCaps = await caps("ru");
  const kaaCaps = await caps("kaa");
  const uzCaps = await caps("uz");
  check(
    "en captions correct",
    JSON.stringify(enCaps) ===
      JSON.stringify(["Bride & Groom", "The Details", "The Ceremony", "This Moment", "First Dance"]),
    JSON.stringify(enCaps)
  );
  check(
    "captions differ across locales",
    ruCaps[0] !== enCaps[0] && kaaCaps[0] !== enCaps[0] && uzCaps[0] !== enCaps[0],
    JSON.stringify({ en: enCaps[0], ru: ruCaps[0], kaa: kaaCaps[0], uz: uzCaps[0] })
  );
  await ctxD.close();
} catch (e) {
  check("desktop verification crashed", false, e.message.split("\n")[0]);
}

/* ---------------- Mobile ---------------- */
try {
  const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const pageM = await ctxM.newPage();
  await pageM.goto(BASE + "/en", { waitUntil: "networkidle" });
  await pageM.waitForSelector(".gallery-editorial");
  await pageM.evaluate(() =>
    document.querySelector(".gallery-editorial").scrollIntoView({ block: "center" })
  );
  await pageM.waitForTimeout(1500);
  await dismissSplash(pageM);
  const data = await pageM.evaluate(() => {
    const tiles = [...document.querySelectorAll(".gallery-editorial .gallery-tile")].map((el) => {
      const r = el.getBoundingClientRect();
      return { cls: el.className, w: Math.round(r.width), h: Math.round(r.height) };
    });
    const g = document.querySelector(".gallery-editorial").getBoundingClientRect();
    return { tiles, galW: Math.round(g.width), vw: window.innerWidth };
  });
  const tilesM = data.tiles;
  check("mobile 5 tiles", tilesM.length === 5, "got " + tilesM.length);
  const heroM = tilesM.find((t) => t.cls.includes("--hero"));
  check("mobile hero full content width", heroM && Math.abs(heroM.w - data.galW) < 3,
    `heroW=${heroM?.w} galW=${data.galW}`);
  const dM = tilesM.find((t) => t.cls.includes("--details"));
  const cM = tilesM.find((t) => t.cls.includes("--ceremony"));
  check("mobile details+ceremony side-by-side (equal width)",
    dM && cM && Math.abs(dM.w - cM.w) < 5 && dM.w < data.galW,
    JSON.stringify(tilesM.map((t) => t.w)));
  const hScrollM = await pageM.evaluate(() => {
    const x0 = window.scrollX; window.scrollTo(120, window.scrollY); const d = window.scrollX - x0; window.scrollTo(x0, window.scrollY); return d;
  });
  check("no actual horizontal scroll (mobile)", Math.abs(hScrollM) < 1, "delta=" + hScrollM);
  await ctxM.close();
} catch (e) {
  check("mobile verification crashed", false, e.message.split("\n")[0]);
}

/* ---------------- Reduced motion ---------------- */
try {
  const ctxR = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const pageR = await ctxR.newPage();
  await pageR.goto(BASE + "/en", { waitUntil: "networkidle" });
  await pageR.waitForSelector(".gallery-editorial");
  await pageR.evaluate(() =>
    document.querySelector(".gallery-editorial").scrollIntoView({ block: "center" })
  );
  await pageR.waitForTimeout(500);
  await dismissSplash(pageR);
  const rmEl = await pageR.$(".gallery-tile--hero");
  const rbox = await rmEl.boundingBox();
  await pageR.mouse.move(rbox.x + rbox.width / 2, rbox.y + rbox.height / 2);
  await pageR.waitForTimeout(400);
  const rmT = await pageR.$eval(
    ".gallery-tile--hero img",
    (el) => getComputedStyle(el).transform
  );
  check("reduced-motion disables hover scale",
    rmT === "none" || rmT === "matrix(1, 0, 0, 1, 0, 0)", rmT);
  await ctxR.close();
} catch (e) {
  check("reduced-motion verification crashed", false, e.message.split("\n")[0]);
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(JSON.stringify(results, null, 2));
console.log("\n" + (failed.length ? "FAILED: " + failed.length + " / " + results.length : "ALL PASSED (" + results.length + ")"));
process.exit(failed.length ? 1 : 0);
