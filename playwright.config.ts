import { defineConfig } from "@playwright/test";

/**
 * Phone and desktop sizes match the two the prototype is compared at.
 * Screenshot baselines come from Linux in CI because fonts and canvas antialiasing differ per OS.
 * Tests run against a production preview on its own port so a dev server on 4321 is never reused by mistake.
 */
export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  use: { baseURL: "http://localhost:4329" },
  projects: [
    { name: "phone", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "pnpm build && pnpm preview --port 4329",
    url: "http://localhost:4329",
    reuseExistingServer: !process.env["CI"],
  },
});
