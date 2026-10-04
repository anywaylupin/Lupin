import { test, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const prototype = pathToFileURL(resolve("reference/hive.html")).href;
const dir = ".compare";

type Size = { width: number; height: number };

interface Scenario {
  name: string;
  path: string;
  hash: string;
  run?: (page: Page, vp: Size) => Promise<void>;
  settle?: number;
}

async function drag(page: Page, from: [number, number], to: [number, number]) {
  await page.mouse.move(...from);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(from[0] + ((to[0] - from[0]) * i) / 12, from[1] + ((to[1] - from[1]) * i) / 12);
  }
  await page.mouse.up();
}

/** Same steps on both builds; deep links use routes on the port and hashes on the prototype. */
const scenarios: Scenario[] = [
  { name: "home", path: "/", hash: "" },
  {
    name: "drag",
    path: "/",
    hash: "",
    run: (page, vp) => (vp.width > 600 ? drag(page, [915, 200], [1130, 560]) : drag(page, [250, 125], [255, 470])),
  },
  { name: "section", path: "/projects/", hash: "#projects" },
  { name: "leaf", path: "/projects/juka/", hash: "#projects.juka" },
  { name: "page", path: "/hours/", hash: "#hours" },
  { name: "settings", path: "/", hash: "", run: (page) => page.locator("#settings-btn").click() },
  {
    name: "egg",
    path: "/",
    hash: "",
    run: (page, vp) => (vp.width > 600 ? drag(page, [772, 450], [560, 880]) : drag(page, [351, 307], [60, 560])),
  },
  {
    name: "reset",
    path: "/",
    hash: "",
    settle: 120,
    run: async (page, vp) => {
      await (vp.width > 600 ? drag(page, [915, 200], [600, 870]) : drag(page, [250, 125], [60, 560]));
      await page.locator("#settings-btn").click();
      await page.waitForTimeout(500);
      await page.locator("#reset").click();
      await page.waitForTimeout(260);
    },
  },
];

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

for (const s of scenarios) {
  test(`port vs prototype: ${s.name}`, async ({ page }, info) => {
    await mkdir(dir, { recursive: true });
    const vp = page.viewportSize() ?? { width: 0, height: 0 };
    const shots: string[] = [];
    for (const [name, url] of [
      ["port", s.path],
      ["prototype", `${prototype}${s.hash}`],
    ] as const) {
      await page.goto(url);
      await page.waitForTimeout(1200);
      await s.run?.(page, vp);
      await page.waitForTimeout(s.settle ?? 900);
      const path = `${dir}/${info.project.name}-${s.name}-${name}.png`;
      await page.screenshot({ path });
      shots.push((await readFile(path)).toString("base64"));
    }
    await page.setViewportSize({ width: vp.width * 2 + 8, height: vp.height });
    await page.setContent(
      `<body style="margin:0;display:flex;gap:8px;background:#f0f">${shots.map((b) => `<img src="data:image/png;base64,${b}">`).join("")}</body>`,
    );
    await page.screenshot({ path: `${dir}/${info.project.name}-${s.name}-side.png` });
  });
}
