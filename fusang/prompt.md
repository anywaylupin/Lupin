# Build Fusang in 3D

You are Claude Code, working in this repository.

Replace the 3D world behind the hex sheet with Fusang: one continent on an Earth-like planet that still circles its dead star, Xukai, exactly as it stands in Yiwan (一万), the year 10,000.

The world is the backdrop of a portfolio, so it must be beautiful, fast, and calm enough for the sheet on top of it to stay readable.

Do not build everything at once: the phased plan tells you when to stop and show the owner.

## Read first

- `CITY.md`, the Fusang story bible and the single source of truth for every name, year, Chinese character and cause.
- `fusang/chronicle.md` and `fusang/terminology.md`, which retell and index the bible; where they differ, `CITY.md` wins.
- `AGENTS.md`, the rules for code, comments, prose and git.
- The code under `src/hive/` that you plug into, and the tests named under Tests.

## Canon rules

You render the bible; you do not extend it.

- Invent no named entities: no new people, places, houses, clans, machines, beasts, eras, events or named objects.
- Unnamed detail such as a vent or a lit window is fine when it adds no fact.
- Spell names as the bible does, with Chinese characters only where it gives them; Fusang names are pinyin without zh, ch, th or tr, except Shangri-La and Chang'e.
- Gods' names belong to places, houses and machines, never to a single person.
- The seed is Yin (阴) and the antiseed Yang (阳); the dead star is Xukai, with no characters; the planet has no name, so never label it.
- The code in `src/hive/city/` follows an abandoned design: carry none of its names, buildings, creatures, signs or motifs into Fusang.
- Show the cold as ice and frost on the ground and on surfaces; nothing falls from the sky.
- Where the bible is silent, choose, mark the choice as a suggestion in a declaration comment, and list it for the owner; when a choice would add a fact rather than a shape, ask instead.

Never show these, because each would add story:

- The last seed dimming, which only a Yutu (玉兔) run has caused.
- Zaoya or Yao's hideout in view, because either would say where the hideout lies, which the bible leaves open.
- Zaoya awake or moving at all, though the bible lets it wake and roam now and then, because where it wakes would place the hideout.
- A machine, hunt or fire near Yao's hideout, because the bible leaves open how close the Yiwan sweep came.
- Xihe moving against Yao: no Sanzuwu, Yayu or fire aimed at the dome's lower tiers, where Yao's elite live, or at Yao's hideout, because even after Yiwan Xihe has not moved against Yao.
- A machine or fire near Chang'e, or Chang'e in plain sight.
- Yang glowing, because it stays inert until raw Yin light reaches it.
- Earlier eras, and anything after Yiwan.

## What you are building

### The planet

- Xukai is a cold, dim remnant that gives almost nothing back: a faint disc low on the horizon, never the key light.
- On Fusang, only the last seed and what people made give light: the dome, the Ring's leaks and windows, the Sanzuwu and the fires.
- It reads as a sunset world, a deep indigo sky over a thin, cold band of afterglow around Xukai.
- The Dayside faced the star when it died and took every meteor; the Nightside received nothing and froze.
- Model only Fusang.
- Keep the rest of the Dayside unresolved, under unlit haze or cloud, beyond the limb or out of frame, so it neither shows nor denies the other continents and never reads as empty ocean or ice.
- Keep the other continents as empty slots in the geography data so they can come later.

### The continent at Yiwan

The bible implies every row below: the middle column is canon, and the last is a suggestion you may improve.

Rows marked runtime come from shaders and pure data, not `.glb` files.

#### The dome, the tower and the sky

