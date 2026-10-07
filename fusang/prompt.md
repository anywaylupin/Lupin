# Build Fusang in 3D

You are Claude Code, working in this repository.

Replace the 3D world behind the hex sheet with Fusang: one continent on a frozen planet that still circles its dead star, exactly as it stands in Yiwan (一万), the year 10,000.

It is the backdrop of a portfolio, so it must be beautiful, fast, and quiet enough for the sheet to stay readable on top of it.

Do not build everything at once: the phased plan at the end tells you when to stop and show the owner.

## Read first

- `CITY.md`, the Fusang story bible and the single source of truth for every name, year, Chinese character and cause.
- `fusang/chronicle.md` and `fusang/terminology.md`, which retell and index the bible; where they seem to differ, `CITY.md` wins.
- `AGENTS.md`, the rules for code, comments, prose and git.
- The code you plug into: `src/hive/main.ts`, `state.ts`, `layout.ts`, `camera.ts`, `interact.ts`, everything in `src/hive/city/`, and the tests that touch them.

## Canon rules

You render the bible; you do not extend it.

- Invent no named entities: no new people, places, houses, clans, machines, beasts, eras, events or named objects.
- Unnamed detail is welcome when it adds no fact: a pipe, a vent, a scorch mark, a lit window.
- Spell names as the bible does, with Chinese characters only where it gives them; Fusang names are pinyin without zh, ch, th or tr, except Shangri-La and Chang'e.
- The seed is Yin (阴) and the antiseed Yang (阳); the dead star is Xukai, with no characters; the planet has no name, so never label it.
- Gods' names belong to places, houses and machines, never to a single person.
- The code in `src/hive/city/` follows an abandoned design: delete it, and carry none of its names, buildings, creatures or motifs into Fusang.
- The cold of Fusang is ice and frost, and nothing else falls from its sky.
- Where the bible is silent, choose, mark the choice as a suggestion in a declaration comment and list it for the owner; when a choice would add a fact rather than a shape, ask instead.

Never show any of these, because each would add story:

- The last seed dimming, which would be a Yutu (玉兔) run: legend, not scenery.
- Zaoya heading for the dome, because awake and enraged it would go for the seed, and that is the story's endgame.
- Chang'e as a dome, a light or a mesh.
- A Sanzuwu, hunt or fire near Yao's hideout, because the bible leaves open how close the Yiwan sweep came.
- Yang glowing, because it stays inert until raw Yin light reaches it.
- Anything after Yiwan.

## What you are building

### The planet

- Xukai is a cold, dim remnant that gives almost nothing back: a faint disc low on the horizon, never the light of the scene.
- The planet is lit only by what people made: the seed, the dome's leaks, the Ring's heat and fire, and the glow of the Sanzuwu.
- It reads as a sunset world, deep indigo overhead with a thin, dull band where Xukai sits.
- The Dayside faced the star when it died and took every meteor; the Nightside received nothing and froze.
- From high up, suggest the split by turning the Dayside toward Xukai with a faint rim of its glow and leaving the Nightside fully dark.
- The bible does not say whether the planet still turns, so keep the globe still.
- Model only Fusang: the rest of the globe is frozen ocean and ice, built from data so the other Dayside continents can be added later.

### The continent at Yiwan

Every row is implied by the bible: the middle column is canon, and the last is a suggestion you may improve.

Rows marked runtime come from shaders and pure data, not `.glb` files.

#### The dome, the tower and the sky

