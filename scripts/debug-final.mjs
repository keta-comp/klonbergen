// Debug final page rendering for the seeded slug.
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";

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

// find latest verify slug
const { data: rows } = await supabase.from("invitations").select("slug,bride_name,groom_name")
  .like("slug", "verify-azizbek-maftuna-%").order("created_at", { ascending: false }).limit(1).then(r => r);
const slug = rows?.[0]?.slug;
console.log("USING_SLUG", slug);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();

page.on("console", (msg) => console.log("PAGE_LOG", msg.type(), msg.text()));
page.on("pageerror", (err) => console.log("PAGE_ERROR", err.message));

await page.goto(`${BASE}/taklifnoma/${slug}`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);

const bodyText = await page.evaluate(() => document.body.innerText).catch(() => "(no body)");
console.log("BODY_TEXT_FIRST_400", bodyText.slice(0, 400));
console.log("URL", page.url());

await page.screenshot({ path: `${OUT}/debug-final.png`, fullPage: true });
console.log("captured debug-final");

await browser.close();
console.log("done");