| File                   | Canon                                                                                | Suggestion                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `dome.glb`             | Shields Shangri-La, filters the seed's light, and shows the Daily Hunt's executions. | A smoked shell with banded tiers and heavy gates, leaking light by day, executions as distant, unreadable panels. |
| `shangri-la.glb`       | The Xian's city inside the dome, built of common Yunjin (陨金).                      | Massing only, seen through the shell.                                                                             |
| `kunlun.glb`           | Kunlun (昆仑), Xihe's tower, with the tenth carriage and the last seed at its crown. | One sleek tower, its crown just under the dome's apex.                                                            |
| `tenth-carriage.glb`   | Bing's carriage, holding the last seed, where the Sanzuwu charge.                    | A ring cradle around the seed with three berths for the charging triad.                                           |
| Seed, runtime          | The last original seed, which never runs down on its own.                            | Gold-white and steady, the brightest point on the continent.                                                      |
| Tanggu (汤谷), runtime | The heat rift under the dome.                                                        | A rift cracking out past the dome's rim, heat haze rising.                                                        |
| `jiuying.glb`          | Jiuying (九婴): nine-headed, coiled in Tanggu, cooling the seed's heat for Xihe.     | Plated coils in the rift mouth, nine heads lifting in turn.                                                       |
| `carriage-wreck.glb`   | The nine carriages, which hung far apart above Fusang and broke there at Shejiu.     | Nine dark, broken frames high in the sky, variants of the tenth carriage.                                         |

#### Guanghuan, the Ring

| File                       | Canon                                                                                  | Suggestion                                            |
| -------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `kang-tower.glb`           | Kang (炕) towers: stacked homes over heat pipes stolen from the dome.                  | Patched stacks with warm vents at the base.           |
| `heat-pipe.glb`            | Stolen pipes carrying the dome's heat under the towers.                                | Patched segments running out from the dome as spokes. |
| `raised-platform.glb`      | Homes and streets held off the killing ice on crude Yunjin lift, ten thousand of them. | Welded scrap decks with a flickering underglow.       |
| `mine.glb`, `refinery.glb` | The mines and refineries of the lit belt, worked on the day shift.                     | Headframes over pits; tanks with furnace light.       |
| `night-bell.glb`           | The warning before Xihe pulls the light back.                                          | Bell frames on high platforms.                        |
| Ember cells, runtime       | Light cells stolen by ShenYi, worth killing for.                                       | Tiny warm points among the platforms at night.        |

#### The Ice and the sea

| File                             | Canon                                                                                                                                                 | Suggestion                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `shenyi-hideout.glb`             | ShenYi's hidden bases, burnt one after another in Yiwan.                                                                                              | Low structures past the light's edge, intact, burning and burnt.                                               |
| `ruin-jia.glb` to `ruin-gui.glb` | The ruins of the nine houses that lost their seeds: Jia, Yi, Ding, Wu, Ji, Geng, Xin, Ren and Gui, and none for Bing.                                 | Nine compounds half buried in ice, varied in silhouette.                                                       |
| Craters, runtime                 | The deep Yunjin craters the Sanzuwu strip, where Kuafu are sent as punishment.                                                                        | Terraced pits with dark gold seams.                                                                            |
| Frozen sea, runtime              | Xiushe lives under its ice.                                                                                                                           | Dark, translucent ice with pressure ridges.                                                                    |
| `xiushe.glb`                     | Xiushe (修蛇): a wild serpent under the frozen sea.                                                                                                   | A long shape moving dimly under the ice.                                                                       |
| `dafeng.glb`                     | Dafeng (大风): a wild, storm-sized bird riding the night winds.                                                                                       | Seen only at night, its wings blotting out lights.                                                             |
| `zaoya.glb`                      | Zaoya (凿牙): Yao's enormous beast, which sleeps for years in the deep ice, giving off no heat or signal; the tenth arrow's Yang is its chisel teeth. | Built and approved in the preview page, never placed in the scene until the owner answers open thread 1.       |
| `yao-hideout.glb`                | The secret Yao hideout in the deep ice where Zaoya sleeps.                                                                                            | Built and approved in the preview page, never placed in the scene until the owner answers open thread 1.       |
| `fengxi.glb`                     | Fengxi (封豨): an armoured tunnelling boar digging ShenYi's supply routes.                                                                            | Rarely seen; its tunnels show as faint ridges.                                                                 |
| `icewalker.glb`                  | The Bingmin (冰民), Icewalkers who mine Yunjin, hunt beasts and carry ShenYi supplies.                                                                | Caravans as distant files of faceless walkers under loads.                                                     |
| `yayu.glb`                       | Yayu (猰貐): a chrome hunting hound that tracks ShenYi for Xihe.                                                                                      | Packs of a few near the fires.                                                                                 |
| Chang'e (嫦娥), runtime          | ShenYi's lifted dome far out in the Ice, invisible to eye and radar, casting illusions.                                                               | No mesh: a proxy that bends the horizon so it does not line up, as the cloak's illusion, with no heat shimmer. |