| File                   | Canon                                                                                                                                                         | Suggestion                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dome.glb`             | Shields Shangri-La and filters the seed's light; Yao's elite live in its lower tiers; its gates stayed shut on Hou Yi; the Daily Hunt shows executions on it. | A smoked shell showing Kunlun and the seed through it, with banded tiers and heavy gates; by day light leaks from its seams and executions play across it as distant, abstract panels. |
| `shangri-la.glb`       | The Xian's city inside the dome, built of common Yunjin (陨金).                                                                                               | Massing only: terraces of filtered light.                                                                                                                                              |
| `kunlun.glb`           | Kunlun (昆仑), Xihe's tower, with the tenth carriage and the last seed at its crown, where the Sanzuwu charge.                                                | One sleek tower, its crown just under the dome's apex.                                                                                                                                 |
| `tenth-carriage.glb`   | Bing's carriage, holding the last seed.                                                                                                                       | A ring cradle around the seed with three charging berths.                                                                                                                              |
| Seed, runtime          | The last original seed, which never runs down on its own.                                                                                                     | Gold-white and steady, the brightest point on the continent.                                                                                                                           |
| Tanggu (汤谷), runtime | The heat rift under the dome.                                                                                                                                 | A crack opening past the dome's rim, heat haze rising.                                                                                                                                 |
| `jiuying.glb`          | Jiuying (九婴): nine-headed, coiled in Tanggu, cooling the seed's heat for Xihe.                                                                              | Plated coils and nine slowly lifting heads.                                                                                                                                            |
| `carriage-wreck.glb`   | The nine carriages, which hung far apart above Fusang in fixed positions and broke there at Shejiu.                                                           | Nine dark, broken frames high in the sky, from three or four variants.                                                                                                                 |

#### Guanghuan, the Ring

| File                       | Canon                                                                                      | Suggestion                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `kang-tower.glb`           | Kang (炕) towers: stacked homes over heat pipes stolen from the dome, ruled by pipe kings. | Irregular stacks with warm vents at the base.                          |
| `heat-pipe.glb`            | Stolen pipes carrying the dome's heat under the towers.                                    | Patched segments running out from the dome like spokes.                |
| `raised-platform.glb`      | Homes and streets held off the killing ice on crude Yunjin lift, ten thousand of them.     | Welded scrap with a flickering underglow and heat shimmer.             |
| `mine.glb`, `refinery.glb` | The mines and refineries of the lit belt, worked on the day shift.                         | Headframes over pits; stacks and tanks with furnace light.             |
| `night-bell.glb`           | The warning before Xihe pulls the light back.                                              | Bell frames on high platforms; the bible gives the bell no look.       |
| Ember cells, runtime       | Light cells stolen by ShenYi, worth killing for.                                           | Tiny warm points hidden among the platforms at night.                  |
| `shenyi-hideout.glb`       | ShenYi's hidden bases, burnt one after another in Yiwan.                                   | Low structures in the outer Ring and near Ice: intact, burning, burnt. |

#### The Ice and the sea

| File                             | Canon                                                                                                                                                                  | Suggestion                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ruin-jia.glb` to `ruin-gui.glb` | The ruins of the nine houses that lost their seeds: Jia, Yi, Ding, Wu, Ji, Geng, Xin, Ren and Gui; Bing has none.                                                      | Nine distinct compounds half buried in ice, each shaped around its stem's traditional element.                         |
| Craters, runtime                 | The deep Yunjin craters the Sanzuwu strip, where Kuafu are sent as punishment.                                                                                         | Terraced pits with dark gold seams.                                                                                    |
| Frozen sea, runtime              | Xiushe lives under its ice.                                                                                                                                            | Dark, translucent ice and pressure ridges.                                                                             |
| `xiushe.glb`                     | Xiushe (修蛇): a wild serpent under the frozen sea.                                                                                                                    | A long shadow moving under the ice.                                                                                    |
| `dafeng.glb`                     | Dafeng (大风): a wild, storm-sized bird riding the night winds.                                                                                                        | Seen only at night, wings darkening part of the Ring.                                                                  |
| `zaoya.glb`                      | Zaoya (凿牙): Yao's enormous beast, asleep in the deep ice with no heat or signal; the tenth arrow's Yang became its chisel teeth.                                     | A huge curled shape dim through the ice, its teeth dull and dark.                                                      |
| `yao-hideout.glb`                | The secret Yao hideout in the deep ice where Zaoya sleeps.                                                                                                             | A sealed structure barely showing at the surface.                                                                      |
| `fengxi.glb`                     | Fengxi (封豨): an armoured tunnelling boar digging ShenYi's supply routes.                                                                                             | Rarely seen; its tunnels show as faint ridges.                                                                         |
| `icewalker.glb`                  | The Icewalkers, Bingmin (冰民): augmented nomads who mine Yunjin, hunt beasts and carry ShenYi supplies.                                                               | Caravans as distant files of faceless walkers under loads.                                                             |
| `yayu.glb`                       | Yayu (猰貐): a chrome hunting hound that tracks ShenYi for Xihe.                                                                                                       | Packs of a few on the Ring's edge and the near Ice.                                                                    |
| Chang'e (嫦娥), runtime          | ShenYi's dome far out in the Ice, lifted by its nine weak seeds, invisible to eye and radar, casting illusions; it crawls across the land and moves every few decades. | Still in this scene, with no visible mesh: an invisible proxy drives heat shimmer and a faint mismatch in the horizon. |

