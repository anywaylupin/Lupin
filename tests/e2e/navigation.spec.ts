import { expect, test, type Page } from "@playwright/test";

async function ready(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("html")).toHaveClass(/hive/);
}

const cell = (page: Page, name: string | RegExp) => page.locator("#cells").getByRole("link", { name });

test("opening a section pushes its URL and Back returns home", async ({ page }) => {
  await ready(page, "/");
  await cell(page, /^projects/).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page).toHaveTitle(/^Projects/);
  await expect(cell(page, /^Upstream/)).toBeVisible();
  await cell(page, "Back").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(cell(page, /^projects/)).toBeVisible();
});

test("a card leaf opens and the browser back button closes it", async ({ page }) => {
  await ready(page, "/");
  await cell(page, /^projects/).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await cell(page, /^Juka/).click();
  await expect(page).toHaveURL(/\/projects\/juka\/$/);
  await expect(page.locator("#leaf")).toBeVisible();
  await expect(page.locator("#leaf h2")).toContainText("Juka");
  await page.goBack();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator("#leaf")).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("deep links open straight into the leaf, and Back steps up without leaving the site", async ({ page }) => {
  await ready(page, "/projects/ora/");
  await expect(page.locator("#leaf")).toBeVisible();
  await expect(page.locator("#leaf h2")).toContainText("Ora");
  await page.locator("#leaf-back").click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator("#leaf")).toBeHidden();
  await cell(page, "Back").click();
  await expect(page).toHaveURL(/\/$/);
});

test("Escape closes a single page leaf", async ({ page }) => {
  await ready(page, "/");
  await cell(page, /^hours/).click();
  await expect(page).toHaveURL(/\/hours\/$/);
  await expect(page.locator("#leaf")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#leaf")).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});

test("the browser can jump from a card page straight home", async ({ page }) => {
  await ready(page, "/");
  await cell(page, /^experience/).click();
  await cell(page, /^Interactive dev/).click();
  await expect(page).toHaveURL(/\/experience\/interactive-developer\/$/);
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("#leaf")).toBeHidden();
  await expect(cell(page, /^experience/)).toBeVisible();
});