The bible calls the beasts cyborgs: suggest heavy plating on Yayu and Jiuying, which serve Xihe, and ask about the rest.

### The Sanzuwu

Xihe rebuilt the nine burnt husks of Shejiu as obedient, ruthless, three-legged machines built around circles and spheres, charged by the last seed at Kunlun's crown.

Each triad holds one machine for exploitation, one for war and one for scouting; two triads are out while one charges.

| File         | Name          | Triad and role      | Canon                                | Suggestion                                      |
| ------------ | ------------- | ------------------- | ------------------------------------ | ----------------------------------------------- |
| `yuhui.glb`  | Yuhui (余晖)  | One, exploitation   | Tripod mining crawler                | Low body between three legs, ring cutter below  |
| `yan.glb`    | Yan (炎)      | One, war            | Furnace-chested ground mech, offence | Spherical furnace glowing through a ring grille |
| `rishi.glb`  | Rishi (日食)  | One, scouting       | Eclipse disc, stealth                | Black disc rimmed by a thin ring of light       |
| `rigui.glb`  | Rigui (日晷)  | Two, exploitation   | Gnomon deep-driller                  | Tilted drill mast on a circular base            |
| `heizi.glb`  | Heizi (黑子)  | Two, war            | One-eyed walker, defence             | One great dark eye in a spherical head          |
| `ri-er.glb`  | Ri'er (日珥)  | Two, scouting       | Crescent gunship, fast               | Crescent hull trailing an arc of ember light    |
| `liming.glb` | Liming (黎明) | Three, exploitation | Mobile refinery tower                | Stacked rings, furnace light on top             |
| `rimian.glb` | Rimian (日冕) | Three, war          | Corona flagship, command             | Great sphere crowned by fins, the largest       |
| `jin.glb`    | Jin (烬)      | Three, scouting     | Ember sphere that tracks heat        | Small ember sphere in a ring, the smallest      |

- Give all nine one frame language: a scorched husk frame under sleek Yunjin plating, and ember red where the charge shows.
- Keep the triad at home as one data value; the bible does not say which, so suggest triad two, leaving Yan and Rimian to lead the burning, and ask.
- Keep the home triad docked at the tenth carriage, and draw every machine in the field only from the other two.
- Build the legs of Rishi and Ri'er to fold, and keep them standing until the owner says whether they fly.

### The day shift

By day Xihe extends the seed's light over Guanghuan for the work shift; at night the night bell sounds, Xihe pulls the light back, the cold falls, and the ice creeps back over the ground.

The dome's own light never leaves, and the shift's light never reaches the Ice.

- Write a pure function of shift time returning the phase, the light's reach and the ice cover, with suggested phases of spreading, day, bell, pull back and night.
- The bible does not say how Xihe extends the light, so show the effect, never a device: a warm wash spreading from the dome to the edge of the lit belt.
- Let the ice follow the light's edge, sparing heat pipes and tower bases longest.
- At night only windows, vents, lift glow, ember cells, the Sanzuwu and the fires light the Ring.
- Synthesise the bell as a new `bell()` on the object `createAudio` returns in `fx/audio.ts`, playing only when `prefs().sound` is on, the audio context is unlocked by a gesture and the tab is visible.
- Expose `bell()` from `createChrome` as `gesture` is, and let `main.ts` pass it to the city, which calls it once as each bell phase begins.
- Suggest a cycle of a few minutes as one constant.

### The Yiwan campaign

Xihe runs the campaign itself, without Yao: the Sanzuwu find and burn one ShenYi hideout after another, and the Ring watches the smoke.

- Write a pure schedule that moves each hideout through hidden, found, burning and smouldering, with two or three smoke columns up at a time.
- Light the columns from below with ember-red fire, tall enough for the whole Ring to see.
- Show the Ring watching through light, not figures: windows and platform edges facing the smoke stay lit.
- Keep the war and scouting machines of the two active triads in the field near the fires, with Yayu packs on the edges, and keep their exploitation machines at work in the craters.

### Rare events through `reveal()`

Opening a hex calls `reveal()`, and the director stages the nearest show behind it; give it a new cast of short, canon-safe moments:

