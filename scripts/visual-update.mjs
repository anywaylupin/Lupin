import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * Regenerates the Linux screenshot baselines inside the Playwright image matching the installed version, so they match CI.
 * node_modules gets its own volume so the container never replaces the host's native binaries.
 */
const { version } = JSON.parse(readFileSync("node_modules/@playwright/test/package.json", "utf8"));
const image = `mcr.microsoft.com/playwright:v${version}-noble`;
const run = "corepack enable && pnpm install --frozen-lockfile && pnpm test:e2e visual --update-snapshots";
const args = [
  "run",
  "--rm",
  "--ipc=host",
  "-v",
  `${process.cwd()}:/work`,
  "-v",
  "/work/node_modules",
  "-w",
  "/work",
  "-e",
  "CI=",
  image,
  "sh",
  "-c",
  run,
];
process.exit(spawnSync("docker", args, { stdio: "inherit" }).status ?? 1);
