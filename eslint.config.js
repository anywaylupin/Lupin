import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import astro from "eslint-plugin-astro";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/", ".astro/", "reference/", "test-results/", "playwright-report/"] },
  js.configs.recommended,
  tseslint.configs.strict,
  astro.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "no-var": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "prefer-const": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  { files: ["tests/**"], rules: { "@typescript-eslint/no-non-null-assertion": "off" } },
  prettier,
);