- A Sanzuwu at work, drawn only from the two triads in the field per the home-triad value: with the suggested triad two home, Yuhui cutting in a crater, Liming flaring, Rishi stalking past dark against the smoke, Jin sweeping for heat, or Yan setting a hideout alight.
- A Yayu pack breaking into a run, or an Icewalker caravan cresting a ridge.
- Jiuying lifting a few heads out of Tanggu, or a platform's lift stuttering.
- Dafeng crossing at night, or Xiushe cracking the sea ice from below.
- Rare: the horizon wavering where Chang'e stands.

Keep the stage lock in `events.ts` so that one large moment runs at a time.

## Suggested geography

Canon fixes the essentials: Fusang is the Asia of its planet, the dome stands over Tanggu, Guanghuan rings the dome, the Ice beyond the Ring holds the ruins, the craters and Chang'e, Yao's hideout lies somewhere in the deep ice, and the sea is frozen.

Everything below is a suggestion; keep it in one pure data module so the owner can move things.

- Fusang is the eastern continent of the Dayside, near its eastern rim, so Xukai hangs low in the west and the Nightside begins past the frozen sea.
- The dome sits over Tanggu in the east, with a strip of Ice between the Ring and the sea.
- Guanghuan is two to three dome radii deep: towers and platforms crowd the inner band along the heat pipes, and the lit belt fills the outer band.
- Past the light's edge come the burning hideouts, then the nine ruins far apart, then the craters.
- Yao's hideout and the sleeping Zaoya have a position in data only and no mesh in the scene; ask the owner before placing or showing either.
- Chang'e stands in the far western interior; Fengxi's tunnels and the Icewalker routes reach it, but every visible trace of them fades out long before it.
- At rest the camera looks west across the Ring and the dome toward the Ice, the nine wrecks overhead and Xukai low on the horizon.
- Distances serve the frame, not realism: enlarge the dome, the Ring and the machines so they read from every height.

## Art direction

- Stylised, smooth and sleek sci-fi with cyberpunk grit, after Akira, Cyberpunk: Edgerunners and Arcane.
- Smooth means bevelled forms and strong silhouettes; grit means wear, patched plating, cables, vents, scorch and smoke, most of it in the Ring.
- Common Yunjin is one dark, smooth metal with a gold undertone, rough scrap in Kuafu hands.
- The Sanzuwu are rings, discs and spheres on three legs; the beasts are animal mass, plated metal and glowing seams.
- Keep the palette dark and frozen, broken by the gold-white of the seed, the warm leaks of the Ring, and the ember red of the Sanzuwu and the fires.
- Light the scene with emissive materials and a few real lights at the seed and the fires, with bloom in full graphics.
- Avoid photorealism, photographic textures and readable text, and keep the seed the brightest point at rest.
- Set the fallback `#city` background in `src/styles/overlay.css` to the new night sky.

## The model pipeline

- Generate every model as a `.glb` from a TypeScript script in this repository: no Blender, no downloads, no outside services.
- Write one file per model, named after it, such as `kunlun.glb`, so a hand-made model can replace it later with no code change.
- Keep one deterministic builder per model, a registry of them all, and a `pnpm models` script that regenerates all or one by name.
- Export with three's `GLTFExporter`.
- Plain Node cannot load `src/` modules: Node 22's type stripping does not resolve this repository's extensionless relative imports, and no TypeScript runner is installed.
- Either bundle the builders through Vite under `pnpm dev` and drive them from a Playwright script in the Chromium the build installs, or ask the owner to approve a runner such as tsx; never import Vite or esbuild directly, because they are only transitive dependencies.
- Use vertex colour rather than textures, commit the outputs, and mark `*.glb` as binary in `.gitattributes`.
- Mark each model as generated or hand-made, and never let the generator overwrite a hand-made file.

Every model follows one contract, which a pure `checkModel()` validates:

- Metres, y up, front toward positive z, origin at the ground contact point.
- Child nodes `lod0`, `lod1` and `lod2`, each complete, for anything repeated or distant.
- Material names from a fixed list of slots, such as `yunjin`, `husk`, `scrap` and `glow-ember`, which the runtime swaps for shared materials and merges per slot.
- Moving parts as named nodes pivoted at their joints, such as `leg-1` or `head-9`, animated in code.
- Triangle budgets in the registry, starting near 20,000 for a hero `lod0`, 5,000 for a repeated one, and a quarter of that per step down.

