import { defineConfig } from "@playwright/test";

/**
 * Phone and desktop sizes match the two the prototype is compared at.
 * Screenshot baselines come from Linux in CI because fonts and canvas antialiasing differ per OS.
 */
export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  use: { baseURL: "http://localhost:4321" },
  projects: [
    { name: "phone", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "pnpm build && pnpm preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env["CI"],
  },
});
