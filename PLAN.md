# Plan: breached hive portfolio

Source of truth is `reference/hive.html` (1860 lines, read in full).
The port keeps every number, timing and draw call from it; this plan only says where each piece goes and what is new.

## Module split

The prototype is one script with shared globals.
The port replaces the globals with one `HiveState` object created in `main.ts` and passed to each module, so nothing reads module-level mutable state and every module can be tested with a hand-built state.

### Pure modules (no DOM, unit tested)

| File             | From the prototype                                                                                      | Notes                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hive/math.ts`   | `rng`, `hash2`, `ease`, `easeOut`, `clamp`, `lerp`                                                      | Seeded PRNG stays mulberry32                                                                                                                                                                     |
| `hive/hex.ts`    | `ax`, `axDist`, `toAxial`, `hexVerts`, `ring`, `inPoly`, `perimeter`, `lerpPts`, `visibleRange`, `DIRS` |                                                                                                                                                                                                  |
| `hive/hole.ts`   | gap cluster in `buildFront`                                                                             | Centre plus six neighbours plus three cells up and right, one more in landscape; anchor `[-1, 3]` portrait, `[3, 1]` landscape; skips content cells and anything within distance 2 of the origin |
| `hive/layout.ts` | `R` sizing, content slots, `home`, loose spawn, `rect`, `buildBack` ring placement                      | Takes `W`, `H` and a `rand` function, returns plain data                                                                                                                                         |
| `hive/camera.ts` | `camLerp`, `bounds`, `restOf`, `rubber`                                                                 |                                                                                                                                                                                                  |
| `hive/reset.ts`  | planning half of `resetSheet`                                                                           | Greedy nearest pair, delay `min(order * 45, 500)`, duration 520; spares go to the nearest original loose position; returns a plan, never touches the sheet                                       |
| `hive/prefs.ts`  | `PREF_KEY`, defaults, parse                                                                             | Versioned `{ v: 1, ... }`; unknown keys dropped, wrong types fall back per key, a pre-version blob from the prototype is migrated; storage read and write wrapped in try/catch                   |
| `hive/route.ts`  | `currentToken`, the hash parse at boot                                                                  | Maps `HiveRoute` to a path and back: `/`, `/projects/`, `/projects/juka/`, `/stack/`, `/experience/` and the home leaves (see open questions)                                                    |
| `hive/theme.ts`  | `C`, `PINK`, `BLUE`, `CYAN`, `AMBER`, `HEX`, `FLIP_MS`, `SEC_MS`, `ICON` paths                          |                                                                                                                                                                                                  |

### Stateful modules (DOM or canvas)

| File                       | Owns                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `hive/main.ts`             | Boot, `resize`, DPR watch, frame loop, visibility pause, reduced-motion switch                                                             |
| `hive/sheet.ts`            | Loose hexes, removed set, `isLocked`, `emptyGaps`, `magnetFor`, drag start and drop, shake, seat fx list, applying a reset plan            |
| `hive/render.ts`           | `drawFront`, `drawBack`, `drawMoving`, `charge`, `bolt`, `drawMagnet`, `drawSeat`, `flipCell`, the canvas focus ring                       |
| `hive/nav.ts`              | Section and leaf timers (`secAnim`, `cardFlip`, `leafOpen`, `phases`, `cardAlpha`, `movingHex`), busy flag, stepping toward a target route |
| `hive/input.ts`            | Pointer, wheel and key listeners; routes events to sheet, camera and nav                                                                   |
| `hive/city/layers.ts`      | Six baked layers, OffscreenCanvas in a worker where supported, main thread fallback                                                        |
| `hive/city/dynamic.ts`     | Windows, lanes, rails and pods, platforms, drones, car, signs, `placeCity` parallax                                                        |
| `hive/city/weather.ts`     | Rain, lightning, distant blast                                                                                                             |
| `hive/city/glitch.ts`      | Slice and block glitch timer                                                                                                               |
| `hive/overlay/sections.ts` | Proxy buttons for every hex, `placeOverlay` sizing and flip                                                                                |
| `hive/overlay/leaf.ts`     | Leaf page DOM and Back hex                                                                                                                 |
| `hive/overlay/tooltip.ts`  | `showTip`, glitch-in                                                                                                                       |
| `hive/overlay/map.ts`      | Minimap build and class updates                                                                                                            |
| `hive/overlay/contacts.ts` | Hex buttons with crackle edge, copy email, runtime email assembly                                                                          |
| `hive/overlay/settings.ts` | Morphing panel, switches, volume, Reset                                                                                                    |
| `hive/fx/decrypt.ts`       | Text decrypt, state kept in a `WeakMap` instead of `el._dec`                                                                               |
| `hive/fx/electric.ts`      | Shared crackle path for canvas and SVG                                                                                                     |
| `hive/fx/audio.ts`         | Brown noise, lowpass 1100 Hz, gain `volume * 0.35`, 0.5 s ramp                                                                             |

Every file should land under 300 lines; `render.ts` and `city/dynamic.ts` are the two at risk and split further if they cross it.

## Data flow

```
content collections (Markdown + Zod)
        |  build time
        v
