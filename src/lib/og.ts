import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { svgIcon, type IconName } from "../hive/icons";

export interface OgCard {
  title: string;
  summary: string;
  icon: IconName;
  tags: string[];
  cmd: string;
}

const require = createRequire(import.meta.url);

async function font(weight: 400 | 700): Promise<string> {
  const file = require.resolve(`@fontsource/cascadia-code/files/cascadia-code-latin-${weight}-normal.woff2`);
  return (await readFile(file)).toString("base64");
}

function esc(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** A 1200 by 630 card in the hive's palette: the content hex on the left, the shell prompt, title, summary and tags on the right. */
async function cardHtml(c: OgCard): Promise<string> {
  const [regular, bold] = await Promise.all([font(400), font(700)]);
  const hex = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:C;font-weight:400;src:url(data:font/woff2;base64,${regular}) format("woff2")}
@font-face{font-family:C;font-weight:700;src:url(data:font/woff2;base64,${bold}) format("woff2")}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#05040b;color:#d9d2ee;font-family:C,monospace;display:flex;align-items:center;gap:64px;padding:0 80px;overflow:hidden;position:relative}
.bg{position:absolute;inset:0;background:repeating-linear-gradient(60deg,transparent 0 46px,#141030 46px 48px),repeating-linear-gradient(-60deg,transparent 0 46px,#141030 46px 48px);opacity:.5}
.hex{position:relative;flex:none;width:300px;height:346px;clip-path:${hex};background:#d9479f;display:grid;place-items:center}
.hex::before{content:"";position:absolute;inset:3px;clip-path:${hex};background:#1a0f36}
.hex svg{position:relative;width:120px;height:120px;fill:none;stroke:#5cc4dc;stroke-width:1.6;stroke-linecap:square}
.text{position:relative;display:flex;flex-direction:column;gap:20px}
.cmd{font-size:24px;color:#857ea3}.cmd b{color:#d9479f;margin-right:14px}
h1{margin:0;font-size:68px;line-height:1.1}p{margin:0;font-size:30px;line-height:1.45;color:#bfb7dc;max-width:700px}
ul{display:flex;gap:18px;margin:0;padding:0;list-style:none;font-size:24px;color:#5cc4dc}li::before{content:"[";color:#857ea3}li::after{content:"]";color:#857ea3}
</style></head><body><div class="bg"></div><div class="hex">${svgIcon(c.icon)}</div><div class="text">
<div class="cmd"><b>❯</b>${esc(c.cmd)}</div><h1>${esc(c.title)}</h1><p>${esc(c.summary)}</p>
<ul>${c.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div></body></html>`;
}

/**
 * Renders an OG card to PNG with the Playwright Chromium the tests already use, so no image library joins the dependencies.
 * A browser is launched per card; there are only a handful, and a shared one would keep the build process alive.
 */
export async function renderOg(c: OgCard): Promise<Uint8Array<ArrayBuffer>> {
  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    throw new Error(
      "OG images need Chromium at build time; run `pnpm exec playwright install --only-shell chromium` first.",
      {
        cause: err,
      },
    );
  }
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(await cardHtml(c), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    return new Uint8Array(await page.screenshot({ type: "png" }));
  } finally {
    await browser.close();
  }
}