Draw anything repeated as one `InstancedMesh` per level and slot, binned by distance in a pure function; instance the nearest few thousand platforms and draw the rest as lights.

Build a preview page that loads each model with `GLTFLoader`, lets the owner rotate it with `OrbitControls` under day and night lighting, switches levels and wireframe, and shows triangles, size and the contract check.

It runs only under `pnpm dev` and never reaches `dist`: register its route through an Astro integration's `injectRoute` only when `command` is `dev`, and keep it out of `src/pages` and `public/`.

The owner approves models there, you record approval in the registry, and the site loads only approved models, with grey proxies for the rest.

Every `.glb` imported with `?url` anywhere in the runtime graph is emitted into `dist`, so have the runtime import only approved models, for example from a generated list of `?url` imports.

## Plugging into the site

### What stays

- Keep the lazy import of `./city/world` in `main.ts`, three in its own chunk, and the flat backdrop when `createCity` throws.
- Keep the contract in `world.ts`: `City` with `soft`, `resize`, `frame`, `reveal` and `setLow`, and `CityFrame` with `dt`, `life`, `weather` and `glitch`.
- `CityOptions` keeps `open` and gains one field, `bell: () => void`, for the night bell.
- The world draws no text, so drop every other option, including the font families `zh` and `mono`, and the code in `main.ts` that builds them.
- Keep `#city` and its scanline overlay, the `CityLink` in `state.ts`, the step on every other frame, and skipping renders when nothing moved.
- Keep `events.ts` as it is, and `post.ts` apart from the two-layer change under the camera.
- Keep `Parts` and `holder` from `kit.ts`, and rewrite the rest to the new slot list, with no window, billboard, roof, pagoda, tile or neon code.
- Keep `merged()` from `materials.ts`, and rewrite the rest for the new slots without the facade texture.
- Keep the `Landmark` interface in `landmark.ts`, and drop `Kit` with its `Boards` import.
- Keep `director.ts` with a new `Cast`, and give it the crown point in place of `DOME`.
- Keep `emitter.ts`, and move a glow texture builder into a kept file before deleting `textures.ts`.
- Keep only `VIEW.fov`, the wider phone lens, and `Ndc`, `Vec3`, `Candidate`, `chooseFor` and `COOLDOWN` from `plan.ts`; the new camera module replaces `VIEW.eye`, `VIEW.pitch` and `PAN`.
- Delete everything else in `src/hive/city/` and `plan.ts`, and rebuild the scene inside `world.ts`.

### The camera from continent to planet

Today `place()` maps sheet pan to a flat move and sheet zoom to a short dolly, between `ZOOM_MIN` (0.6) and `ZOOM_MAX` (1.6) in `src/hive/camera.ts`.

- Describe the camera in a pure module as latitude and longitude in the continent's frame, altitude, pitch and heading.
- Map zoom to altitude on a smooth log curve: zoom 1 is the rest view over the Ring, `ZOOM_MAX` drops toward the dome, and `ZOOM_MIN` climbs until the planet curves away and the Dayside, the Nightside and Xukai show.
- Ease the pitch toward the globe's centre as the camera climbs, and scale pan with altitude so a pixel moves the ground about the same distance on screen at every height.
- Clamp pan so Fusang never leaves the view, and propose any change to the zoom limits to the owner first, because it changes how the sheet feels.
- Render a far layer for the globe, sky, Xukai and wrecks and a near layer for the continent, each with its own depth range, the near one in a local frame centred on the dome so precision holds close up.
- Extend `post.ts` to render the far scene and camera, clear depth, then render the near scene and camera: in the composer path with a second `RenderPass` set to `clear` false and `clearDepth` true, in the low path, and in the glitch's scissored re-render.
- Apply the resize view offset to both cameras, and keep one renderer and one canvas.
- At rest the hole frames Kunlun's crown and the seed: swap the old framed point for a crown point, and let `resize` offset the view onto `holeView` as it does today.
- Move the crown projection into a pure function in the new camera module that takes the rest camera parameters, the crown point and the viewport and returns the lens offset.
- Make `at()` clamp to the terrain height instead of the old level constant.

### Low graphics, reduced motion and software GL

