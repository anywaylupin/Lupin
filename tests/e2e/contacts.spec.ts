import { expect, test } from "@playwright/test";

test("the email never appears in the served HTML but is assembled for the copy button", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  expect(html).not.toContain("you@example.com");
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/hive/);
  await expect(page.getByRole("button", { name: "Copy email address you@example.com" })).toBeVisible();
});

test("copying the email confirms in the tooltip", async ({ page, context }, info) => {
  test.skip(info.project.name === "phone", "clipboard permission is desktop only here");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: /^Copy email address/ }).click();
  await expect(page.locator("#tip")).toHaveText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("you@example.com");
});

test("the CV downloads as a PDF", async ({ page, request }) => {
  await page.goto("/");
  const cv = page.getByRole("link", { name: "Download CV as PDF" });
  await expect(cv).toHaveAttribute("download", "");
  const res = await request.get((await cv.getAttribute("href")) ?? "");
  expect(res.ok()).toBe(true);
  expect((await res.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

test("the map lights the open section", async ({ page }) => {
  await page.goto("/projects/");
  await expect(page.locator("#map .hex.lit")).toHaveCount(1);
  await expect(page.locator("#map .kids.show")).toHaveCount(1);
});