Astro page  -->  semantic HTML in <main>  (no-JS, crawlers, OG)
        |
        +-->  <script type="application/json" id="hive-data">  (all hexes, a few KB)
                    |
                    v
main.ts  creates HiveState { sizes, cams, front sheet, backs, nav, prefs, pointer }
   |
   |  every frame
   +--> nav.tick        advances S and the flip, moves cameras
   +--> camera spring   eases the active camera back inside bounds
   +--> city.place      CSS 3D transforms from frontCam   (parallax)
   +--> city.update     redraws only the dynamic layers
   +--> render          front sheet, black-out, back sheet, moving hex
   +--> overlay.place   positions proxy buttons and the leaf over the canvas
   |
input.ts --> sheet (drag, magnet, drop)   --> map.update
         --> camera (pan, wheel zoom)
         --> nav (open, close)  --> route.toPath --> history.pushState
popstate  --> route.fromPath --> nav steps toward that route
settings  --> prefs.save --> applyPrefs (body class, audio level)
```

The sheet never knows about the city; the city only reads `frontCam`, the sheet home and the hole centre.
The overlay reads nav and camera state and writes nothing back except hover and focus keys.

## Routing and fallback

- Every route is a real static page built by Astro, sharing one layout that holds the canvas shell, the settings panel, contacts and the map.
- Each page renders its own content as semantic HTML in `<main>`, styled by `fallback.css` for no-JS readers.
- When the hive boots it reads `location.pathname`, opens straight into that state without animation (as the prototype does for hashes), and hides `<main>`; the proxy buttons and leaf DOM carry the content for assistive tech from then on.
- In-app navigation uses `pushState`, so there is no page load between hexes.
- `popstate` can jump several levels at once (leaf to home); nav closes the leaf, then the section, chaining the existing done callbacks.
- OG tags per page, OG image per project generated at build (see open questions).

## Additions beyond the prototype

- Focus: proxies already exist as DOM buttons; focusing one sets the same hover key the pointer does, so the electric border becomes the focus ring on canvas. Tab order follows the content order.
- Drag: treated as decorative, with the Reset button in settings as the keyboard path back; proxies stay usable at every point.
- Reduced motion: decrypt, glitch, magnet and parallax off; section and leaf transitions become a 200 ms opacity fade instead of the instant jump the prototype does today.
- Sound defaults to off (the prototype defaults it on) and starts only from the switch.
- Loop stops on `visibilitychange` hidden and resumes with a fresh timestamp.
- DPR watched with `matchMedia("(resolution: Xdppx)")`, rebound after each change; resize handlers removed nowhere because the page never unmounts, but the worker and audio context are created once.
- Email assembled from `data-` parts at runtime; the HTML shows it as `name [at] domain` for no-JS readers.

## Testing

- Vitest on every pure module: axial round trips, ring sizes, hole shape per orientation, reset matching (nearest pairing, stagger cap, spares home), prefs parsing of junk, old blobs and thrown storage, route round trips.
- Playwright at 390x844 and 1440x900: boot, open each section, open a leaf, Back and browser back, deep links, Escape, no-JS pages, no console errors.
- Visual comparisons stub `Math.random` with a fixed seed and freeze the clock through `page.clock`, for both the port and `reference/hive.html`, so the two can be diffed side by side.
- Screenshot baselines are generated on Linux in the Playwright Docker image, since fonts and canvas antialiasing differ on Windows.

## Prototype behaviours I am unsure about

1. **Resize resets the sheet.** `resize` rebuilds the front sheet with fresh random loose hexes and drops any open leaf. On phones the address bar showing or hiding fires resize, so a scroll gesture wipes your drags. I would keep sheet state when `R` and orientation are unchanged and only re-place the camera.
2. **Loose hex positions are random per load.** `buildFront` seeds from `Math.random`. Keeping that; tests pin the seed.
3. **No pinch zoom.** Zoom is wheel only and `touch-action: none` blocks browser zoom, so phones cannot zoom at all. Keeping as is unless you want pinch.
4. **Reduced motion today is instant, not a fade.** The prompt asks for fades; that is a small visual change.
5. **Section deep links skip the animation.** Same as the prototype hash boot.
6. **Hidden-tab audio** ramps to zero on `visibilitychange`; keeping it.

## Decisions

1. Home leaves get routes: `/about/`, `/now/`, `/hours/`, with copy in `src/content/home/*.md`.
2. Stack uses four groups: frontend (with phaser), backend, data and infra (cloudflare, d1, r2, aws), tooling (python and ad tech).
3. Experience shows one card per `experience/*.md` file; GMP folds into the interactive developer body.
4. Personal details are placeholders until supplied.
5. Juka shows as `Juka 橘卡`; 卡 joins the CJK subset.
6. `--muted` lifts to `#857ea3`.
7. All listed extra dependencies are approved.
8. Cloudflare Pages is connected by the owner; no deploy config in the repo.
9. Commit after each phase, never push.
10. Astro 7 instead of 5. Fonts go through the Astro fonts API: Cascadia Code from `@fontsource/cascadia-code` via the npm provider, Noto Sans SC via the Google provider with a glyph subset, both self-hosted at build. Content config lives in `src/content.config.ts` with glob loaders.
11. Experience cards with a Markdown body open a leaf at `/experience/<slug>/`, following the prototype rule that any card with a leaf flips; otherwise the folded GMP text would be unreachable in the hive.
12. Resize keeps loose and removed hexes when the hex size and orientation are unchanged, and re-applies the current route instead of closing it.

## Open questions (answered, kept for context)

1. **Home leaves and routes.** The page list has `index`, `projects/[slug]`, `stack`, `experience`, `404`. Should `about`, `now` and `hours` get `/about/`, `/now/`, `/hours/` pages too, with their copy in `src/content/home/*.md`? I also need `projects/index.astro` for the projects section itself.
2. **Stack grouping.** The prototype tags are frontend, backend, games, tooling, cloud, aws and ad tech. Your four groups are frontend, backend, data and infra, tooling. My mapping: phaser to frontend; cloudflare, d1, r2 and all aws items to data and infra; python to tooling; studio, cm360, dv360 and analytics to tooling. Is that right, or should ad tech stay its own group?
3. **Experience cards.** The prototype shows four cards (SQREEM, Oct 2022, Mar 2026, GMP). You listed two entries. Should the section show exactly one card per `experience/*.md` file, with GMP folded into the body of the interactive developer entry?
4. **Personal details.** I need your name for the centre hex, GitHub and LinkedIn URLs, the email address, and the CV PDF (or a placeholder path).
5. **Juka title.** Show it as `Juka 橘卡` on the card and leaf? That adds 卡 to the CJK font subset alongside 夜市橘开放快递.
6. **Contrast.** `--muted` `#7d7699` on the cell colour `#141030` is about 4.3:1, below AA for the small `.sub` text. Lifting it to about `#857ea3` gets it over 4.5:1 with almost no visible change. Approve?
7. **Dependencies outside the table.** These would each save hand-written code; tell me which are fine:
   - `@astrojs/check` for type checking `.astro` files in CI.
   - `prettier-plugin-astro` and `eslint-plugin-astro` so Prettier and ESLint understand `.astro` files.
   - OG images: render each project's OG card with Playwright at build time (already a dev dependency, no new package) instead of adding satori and resvg. I recommend Playwright.
   - CJK subset: fetch the Noto Sans SC 900 subset once from the Google Fonts `text=` API and commit the woff2 (a few KB), instead of adding a subsetting tool.
   - Lighthouse in CI through the `treosh/lighthouse-ci-action` GitHub Action, so no npm package is added.
8. **Cloudflare Pages previews.** The Pages Git integration builds a preview per branch with no code in the repo. I would use that and keep CI on GitHub Actions for tests only. It needs you to connect the repo in the Cloudflare dashboard. OK?
9. **Commits.** The prompt says commit after each phase; your last line says not to commit. I will not commit, and will stop with screenshots and a diff list after each phase instead.

## Phases

1. Scaffold: Astro static, strict TS, ESLint, Prettier, Vitest, Playwright, GitHub Actions, Pages preview.
2. Hex math, hole, layout, static front sheet, with unit tests.
3. City bake (worker), dynamic layers, parallax.
4. Drag, magnet, locked hexes, seat burst, reset, with reset tests.
5. Sections, leaf flips, routes, history, deep links.
6. Settings, prefs, audio, decrypt, glitch, tooltips.
7. Map and contacts.
8. Accessibility, reduced motion, no-JS fallback.
9. Performance with measured numbers and Lighthouse in CI.

After each phase: Playwright screenshots of port and prototype at 390x844 and 1440x900, side by side, with a list of differences.