### The Sanzuwu

The nine burnt husks of Shejiu, rebuilt as obedient, ruthless, three-legged machines built around circles and spheres, charged by the last seed at Kunlun's crown.

Each triad holds one machine for exploitation, one for war and one for scouting; two triads are out while one charges.

| File         | Name          | Triad and role      | Canon                                | Suggestion                                      |
| ------------ | ------------- | ------------------- | ------------------------------------ | ----------------------------------------------- |
| `yuhui.glb`  | Yuhui (余晖)  | One, exploitation   | Tripod mining crawler                | Low body between three legs, ring cutter        |
| `yan.glb`    | Yan (炎)      | One, war            | Furnace-chested ground mech, offence | Spherical furnace glowing through a ring grille |
| `rishi.glb`  | Rishi (日食)  | One, scouting       | Eclipse disc, stealth                | Dark disc rimmed by a thin ring of light        |
| `rigui.glb`  | Rigui (日晷)  | Two, exploitation   | Gnomon deep-driller                  | Tilted mast on a circular base                  |
| `heizi.glb`  | Heizi (黑子)  | Two, war            | One-eyed walker, defence             | One great dark eye in a spherical head          |
| `ri-er.glb`  | Ri'er (日珥)  | Two, scouting       | Crescent gunship, fast               | Crescent hull trailing an arc of light          |
| `liming.glb` | Liming (黎明) | Three, exploitation | Mobile refinery tower                | Stacked rings, furnace light on top             |
| `rimian.glb` | Rimian (日冕) | Three, war          | Corona flagship, command             | Great sphere crowned by fins, the largest       |
| `jin.glb`    | Jin (烬)      | Three, scouting     | Ember sphere that tracks heat        | Small ember sphere in a ring, the smallest      |

- Give all nine one frame language: a scorched husk core, sleek Yunjin plating, and ember red where the charge shows.
- Make the triad at home one data value; the bible does not say which, so suggest triad two and ask.
- Every Sanzuwu stands on three legs, so ask whether Ri'er and Rishi fly before lifting them.

### The day shift

By day Xihe extends the seed's light over Guanghuan for the work shift; at night the light is pulled back, the cold falls and the ice creeps back.

The night bell warns before the pull-back; the dome's light never leaves, and the Ice never receives it.

- Write a pure function of shift time returning the phase, the light's reach and the ice cover, with suggested phases of light out, bell, pull back, night and light returns.
- Draw the light's edge as a soft wall of warm haze, the ice following it in and out and sparing heat pipes and tower bases longest.
- At night only windows, vents, lift glow, ember cells and the fires of Yiwan light the Ring, and Dafeng rides the night winds.
- Ring the bell through `src/hive/fx/audio.ts`, only when the sound preference allows it.
- Suggest a cycle of a few minutes, as one constant.

### The Yiwan campaign

Xihe runs the campaign itself, without Yao: the Sanzuwu find and burn one ShenYi hideout after another, and the Ring watches the smoke.

- Write a pure schedule that moves each hideout through hidden, found, burning and smouldering, keeping two or three smoke columns up.
- Light the columns from below with ember-red fire, tall enough for the whole Ring to see.
- Show the Ring watching through light, not figures: windows and platform edges facing the smoke stay lit.
- Keep the machines in the field near the current fire, with Yayu packs on its edges.

### Rare events through `reveal()`

Opening a hex calls `reveal()`, and the director stages the nearest show behind it; give the director a new cast of short, canon-safe moments:

