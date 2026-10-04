import { expect, test, type Page } from "@playwright/test";

/**
 * Screenshot regressions for the canvas, which unit tests cannot see.
 * Reduced motion freezes the city clock, traffic, weather, glitch and decrypt, and a seeded Math.random fixes the spares, so frames repeat exactly.
 * Baselines are Linux only, since fonts and canvas antialiasing differ per OS; refresh them with:
 *
 *     pnpm test:visual:update
 */
test.skip(process.platform !== "linux", "visual baselines are generated on Linux");
test.use({ reducedMotion: "reduce" });

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

async function settle(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("html")).toHaveClass(/hive/);
  await expect(page.locator("#city canvas")).toHaveCount(11);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
}

for (const [name, path] of [
  ["home", "/"],
  ["section", "/projects/"],
  ["leaf", "/projects/juka/"],
  ["page", "/hours/"],
] as const) {
  test(`hive ${name}`, async ({ page }) => {
    await settle(page, path);
    await expect(page).toHaveScreenshot(`${name}.png`, { maxDiffPixelRatio: 0.01 });
  });
}

test("settings panel", async ({ page }) => {
  await settle(page, "/");
  await page.getByRole("button", { name: "Effects and sound" }).click();
  await expect(page.locator("#settings")).toHaveClass(/open/);
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot("settings.png", { maxDiffPixelRatio: 0.01 });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("fallback page", async ({ page }) => {
    await page.goto("/projects/juka/");
    await expect(page).toHaveScreenshot("fallback.png", { fullPage: true, maxDiffPixelRatio: 0.01 });
  });
});
