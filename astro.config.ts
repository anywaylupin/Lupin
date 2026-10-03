import { defineConfig, fontProviders } from "astro/config";

/** Every glyph the city signs and the Juka title draw, so the CJK font ships as a few kilobytes instead of megabytes. */
const SIGN_GLYPHS = [..."夜市橘开放快递卡"];

export default defineConfig({
  site: "https://example.com",
  output: "static",
  trailingSlash: "always",
  image: { service: { entrypoint: "astro/assets/services/noop" } },
  fonts: [
    {
      provider: fontProviders.npm(),
      name: "Cascadia Code",
      cssVariable: "--font-mono",
      weights: [400, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "Menlo", "Consolas", "monospace"],
      options: { package: "@fontsource/cascadia-code" },
    },
    {
      provider: fontProviders.google(),
      name: "Noto Sans SC",
      cssVariable: "--font-zh",
      weights: [900],
      styles: ["normal"],
      fallbacks: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
      options: { experimental: { glyphs: SIGN_GLYPHS } },
    },
  ],
});