- A machine in the field at work, such as Rigui drilling, Liming flaring, Heizi turning its eye, Jin sweeping for heat or Yan burning.
- A hideout catching fire, or a Yayu pack breaking into a run.
- Jiuying lifting a few heads out of Tanggu, or a platform's lift flickering.
- Dafeng crossing at night, or Xiushe cracking the sea ice from below.
- Rarer: the horizon wavering where Chang'e stands.
- Rarest: Zaoya waking and roaming the far Ice, clashing with Dafeng or Xiushe, then settling back into the cold.

Keep the stage lock in `events.ts` so one large moment runs at a time.

## Suggested geography

Canon fixes the essentials: Fusang is the Asia of its planet, the dome stands over Tanggu, Guanghuan rings the dome, and the Ice, the frozen sea and Chang'e lie beyond.

Everything below is a suggestion, kept in one pure data module so the owner can move things:

- Fusang is the eastern continent of the Dayside, with a long east coast.
- The dome sits over Tanggu near that coast, with the frozen sea offshore beyond a strip of Ice.
- Guanghuan is two to three dome radii wide, its outer band the lit belt of mines and refineries, with towers and platforms crowding inward along the heat pipes.
- The nine ruins lie far apart in the Ice, with the craters further out.
- Yao's hideout lies far from the Ring, placed so it says nothing about the sweep.
- Chang'e stands in the far western interior, with Fengxi's tunnels and the Icewalker routes faintly converging on it.
- The nine wrecks spread over the continent at one high altitude.
- The rest view looks across the Ring and the dome toward the deep Ice, Xukai low on the horizon and the wrecks overhead.
- Distances serve the frame, not realism.

## Art direction

- Stylised, smooth and sleek sci-fi with cyberpunk grit, after Akira, Cyberpunk: Edgerunners and Arcane.
- Smooth means bevelled forms and strong silhouettes; grit means wear, patched plating, cables, vents, scorch, smoke and heat haze, most of it in the Ring.
- Common Yunjin is one dark, smooth metal with a gold undertone for everything Xihe built, and rough scrap in Kuafu hands.
- The beasts are cyborgs: animal mass, plated metal and glowing seams.
- Keep the palette dark and frozen, broken by the gold-white of the seed, the warm leaks of the Ring, and the ember red of the Sanzuwu and the fires.
- Light comes from emissive materials and a few real lights at the seed and the fires, with bloom in full graphics.
- Avoid photorealism, photographic textures and readable text.
- Keep the hole's edges dark and the seed the brightest point at rest.

| Token     | Hex       | Use                             |
| --------- | --------- | ------------------------------- |
| Night sky | `#0a0d24` | Sky, far ice, fallback backdrop |
| Ice       | `#1c2b4a` | Ground and sea ice              |
| Rime      | `#9fb8d8` | Frost edges                     |
| Seed      | `#fff3d1` | The last seed                   |
| Ring leak | `#ffb35a` | Dome leaks, windows, vents      |
| Ember     | `#ff3b1e` | Sanzuwu, fire, ember cells      |
| Yunjin    | `#2a2418` | Xihe's metal                    |

These hex values are suggested starting tokens; replace the fallback `#city { background: #0f0d3a }` in `src/styles/overlay.css` with the night sky so the world fades in without a jump.

## The model pipeline

- Generate every model as a `.glb` from a TypeScript script in this repository: no Blender, no downloads, no outside services.
- Write one file per model, named after it, such as `kunlun.glb`, so a hand-made model can replace it later with no code change.
- Keep one builder per model, a registry of all of them, and a `pnpm models` script that regenerates everything or one model by name.
- Export with three's `GLTFExporter` in Node, adding a short `FileReader` shim because Node 22 lacks it, or run the builders in the Playwright Chromium the build already installs.
- Use Node's built-in type stripping, and ask before adding a runner.
- Make every builder deterministic, so each run writes the same bytes.
- Import outputs with Vite `?url` for hashed names, unless you find a reason to use `public/`.
- Mark each model as generated or hand-made, and never let the generator overwrite a hand-made file.

Every model, generated or hand-made, follows one contract:

