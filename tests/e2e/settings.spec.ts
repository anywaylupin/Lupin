import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/hive/);
});

test("the panel opens from the hex, moves focus in and Escape folds it back", async ({ page }) => {
  const button = page.getByRole("button", { name: "Effects and sound" });
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#settings")).toHaveClass(/open/);
  await expect(page.getByRole("button", { name: "Close settings" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
  await expect(page.locator("#menu")).toBeHidden();
});

test("switches persist across reloads and sound starts off", async ({ page }) => {
  await page.getByRole("button", { name: "Effects and sound" }).click();
  const sound = page.getByRole("switch", { name: "Brown noise" });
  const glitch = page.getByRole("switch", { name: "Glitch" });
  await expect(sound).toHaveAttribute("aria-checked", "false");
  await expect(glitch).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("body")).toHaveClass(/glitchy/);
  await glitch.click();
  await expect(glitch).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("body")).not.toHaveClass(/glitchy/);
  await page.reload();
  await page.getByRole("button", { name: "Effects and sound" }).click();
  await expect(page.getByRole("switch", { name: "Glitch" })).toHaveAttribute("aria-checked", "false");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("breached-hive-prefs") ?? "{}"));
  expect(stored).toMatchObject({ v: 1, glitch: false, sound: false });
});

test("a broken stored value falls back to defaults without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.evaluate(() => localStorage.setItem("breached-hive-prefs", "{not json"));
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/hive/);
  await page.getByRole("button", { name: "Effects and sound" }).click();
  await expect(page.getByRole("switch", { name: "Glitch" })).toHaveAttribute("aria-checked", "true");
  expect(errors).toEqual([]);
});

test("the tooltip names the settings hex on hover", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "hover tooltips are pointer only");
  await page.getByRole("button", { name: "Effects and sound" }).hover();
  await expect(page.locator("#tip")).toBeVisible();
  await expect(page.locator("#tip")).toHaveText("Effects and sound");
});

test("Reset closes the panel and returns focus to the hex", async ({ page }) => {
  await page.getByRole("button", { name: "Effects and sound" }).click();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#settings")).not.toHaveClass(/open/);
  await expect(page.getByRole("button", { name: "Effects and sound" })).toBeFocused();
});
