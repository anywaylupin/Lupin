import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://example.com",
  output: "static",
  trailingSlash: "always",
  image: { service: { entrypoint: "astro/assets/services/noop" } },
});
