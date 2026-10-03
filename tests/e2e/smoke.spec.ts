import { expect, test } from "@playwright/test";

test("home boots the hive with no console errors or warnings", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") problems.push(msg.text());
  });
  page.on("pageerror", (err) => problems.push(err.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/hive/);
  await expect(page.locator("#hive")).toBeVisible();
  await page.waitForTimeout(500);
  expect(problems).toEqual([]);
});