- Keep `lowGraphics(h)` and `setLow`: full graphics gets the composer with bloom, every level, full instance counts, particle smoke, shimmer and the ice creep shader.
- Low graphics renders directly with `lod1` and below, half the repeated instances, card smoke, no shimmer and no horizon bend, so Chang'e leaves no trace.
- On software GL keep `softwareGl()`, one frame in `SOFT_EVERY`, pixel ratio 0.5 and low graphics by default; headless Chromium usually renders through SwiftShader, so the baselines will likely show the low path.
- Under reduced motion the clocks freeze and the camera stays home, so render one still state: suggest late in the day shift, two smoke columns up.
- Let `life` drive the day shift, the campaign, machines, beasts and director, and `weather` drive wind, smoke and shimmer.

### Loading and performance

- Load models after the sheet is interactive, the dome, Kunlun and the tenth carriage first, and keep the proxy of any model that fails.
- Fetch and parse one model per idle callback after `load`, because parsing them all at once adds long tasks that raise Total Blocking Time.
- Make every model swap and every proxy fallback mark the frame dirty, as `drawn = false` does today, or a still frame under reduced motion keeps its proxies forever.
- Set a readiness flag on `#city` only after the frame that follows the last rest-view model resolving, loaded or failed, and make `settle()` in the visual spec wait for it.
- Keep the Lighthouse performance score at 0.9 or more and the other three categories at 1, as `lighthouserc.json` asserts.
- Lighthouse runs only in CI, so to measure it ask the owner either to push a branch or to approve `pnpm dlx @lhci/cli autorun --config=lighthouserc.json` after `pnpm build`.
- Until then, report Total Blocking Time measured with Playwright tracing on the four URLs in `lighthouserc.json`, under software GL.
- Keep the console free of errors and warnings, because `tests/e2e/smoke.spec.ts` fails on either and best practices drops on errors.
- Catch model load failures without logging, fetch only files the registry lists, and normalise attributes before merging as `merged()` does.
- Start from 150 draw calls and 1.5 million triangles in full graphics, 60 and 400,000 in low, and 8 MB of models, then measure.
- In dev, read draw calls and triangles from `renderer.info.render` after the rest frame.
- Keep Draco, meshopt and KTX2 out unless the owner agrees to serve their decoders.

## Engineering rules

- Follow `AGENTS.md`: files under about 300 lines, strict TypeScript with no `any`, comments only on declarations.
- Keep the geography, roster, day shift, campaign, camera mapping, crown projection, level choice, registry and `checkModel()` in pure modules that take a `Rand` and a clock instead of calling `Math.random()` or `performance.now()`.
- Add no dependency without asking the owner first; expect only three's own addons: `GLTFLoader`, `GLTFExporter`, `OrbitControls`, `BufferGeometryUtils`, and the composer passes already in use.
- Run `pnpm format`, `pnpm lint`, `pnpm check` and `pnpm test` before every commit, and `pnpm test:e2e` after each phase that changes the scene.
- At the end of each phase that changes the scene, regenerate the baselines with `pnpm test:visual:update`, or ask the owner to run it when Docker is missing.
- Until the baselines are regenerated, every command means format, lint, check, test and every e2e spec except `visual.spec.ts`.
- Commit after each finished piece of work, and never push.
- Update the `city/` line in `AGENTS.md` when you delete the first design and again for the final module list, add `pnpm models` to its Commands block, and add the generator and the preview page to its Layout.
- Leave `CITY.md` and the `fusang/` documents alone.
- Trim `SIGN_GLYPHS` in `astro.config.ts` to the two glyphs of the Juka title, 橘卡, and update its comment; ask the owner before the world draws any glyph.

## Tests