- Metres, y up, front toward positive z, origin at the ground contact point.
- Child nodes `lod0`, `lod1` and `lod2`, each complete, for anything repeated or distant.
- Material slot names from a fixed list, such as `yunjin`, `scrap`, `ice`, `glow-seed` and `glow-ember`, which the runtime swaps for shared materials and merges per slot, as `materials.ts` does today.
- Moving parts as named nodes pivoted at their joints, such as `leg-1` or `head-9`, animated in code rather than skinned.
- Vertex colour instead of image textures, unless the owner agrees.
- Triangle budgets in the registry, starting near 20,000 for a hero `lod0`, 5,000 for a repeated one, and a quarter of that per step down.

A pure `checkModel()` validates parsed glTF JSON against this contract.

Draw anything repeated as one `InstancedMesh` per level, with a pure function sorting instances by distance.

Build a preview page that loads each model with `GLTFLoader`, lets the owner rotate it with `OrbitControls` under the scene's lighting, switches levels and wireframe, and shows triangles, size and the contract check.

It runs only under `pnpm dev` and never reaches `dist`; the owner approves models there, you record approval in the registry, and the site loads only approved models.

## Plugging into the site

### What stays

- `main.ts` imports `./city/world` lazily after the sheet is up; keep three in its own chunk and the flat backdrop when `createCity` throws.
- Keep the contract in `world.ts`: `City` with `soft`, `resize`, `frame`, `reveal` and `setLow`; `CityFrame` with `dt`, `life`, `weather` and `glitch`; `CityOptions` with `open`.
- Keep `#city` and its scanline overlay, the `CityLink` in `state.ts`, the step on every other frame, and skipping renders when nothing moved.
- Keep `post.ts`, `director.ts` with a new `Cast`, `events.ts`, `kit.ts`, `materials.ts`, `emitter.ts`, the `Landmark` interface, and `VIEW`, `PAN`, `Ndc`, `Vec3`, `Candidate`, `chooseFor` and `COOLDOWN` from `plan.ts`.
- Delete everything else in `src/hive/city/` and `plan.ts`, with the `ads` option and `adverts()` in `main.ts`.

### Camera and framing

- At rest the hole frames Kunlun's crown and the seed: swap the old framed point for a crown point, and let `resize` offset the view onto `holeView` as it does today.
- Replace the dolly in `place()` with a log curve from sheet zoom to altitude: zoom 1 is the rest view, `ZOOM_MAX` (1.6, in `src/hive/camera.ts`) drops toward the dome, and `ZOOM_MIN` (0.6) rises until the planet curves away, the Dayside and Nightside show and Xukai sits on the rim.
- Scale pan with altitude so a pixel moves the ground about the same distance on screen at every height.
- Those limits exist because the old layers ran out of board; propose any change to the owner first, because it changes how the sheet feels.
- Render a far layer for the globe, sky, Xukai and wrecks and a near layer for the continent, each with its own depth range, and curve the near ground in its vertex shader to meet the globe.
- Make `at()` clamp to the terrain height instead of the old level constant.

### Low graphics, reduced motion and software GL

- Keep `lowGraphics(h)`, `setLow`, and the composer for full graphics with a direct render for low.
- Full graphics gets bloom, every level, full instance counts, particle smoke, shimmer and the ice creep shader.
- Low graphics gets `lod1` and below, half the repeated instances, card smoke, vertex colour ice and no shimmer, so Chang'e stays invisible.
- On software GL keep `softwareGl()`, one frame in `SOFT_EVERY`, pixel ratio 0.5 and low graphics by default.
- Under reduced motion the clocks freeze and the camera stays home, so render one still state: suggest late in the light shift, two smoke columns up.
- Let `life` drive the day shift, machines, beasts and director, and `weather` drive wind, smoke and shimmer.

### Loading and performance

- Load models after the sheet is interactive: the dome, Kunlun, the tenth carriage and the terrain first, the rest by distance.
- Skip a model that fails to load rather than throwing.
- Set a readiness flag on `#city`, such as `data-ready`, once the rest view is drawn, and make `settle()` in the visual spec wait for it.
- Keep the Lighthouse performance score at 0.9 or more, as `lighthouserc.json` asserts.
- Start from 150 draw calls and 1.5 million triangles in full graphics, 60 and 400,000 in low, and 8 MB of models, then measure and report.
- Keep Draco, meshopt and KTX2 out unless the owner agrees to serve their decoders.

## Engineering rules

