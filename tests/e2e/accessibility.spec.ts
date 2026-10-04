import { expect, test, type Page } from "@playwright/test";

const routes = [
  ["/", /Your name/],
  ["/about/", /Senior frontend, moving into fullstack/],
  ["/projects/", /^Projects$/],
  ["/projects/juka/", /Juka/],
  ["/stack/", /^Stack$/],
  ["/experience/", /^Experience$/],
  ["/experience/interactive-developer/", /Interactive developer at SQREEM/],
  ["/now/", /Currently building/],
  ["/hours/", /Your morning is my afternoon/],
] as const;

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const [path, heading] of routes) {
    test(`${path} shows its content, navigation and contacts`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page.getByRole("navigation", { name: "Site" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Download CV" })).toBeVisible();
      await expect(page.locator("#hive")).toBeHidden();
    });
  }

  test("the project page links reach every project", async ({ page }) => {
    await page.goto("/projects/");
    for (const name of ["Upstream", "Juka 橘卡", "Ora", "QR pay"])
      await expect(page.getByRole("link", { name })).toBeVisible();
  });

  test("the 404 page points home", async ({ page }) => {
    const res = await page.goto("/nowhere/");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("link", { name: "Go back to the start" })).toBeVisible();
  });
});

async function ready(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator("html")).toHaveClass(/hive/);
}

test("every page sets Open Graph tags and a canonical URL", async ({ page }) => {
  await page.goto("/projects/upstream/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\/upstream\.png$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/projects\/upstream\/$/);
  const og = await page.request.get("/og/upstream.png");
  expect(og.headers()["content-type"]).toContain("image/png");
});

test("keyboard: Tab reaches the cells, Enter opens and Escape returns focus", async ({ page }) => {
  await ready(page);
  const projects = page.locator("#cells").getByRole("link", { name: /^projects/ });
  for (let i = 0; i < 10 && !(await projects.evaluate((el) => el === document.activeElement)); i++)
    await page.keyboard.press("Tab");
  await expect(projects).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator("#cells").getByRole("link", { name: "Back" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
  await expect(projects).toBeFocused();
});

test("a focused cell grows its electric border like a hovered one", async ({ page }) => {
  await ready(page);
  const now = page.locator("#cells").getByRole("link", { name: /^now/ });
  await now.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(now).toHaveClass(/hot/);
});

test("an open leaf takes focus and makes the cells behind it inert", async ({ page }) => {
  await ready(page);
  await page
    .locator("#cells")
    .getByRole("link", { name: /^hours/ })
    .click();
  await expect(page.locator("#leaf-inner")).toBeFocused();
  await expect(page.locator("#cells")).toHaveJSProperty("inert", true);
  await page.locator("#leaf-back").click();
  await expect(page.locator("#cells")).toHaveJSProperty("inert", false);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("turns off glitch and decrypt and fades between sections", async ({ page }) => {
    await ready(page);
    await expect(page.locator("body")).not.toHaveClass(/glitchy/);
    await page
      .locator("#cells")
      .getByRole("link", { name: /^projects/ })
      .click();
    await expect(page.locator("#veil")).toHaveCSS("pointer-events", "auto");
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(page.locator("#veil")).toHaveCSS("pointer-events", "none");
    await expect(page.locator("#veil")).toHaveCSS("opacity", "0");
    await expect(page.locator("#path")).toHaveText("❯ ~/projects");
    await expect(page.locator("[aria-busy]")).toHaveCount(0);
  });
});