- Rewrite `tests/unit/city.test.ts` around the new pure modules, keeping the `chooseFor` and stage lock tests and the existing `holeView` tests, renamed for the new world.
- Test that the crown projection lands Kunlun's crown on `holeView` at 390x844 and 1440x900.
- Test the canon: nine Sanzuwu in three triads with one triad home, nine ruins without Bing, nine wrecks, no visible Chang'e, Zaoya or Yao's hideout, a seed that never dims, and every proper name the world uses appears in `CITY.md`.
- Test the day shift, the campaign and the camera: light gone at night, the shift's light never reaching the Ice, no fire near Yao's hideout or Chang'e, Zaoya never moving, and altitude falling as zoom rises.
- Test the cast: no reveal stages a machine from the home triad, and the director never casts one outside Kunlun's crown.
- Test the bell: it rings once per cycle in the bell phase and never when the sound preference is off.
- Run `checkModel()` on every model, sum registry budgets times instance counts against each cap, assert that the scene loads only approved ones, and keep `settings.spec.ts` finding one `#city canvas`.
- After `pnpm build`, check that `dist` holds no preview page and no unapproved `.glb`.
- Regenerate the Linux baselines with `pnpm test:visual:update`, which needs Docker; without it, ask the owner to run it.

## Phased plan

Commit at the end of each phase, and start the next only when the last is done.

### Phase 0: the plan

Write a short plan in your reply to the owner, not in a file: the geography with suggestions marked, the scale, the model list with budgets, the camera curve and your questions.

Stop and wait for the owner's approval before writing code.

- Done when the owner approves the plan.

### Phase 1: data and layout

Write the pure modules and their tests, delete the first design, stand the continent up as terrain with grey proxies, and update the `city/` line in `AGENTS.md`.

- Done when every command passes, the hole frames Kunlun's crown at both sizes, and no name from the first design is left in `src/hive/city/`, `src/hive/main.ts`, `tests/unit/city.test.ts`, `src/styles/overlay.css` or `astro.config.ts`.
- The hex sheet's own figures in `figures.ts`, `flourish.ts`, `scenes.ts` and `interact.ts` are not part of the city and stay.

### Phase 2: the generator and the first model

Build the generator, registry, `checkModel()` and preview page, then one model that sets the quality bar: suggest Yan, which carries most of the art direction.

Stop, show the owner the model in the preview page with its numbers, and wait for approval before building any other.

- Done when `pnpm models yan` is deterministic and passes the contract within budget, `dist` holds no preview page, and the owner approves.

### Phase 3: the rest of the models

Build the dome, Shangri-La, Kunlun, the tenth carriage and the wrecks; then the other Sanzuwu; then the Ring; then the Ice; then the beasts, showing the owner each group.

- Done when every model passes the contract within budget and the owner has approved it.

### Phase 4: the scene and the camera

Assemble both layers, instancing, the camera curve, the framing, and the low, software and reduced motion paths.

- Done when the rest view matches the plan at both sizes, zoom runs from the Ring to orbit without depth fighting, budgets hold, and Lighthouse stays at 0.9 or more.
- The low path must render `lod1` and below with half the instances, no shimmer and no horizon bend; software GL must default to low at pixel ratio 0.5; and reduced motion must render the one suggested still state with the camera at home.

### Phase 5: the day shift and Yiwan

Add the day shift, the bell, the ice creep, the campaign, the machines and beasts in the field, and the director's new cast.

- Done when a full cycle runs, opening a hex stages a nearby show, tests prove no event breaks the list of things never shown, and the night bell rings once per cycle in the bell phase and never when the sound preference is off.

### Phase 6: polish and performance

Tune the palette and composition against the sheet, measure, regenerate the baselines and update `AGENTS.md` with the final module list.

- Done when every command passes, you have reported measured budgets, and the owner has your list of suggestions made and questions still open.

## Out of scope

- Other continents, and any light or hint of them on the globe.
- Characters: no named person and no figure close enough to read as one.
- The interiors of Shangri-La and Chang'e.
- Story beyond Yiwan, and answers to the bible's open threads.

## Ask the owner

- Which triad is home in Yiwan, and whether Rishi and Ri'er fly.
- Whether the planet turns; suggest a still globe with the Dayside toward Xukai.
- How much of the Dayside the orbital view may show while the other continents are unmodelled.
- Where Yao's hideout and the sleeping Zaoya lie, which is open thread 1, and whether either may ever be placed or shown.
- Whether Zaoya may ever be shown awake and roaming, as the bible allows, once its hideout is placed.
- Whether the nine ruins should reflect anything of their houses.
- How much metal Fengxi, Dafeng, Xiushe and Zaoya carry, and whether anything of the slag fields is left to model.
- Whether the zoom limits may change, and whether any dependency, runner or decoder may be added.
- Anything else that would add a fact rather than a shape.