- Follow `AGENTS.md`: files under about 300 lines, strict TypeScript with no `any`, and comments only on declarations.
- Keep the geography, roster, day shift, Yiwan schedule, show and level choice, registry and `checkModel()` in pure modules that take a `Rand` instead of calling `Math.random()`.
- Add no dependency without asking the owner first; three already includes `GLTFLoader`, `GLTFExporter`, `OrbitControls`, `BufferGeometryUtils` and the composer passes in use.
- Run `pnpm format`, `pnpm lint`, `pnpm check` and `pnpm test` before every commit, and `pnpm test:e2e` after each phase that changes the scene.
- Commit after each finished piece of work, and never push.
- Update the layout in `AGENTS.md`, leave `CITY.md` and the `fusang/` documents alone, and tell the owner that `CITY.md` still says the code follows the first design.
- Add any Chinese glyph the world draws to `SIGN_GLYPHS` in `astro.config.ts`, and ask before removing the subset.

## Tests

- Rewrite `tests/unit/city.test.ts` around the new pure modules.
- Test the canon: nine Sanzuwu in three triads with one machine per role, one triad home, nine ruins without Bing, nine wrecks, no visible model for Chang'e, and Zaoya kept far from the Ring.
- Test that every name in the world data appears in `CITY.md`.
- Test the day shift: phases in order, light full by day and gone at night, ice cover opposite, the Ice never lit.
- Keep the `chooseFor` and stage lock tests, and the `holeView` tests at 390x844 and 1440x900, now framing Kunlun's crown.
- Run `checkModel()` on every model, and assert the scene loads only approved ones.
- Keep `settings.spec.ts` finding one `#city canvas`.
- Regenerate the Linux baselines with `pnpm test:visual:update`, which needs Docker; without it, ask the owner to run it.

## Phased plan

Commit at the end of each phase, and start the next only when the last is done.

### Phase 0: the plan

Write a short plan: the geography with suggestions marked, the model list with budgets, the scale, the camera curve and your questions.

Stop and wait for the owner's approval before writing code.

- Done when the owner approves the plan.

### Phase 1: data and layout

Write the pure modules and their tests, delete the first design, and stand the continent up as terrain with grey proxies.

- Done when every command passes, the hole frames Kunlun's crown at both sizes, and no name from the first design is left in `src/`.

### Phase 2: the generator and the first model

Build the generator, registry, `checkModel()` and preview page, then one model that sets the quality bar: suggest Yan, which carries most of the art direction.

Stop, show the owner Yan in the preview page with its numbers, and wait for approval before building any other model.

- Done when `pnpm models yan` is deterministic, passes the contract within budget, the preview page is absent from `dist`, and the owner approves.

### Phase 3: the rest of the models

Build Kunlun, the tenth carriage, the dome and the city; then the other Sanzuwu; then the Ring; then the Ice; then the beasts, showing the owner each group.

- Done when every model passes the contract within budget and is approved.

### Phase 4: the scene and the camera

Assemble both layers, instancing, the camera curve, the framing, and the low, software and reduced motion paths.

- Done when the rest view matches the plan at both sizes, zoom runs from planet to Ring without depth fighting, budgets hold, and Lighthouse stays at 0.9 or more.

### Phase 5: the day shift and Yiwan

Add the day shift, the bell, the ice creep, the Yiwan schedule and the director's new cast.

- Done when a full cycle runs, opening a hex stages a nearby show, and tests prove no event breaks the list of things never shown.

### Phase 6: polish and performance

Tune the palette and composition against the sheet, measure, regenerate the baselines and update `AGENTS.md`.

- Done when every command passes, budgets are reported, and the owner has your list of suggestions made and questions still open.

## Out of scope

- Other continents.
- Characters: no named person and no figure close enough to read as one; crowds and caravans stay distant and faceless.
- The interiors of Shangri-La and Chang'e.
- Story beyond Yiwan, earlier eras played back, and answers to the bible's open threads.
- Changes to the hex sheet beyond what the world needs.

## Ask the owner

- Which triad is home in Yiwan, and whether Ri'er and Rishi fly.
- Whether anything of the slag fields is left to model.
- Whether the zoom limits may change, and whether any dependency, runner or decoder may be added.
- Anything that would add a fact rather than a shape.
