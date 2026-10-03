import { test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const prototype = pathToFileURL(resolve("reference/hive.html")).href;

/**
 * Writes port and prototype screenshots side by side for the per-phase review.
 * Math.random is replaced with a seeded generator so both builds place their loose hexes the same way.
 *
 *     COMPARE=1 pnpm test:e2e compare
 */
test.skip(!process.env["COMPARE"], "set COMPARE=1 to write comparison screenshots");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let a = 12345;
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
});

test("port vs prototype", async ({ page }, info) => {
  const dir = "test-results/compare";
  const shots: string[] = [];
  for (const [name, url] of [
    ["port", "/"],
    ["prototype", prototype],
  ] as const) {
    await page.goto(url);
    await page.waitForTimeout(1500);
    const path = `${dir}/${info.project.name}-${name}.png`;
    await page.screenshot({ path });
    shots.push((await readFile(path)).toString("base64"));
  }
  const { width, height } = page.viewportSize() ?? { width: 0, height: 0 };
  await page.setViewportSize({ width: width * 2 + 8, height });
  await page.setContent(
    `<body style="margin:0;display:flex;gap:8px;background:#f0f">${shots.map((s) => `<img src="data:image/png;base64,${s}">`).join("")}</body>`,
  );
  await page.screenshot({ path: `${dir}/${info.project.name}-side.png` });
});
