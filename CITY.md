# City plan

The design for the city behind the sheet, second version.
It replaces the first design entirely; only the names, the pirates and wizards, the two levels and the bees carry over.
The code in `src/hive/city/` still follows the first design until the phases below rebuild it.

## Direction

A sleek sci-fi megacity at blue hour, split in two: a polished upper city on a raised plateau and a dense, glowing undercity in the canyon around it.
Fewer buildings, all of similar height, spaced so each one can be seen from every side.

| Influence   | What it brings                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| Akira       | Scale and speed: a ring road of red light trails, huge plazas, Lumen as the stadium landmark             |
| Edgerunners | Graphic punch: hot pink and yellow neon used sparingly against graphite, loud holograms and ads          |
| Arcane      | The class split: a clean high ground over a chem-lit undercity, linked by lifts, bridges and a waterfall |
| Hongyadong  | Lantern Steps: stacked timber terraces glowing gold down a cliff face, after the Chongqing landmark      |

Palette: graphite, white, brushed silver and smoked glass, with cyan and amber as the light accents and pink kept for signs.
Lit windows come in floor bands, never random dots.

## Layout

- **Plateau.** Round high ground with Lumen at its centre and the upper landmarks in a ring round it, each on its own plaza with clear space around.
- **Canyon.** The undercity surrounds the plateau below the cliff: canals, Lantern Steps, Rust Cove and The Crucible. Three edge landmarks climb from the canyon floor past the cliff top.
- **Heights.** Upper landmarks stand within about 15% of each other, so no tower hides another. Only Lumen, which is wider, and Owlspire, which floats, break the line.
- **Fillers.** Only a thin, low, hazy ring far out, for depth. Nothing between the landmarks.
- **Camera.** A little high, so the ground shows. Panning the hex sheet orbits the camera round Lumen, so every face of every building comes into view; panning down drops the camera into the canyon.

## Lumen

Modelled on the Las Vegas Sphere: a full sphere sunk about a fifth into its plaza, a glowing seam where it meets the ground, and an LED skin that wraps the whole ball.
It turns slowly to face the viewer.

- **The face.** A chubby, funny face that fills the sphere the way the Sphere's emoji does: puffy pink cheeks, small bright eyes, a wide grin. It blinks, puffs its cheeks, sticks out its tongue, yawns and dozes off at night.
- **The programme.** The face alternates with whole-ball shows every 20 to 40 seconds: the giant eye, a planet, an advert for one of the owner's projects, a city message. Shows change with a wipe, not a glitch.
- **Moods.** The face follows the world state: it grins in peace, cheers at festivals, sweats at aliens, trembles at the dark force, frowns in civil war and wears snow in winter.

## Landmarks

| Name             | Level     | New design                                              | Everyday event                                   |
| ---------------- | --------- | ------------------------------------------------------- | ------------------------------------------------ |
| Lumen            | Centre    | LED sphere sunk into the plateau                        | Changes show; reacts to the city                 |
| Kaleido          | Upper     | Rounded slab wrapped by two curved screens              | Ad takeover lands on one of the owner's projects |
| Bell Crown       | Upper     | Graphite tower crowned with stacked metal temple roofs  | The bell rings a ring of light across the sky    |
| Ironbloom        | Upper     | Half built: solid base, white steel lattice, crane      | The crane hoists a beam while welders spark      |
| Bamboo Veil      | Upper     | Tower of green vertical fins and sky gardens            | Fireflies pour out of the gardens                |
| Steamvault       | Upper     | Windowless ribbed data stack with vents                 | Vents blast a column of steam                    |
| Starberth        | Upper     | Tower with a round rooftop landing cradle               | The Wanderer lands and lifts off                 |
| Lotus Pillar     | Upper rim | One-pillar shrine rising from a lotus pond              | Pads light in a ripple, petals lift              |
| Silverfall       | Edge      | Terraced tower pouring a waterfall into the canyon      | The falls surge and a neon rainbow forms         |
| Threadline       | Edge      | Tower the maglev ring runs straight through             | An express bursts through, floors light in turn  |
| Ascender         | Edge      | Slender tower with glass lifts from canyon to sky       | The lifts race to the top                        |
| Lantern Steps    | Under     | Hongyadong-style stacked terraces on the cliff          | A flight of sky lanterns rises past the plateau  |
| Rust Cove        | Under     | Pirate harbour under pipe arches on the canal           | The galleon fires a salute                       |
| The Crucible     | Under     | Foundry of furnaces and chimneys, chem green and orange | A pour of molten metal lights the canyon         |
| Owlspire Academy | Sky       | Floating rock with a crooked spire, books in orbit      | A spell lights every window and showers sparks   |

The ships keep their names: the Wanderer, a spaceship that cloaks, and the Night Kite, the pirates' sky galleon.

## World state

The city reads one world state with three independent axes, so new times, seasons and storylines are data, not new code.
Each axis changes the sky, the light, the particles, which events may run, and Lumen's mood.

- **Time:** day, blue hour and night, later dawn and dusk; it can follow the visitor's clock.
- **Season:** spring petals, summer fireflies and fireworks, autumn leaves and amber gardens, winter snow on every roof; it can follow the calendar.
- **Scenario:** peace, festival, alien invasion, dark force and civil war; set by hand or on a schedule, such as an invasion one week a year.

## Events

| Scenario       | Events                                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Peace          | Light-trail bike race on the ring road, maglev express, drone light show, broom race round Owlspire, Night Kite smuggling run, the Wanderer cloaking, every landmark's own event |
| Festival       | Fireworks over the plateau, lantern flights from Lantern Steps, a countdown shared by Kaleido and Lumen, a dragon of drones round Lumen, parade boats on the canal               |
| Alien invasion | A mothership parts the clouds, tractor beams lift cars, rooftop turrets on Starberth and Ironbloom fire, the Wanderer decloaks to fight, Lumen sweats and flashes warnings       |
| Dark force     | The sky turns crimson, shadow fog climbs out of the undercity, Owlspire raises a shield dome, wizards duel on the rooftops, lights go out district by district                   |
| Civil war      | Barricades glow on the bridges, fires and smoke in the canyon, searchlights from Bell Crown, pirates raid the lifts, enforcer flyers sweep the cliff                             |

Behind every hex: a torn or glass hex asks the director for the nearest event, and the scenario decides which ones are allowed.

## Models

- Generated as `.glb` files by a script in the repo, in a stylised smooth style: bevelled edges, curved forms, physically based metal, glass and concrete.
- One file per landmark plus a small kit for fillers, vehicles and props, each named after its landmark so a hand-made model can replace it later.
- Every model gets a preview page to rotate and approve before it goes into the site.

## Phases

1. **Blockout:** the concept model, to agree positions, heights and mood. Done as an interactive preview.
2. **Model generator:** the `.glb` pipeline and the first landmark as the quality bar.
3. **Models:** the remaining landmarks, Lumen, ships and the filler kit, each approved in the preview.
4. **City:** plateau and canyon, the orbiting camera, the world state and Lumen's programme in the site.
5. **Events:** the director, everyday events, then the scenarios.
6. **Polish:** low graphics, tests and visual baselines.

## Open questions

1. Is the round plateau with the canyon round it the right shape, or should the high ground be a long cliff on one side?
2. Should time and season follow the visitor's real clock and calendar by default?
3. Do Lumen's worlds inside the sphere stay, as one of its shows, or go?
4. Which landmark should be modelled first as the quality bar for the rest?
