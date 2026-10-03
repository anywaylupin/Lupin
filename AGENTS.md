# Agent guide

Personal portfolio built as a breached hex hive over a living city.
The site is the work sample, so code quality matters as much as the visuals.
`reference/hive.html` is the original prototype and the source of truth for look, feel and timing; do not redesign, port.

## Commands

```bash
pnpm dev            # local dev server on http://localhost:4321
pnpm build          # static build into dist/, including OG images
pnpm check          # astro check: types in .ts and .astro files
pnpm lint           # ESLint
pnpm format         # Prettier, the only thing allowed to format code
pnpm test           # Vitest unit tests
pnpm test:e2e       # Playwright at 390x844 and 1440x900
COMPARE=1 pnpm test:e2e compare   # port and prototype screenshots side by side
```

Run `pnpm format`, `pnpm lint`, `pnpm check` and `pnpm test` before every commit.

## Layout

```
astro.config.ts         site config, fonts API (Cascadia Code from npm, Noto Sans SC glyph subset)
src/
  content.config.ts     collections and Zod schemas
  content/              Markdown content; adding a project is adding one file here
  site.ts               name, links, email and CV placeholders
  lib/                  build-time helpers (hive data, OG rendering)
  layouts/              page shell with the no-JS fallback and the hive chrome
  components/           Astro components
  pages/                one static page per route, plus og/ and sitemap endpoints
  hive/                 the interactive canvas, strict TypeScript, no framework
    *.ts pure           hex, hole, layout, camera, sheet, reset, prefs, route, theme, icons
    city/               baked layers (worker), dynamic details, weather, glitch
    overlay/            DOM over the canvas: proxies, leaf, tooltip, map, contacts, settings
    fx/                 decrypt, electric, audio
  styles/               tokens, base, overlay, settings, fallback
tests/unit              Vitest for pure modules
tests/e2e               Playwright flows, no-JS, accessibility and visual checks
```

Pure modules take plain data and return plain data: no DOM, no `performance.now()`, no `Math.random()` unless passed in.
Canvas and DOM code lives in `main.ts`, `render.ts`, `city/` and `overlay/`.

## Code conventions

- `const` by default, optional chaining, no `var`, ES modules only.
- `strict` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; no `any`.
- Small focused modules; a file over about 300 lines is a smell.
- No new dependencies without asking.

## Coding style

A project's own config (Prettier, ESLint, .editorconfig) wins over anything here when they conflict.

### Formatting

Formatting is owned by tools, never by hand.
Never hand align or hand wrap code.
Prettier formats through `pnpm format`; eslint-config-prettier keeps ESLint out of formatting.

### Comments

Only comment declarations: functions, constants, types, classes and components.
No comments floating inside a body, and none narrating the next statement.

Comments say why, not what.
Good comments record the option that was tried and removed, the number that was measured, or the bug an odd looking line prevents.
If a comment only restates the code, delete it.

- One sentence per line; never wrap a sentence across lines.
- Blank line between paragraphs.
- An indented line is a command or code sample: keep its indentation and put a blank line in front of it.

```ts
/**
 * Retries the fetch because the GitHub releases API returns 502 under load.
 * Three attempts covered every failure seen in a week of logs; five added nothing.
 *
 * Reproduce the failure with:
 *
 *     pnpm tsx scripts/hammer-releases.ts
 */
export async function fetchReleases(repo: string) {}
```

### JavaScript and TypeScript

- `replaceAll` over a global regex replace
- `.at(-1)` over `arr[arr.length - 1]`
- `slice` over `substr` and `substring`
- `startsWith` and `endsWith` over index checks
- `Number.parseInt` and `Number.parseFloat` over the globals
- `node:` prefixed imports for built-ins, such as `node:fs/promises`
- `flatMap` over `map` then `flat`
- `Object.fromEntries` over building objects in a loop
- `catch {}` with no binding when the error is unused
- `satisfies` over an `as` cast

### Prose and copy

Applies to docs, READMEs, commit messages, comments and UI copy.

- Sentence case for headings, buttons and labels.
- Active voice.
- Short hyphens only; never em or en dashes.
- No exclamation marks.

## Git

- Commit after each finished piece of work; never push unless asked.
