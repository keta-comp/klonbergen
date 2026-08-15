import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const logs = [];
page.on("pageerror", (e) => logs.push("PAGEERROR: " + e.message));
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));

await page.goto("http://localhost:8080/", { waitUntil: "load", timeout: 60000 }).catch((e) => logs.push("GOTO: " + e.message));
await page.waitForTimeout(3500);

const info = await page.evaluate(() => ({
  url: location.href,
  hasHero: !!document.querySelector(".hero"),
  hasErrorOverlay: !!document.querySelector("vite-error-overlay, .vite-error-overlay, #vite-watcher-error"),
  bodyText: document.body.innerText.slice(0, 200),
  rootChildren: document.getElementById("root")?.childElementCount ?? -1,
  htmlLen: document.documentElement.outerHTML.length,
}));

console.log("URL:", info.url);
console.log("hasHero:", info.hasHero, "| errorOverlay:", info.hasErrorOverlay, "| rootChildren:", info.rootChildren, "| htmlLen:", info.htmlLen);
console.log("BODY TEXT:", JSON.stringify(info.bodyText));
console.log("LOGS:\n" + logs.slice(0, 25).join("\n"));
await browser.close();
