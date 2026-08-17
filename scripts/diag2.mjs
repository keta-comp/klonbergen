import { chromium } from '@playwright/test';

const URL = process.env.URL || 'http://localhost:4173/ru';
const widths = process.env.WIDTHS ? process.env.WIDTHS.split(',').map(Number) : [768, 1280];

const browser = await chromium.launch();
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  try {
    await page.goto(URL, { waitUntil: 'networkidle' });
  } catch (e) {
    console.log(`\n=== WIDTH ${w} === could not load ${URL}: ${e.message}`);
    await page.close();
    continue;
  }
  await page.waitForTimeout(600);
  const data = await page.evaluate((vw) => {
    const tol = 1;
    const out = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + tol) {
        let p = el.parentElement; let clip = null; let clipKind = null;
        while (p) {
          const o = getComputedStyle(p);
          const ox = o.overflowX;
          if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip' || o.overflow === 'auto' || o.overflow === 'scroll' || o.overflow === 'hidden' || o.overflow === 'clip') {
            clip = p; clipKind = o.overflowX + '/' + o.overflow; break;
          }
          p = p.parentElement;
        }
        const cls = (typeof el.className === 'string') ? el.className : (el.className && el.className.baseVal !== undefined ? el.className.baseVal : '');
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: cls.slice(0, 70),
          id: el.id,
          left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
          clip: clip ? (clip.tagName.toLowerCase() + '.' + ((typeof clip.className === 'string' ? clip.className : '').slice(0, 50)) + '[' + clipKind + ']') : 'NONE(visible)'
        });
      }
    }
    out.sort((a, b) => b.right - a.right);
    return { scrollX: window.scrollX, innerW: window.innerWidth, docW: document.documentElement.scrollWidth, count: out.length, items: out };
  }, w);
  console.log(`\n=== WIDTH ${w} === scrollX=${data.scrollX} innerW=${data.innerW} docW=${data.docW} overWide=${data.count}`);
  for (const it of data.items.slice(0, 25)) {
    console.log(`  ${it.tag}#${it.id} .${it.cls}  L=${it.left} R=${it.right} W=${it.width}  clipAncestor=${it.clip}`);
  }
  await page.close();
}
await browser.close();
