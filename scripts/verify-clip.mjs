import { chromium } from "playwright";

const BASE = "http://localhost:8085";
const browser = await chromium.launch();

async function clip(w) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: w >= 768 ? 1024 : 844 },
    reducedMotion: "reduce",
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector(".premium-nav", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}[style*="opacity"],[style*="transform"]{opacity:1!important;transform:none!important}`,
  });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(70); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const real = await page.evaluate(() => {
    const clips = [];
    const textTags = new Set(["H1","H2","H3","H4","P","A","BUTTON","SPAN","LI","DIV","LABEL","SMALL","STRONG","EM"]);
    for (const el of document.querySelectorAll("*")) {
      if (!textTags.has(el.tagName)) continue;
      const txt = (el.innerText || "").trim();
      if (txt.length < 3) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      // find nearest clipping ancestor
      let p = el.parentElement, clipper = null;
      while (p && p !== document.body) {
        const cs = getComputedStyle(p);
        if (["hidden","auto","scroll","clip"].includes(cs.overflowX)) {
          const pr = p.getBoundingClientRect();
          // element extends beyond ancestor's visible content box (incl padding)
          if (r.right > pr.right + 1 || r.left < pr.left - 1) {
            clipper = { tag: p.tagName.toLowerCase(), cls: (p.className && p.className.toString().slice(0,40)) || "", right: Math.round(pr.right), left: Math.round(pr.left) };
            break;
          }
        }
        p = p.parentElement;
      }
      if (clipper) clips.push({ tag: el.tagName.toLowerCase(), cls: (el.className && el.className.toString().slice(0,40)) || "", txt: txt.slice(0,30), clipper });
    }
    return clips.slice(0, 25);
  });

  console.log(`\n[${w}px] real clipping hits=${real.length}`);
  for (const c of real) console.log(`  <${c.tag} class="${c.cls}"> "${c.txt}"  clipped by <${c.clipper.tag} class="${c.clipper.cls}">`);
  await page.close();
  await ctx.close();
}

await clip(375);
await clip(768);
await clip(1440);
await browser.close();
console.log("\nclip audit done");
