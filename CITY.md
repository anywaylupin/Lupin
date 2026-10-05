# City plan

The design for the city behind the sheet, agreed before building.
It replaces the first three.js city, which stays in the tree as the base until each phase below lands.

## Decisions

1. The camera sits a little high: the upper city on its high ground fills the top of the screen, and the undercity below it is visible through gaps, shafts and broken ground.
2. The sheet pans over an area larger than the screen, about three by three screens.
3. Fixed hexes form a frame one hex thick around the edge of that area, and everything beyond it is fixed too; every hex inside the frame can be pulled.
4. The pre-broken hole stays.
5. Content hexes sit over filler; every other hex reveals a place of its own.
6. A plain hex can turn into a glass hex instead of being torn out.
7. The dome is a full sphere with an LED skin that shows a face, and it opens to show a different world inside.
8. Dome faces are original characters, never existing ones.
9. Pirates and wizards join the city as places, events, ships and sky effects, all original designs.
10. Every building is generated in code; no models, no Blender, no asset files beyond canvas textures drawn at runtime.
11. Bloom is on by default, with a low graphics switch in the settings panel for weak devices.
12. Billboards show the owner's projects and the city's own easter eggs, switching with a glitch.

## The two levels

The city is built in two levels with their own character, so a hex high on the screen and a hex low on the screen show different worlds.

**The upper city** stands on high ground: temple terraces, glass towers crowned with pagoda roofs, lotus ponds, sky bridges and the dome.
It is clean, bright and crowded with screens.

**The undercity** runs below the high ground: canals, a hidden harbour, pipes, foundries, night markets lit by lanterns and subway lines that run through the base of the towers.
It is dark, wet and busy, and the pirates live here.

The ground between them is never a flat plane with roads on it.
Streets are hard to see: they sit deep in canyons and fog, and the upper city's plazas hide them from above.
Shafts, collapsed plazas, elevator wells and the waterfall gorge are the places where the undercity shows through.

## Landmarks

A landmark is one building with its own design, made by its own function in code, standing on its own plot and owning one event.
Filler buildings fill the far background and repeat; landmarks never repeat.
Most landmarks are very tall, and they stand close enough to crowd each other while each keeps its own silhouette.

| Landmark          | Level | What it is                                                                         | Its event                                                    |
| ----------------- | ----- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| The dome          | Upper | A full sphere with an LED skin, wider than any tower                               | Changes face; opens to show a world inside                   |
| One pillar shrine | Upper | A small temple on a single pillar, rising from a lotus pond on a raised terrace    | Lotus pads light up in a ripple and petals lift into the air |
| Waterfall tower   | Both  | Terraces that pour water down a gorge into the undercity                           | The flow surges, mist rolls up and a rainbow of neon forms   |
| Rail tower        | Both  | A tower with a subway line running straight through its middle floors              | A train bursts through, lighting each floor as it passes     |
| Elevator spine    | Both  | Glass elevator tubes climbing the outside of a tower from the undercity to the top | Cars race each other up and down                             |
| Screen tower      | Upper | One giant animated billboard wrapping two faces                                    | Takes over with a full glitch and a project reveal           |
| Unfinished tower  | Upper | A bare steel frame with a crane on top                                             | The crane hoists a beam while welders spit sparks            |
| Temple megatower  | Upper | A skyscraper crowned with stacked temple roofs                                     | The crown's bell rings with a ring of light                  |
| Hanging garden    | Upper | A tower wrapped in bamboo and vines, with trees on every setback                   | Fireflies swarm out at dusk                                  |
| Data tower        | Upper | A windowless stack with heat vents                                                 | Vents blast steam and the stack flickers                     |
| Spaceship dock    | Upper | A rooftop cradle with landing lights                                               | The spaceship lands, refuels and lifts off                   |
| Wizard academy    | Sky   | A crooked stone tower floating free of the ground, ringed by orbiting books        | A spell lights every window and sends sparks up              |
| Night market      | Under | Stacked terraces of stalls under strings of lanterns                               | A lantern release climbs up past the high ground             |
| Pirate harbour    | Under | A hidden canal harbour inside a cave of pipes, with a moored ship                  | The ship fires a salute and the cave flashes                 |
| Foundry           | Under | Furnaces and chimneys feeding the towers above                                     | A pour of molten metal lights the whole cavern orange        |

## The dome

The dome is a full sphere standing on a ring of supports at the centre of the upper city, with an LED skin like a stadium screen.

**Faces.**
One face rig draws every character: eyes, lids, brows, mouth and colours, so a new character is a set of parameters.
Faces blink, follow the pointer or the hex torn most recently, and react to the city: surprise at lightning, delight at fireworks, sleep when the city is still.
Between faces the skin plays short pixel animations, then glitches into the next face.

Starting cast, all original:

| Face    | Look                                                  |
| ------- | ----------------------------------------------------- |
| Moji    | A round yellow face with expressive eyes, the default |
| Oni     | A red horned mask with tusks and burning eyes         |
| Mochi   | A soft white cat with a tiny mouth                    |
| Pip     | A small round creature with big ears and cheek sparks |
| Bolt    | A boxy robot with scanline eyes                       |
| Captain | A skull in a pirate hat, one eye behind a patch       |
| Sage    | An old owl in a pointed hat and round glasses         |
| Ember   | A small dragon with a flickering flame for a crest    |

**Worlds inside.**
When the hex over the dome is pulled or turned to glass, the face closes its eyes and the skin clears from the centre out, showing a world inside.
Each opening picks a world at random, never the same one twice in a row, and the skin closes again after half a minute or when the hex is covered.

| World          | What plays inside                                                   |
| -------------- | ------------------------------------------------------------------- |
| Forest falls   | A mossy valley with a waterfall, birds and drifting pollen          |
| Desert         | Dunes under a huge moon, a caravan crossing, a sandstorm rolling in |
| Concert        | A stage with lasers, a crowd of lights and a bass pulse             |
| Reef           | Coral, koi and a whale passing overhead                             |
| Tundra         | Snow, an aurora and a lone lighthouse                               |
| Pirate cove    | A galleon riding a storm, lightning on the sails                    |
| Great library  | Endless shelves, floating candles and books flying between them     |
| Volcano        | A lava lake, ash and a slow eruption                                |
| Blossom garden | Cherry trees, a red bridge and petals in the wind                   |
| Deep space     | A planet rising over a station window, with a meteor shower         |

## Pirates and wizards

Both are original designs that nod to their genres; nothing is taken from existing books, films or games.

**Pirates.**
The pirate harbour lives in the undercity.
A sky galleon with neon sails sometimes crosses the upper city, and the spaceship chases it off.
Billboards show wanted posters for its captain, and the captain is one of the dome's faces.

**Wizards.**
The wizard academy floats above the upper city, with books orbiting its tower.
Broom riders race between the towers as an event.
At night the stars sometimes join into constellations that draw an animal, a ship or a hex, then scatter.
A glowing spirit animal sometimes runs across the rooftops and vanishes.
Floating candles drift over the night market.

## Sky and movement

- **Spaceship:** it hovers and drifts over the city, cloaks at random with a shimmer and a fade, and reappears somewhere else; it docks at the spaceship dock as an event.
- **Tubes:** glass tubes in three kinds: road tubes carrying capsules between towers, line tubes for maglev loops through the upper city, and elevator tubes climbing towers from the undercity to the top.
- **Weather:** rain, lightning that strikes the tallest landmarks, and fog that pools in the undercity.
- **Bees:** the swarms stay, and carry hexes home on Reset as they do now.
- **Searchlights** sweep from the tallest towers.

## The sheet

**Area and frame.**
The sheet pans over about three by three screens.
A frame one hex thick sits at the edge of that area, and every hex beyond the frame is fixed.
The bolted hexes over the corner buttons stay bolted.
The pre-broken hole stays where it is.

**Places.**
Each cell inside the frame is cast into the city from its centre at rest.
Content cells are placed over filler, so the content never hides anything that matters.
Every other cell is given one place: a landmark, a corner of a landmark, a window into the undercity, or a stretch of sky where events happen.
Panning shifts the city a little against the sheet, so places are composed with room around them rather than to the pixel.

**Glass hexes.**
Double click a plain hex, or double tap it on a touch screen, and it turns to glass instead of tearing out.
Glass shows the city through a faint tint with a bright edge, a light streak that sweeps across it, and raindrops running down it when it rains.
Double click a glass hex to turn it back; Reset clears all glass along with the torn hexes.
Glass is decorative like dragging, so the keyboard path stays Reset in the settings panel.

## Billboards

Billboards are canvas textures drawn at runtime that switch every few seconds with a glitch: torn slices, colour splits and a frame of noise.

- **Projects:** Juka, Ora, Upstream and QR pay, each as an advert with its name and one line.
- **Easter eggs:** a wanted poster for the pirate captain, enrolment open at the wizard academy, a lost bee reward, the dome's face of the week, a spaceship sightings hotline, a reward for whoever finds every place.

The screen tower plays the same set at a much larger size, with a full takeover glitch as its event.

## Graphics

**Bloom** runs on the full quality setting.

**Low graphics** is a new switch in the settings panel, saved with the other preferences.
It turns bloom off, renders at device pixel ratio 1, thins particles and filler, and drops the glass hex effects to a plain tint.
It switches itself on for software rendering, which is what Lighthouse and the headless tests use, and the visitor can switch it either way.

Everything stays procedural: geometry built in code, textures drawn on canvases at runtime.

## Phases

1. **Sheet:** the larger area, the frame, cell to place mapping and glass hexes.
2. **Ground and camera:** the high camera, the two levels, the openings into the undercity and the fog.
3. **Dome:** the sphere, the face rig with the starting cast, and the worlds inside.
4. **Landmarks:** one at a time, each with its event, upper city first.
5. **Movement:** tubes, the spaceship, the sky galleon, broom riders and constellations.
6. **Billboards:** projects and easter eggs with the glitch.
7. **Graphics:** bloom, the low graphics switch, tests and new visual baselines.

Each phase ends with format, lint, type checks, unit tests and a commit.

## Open questions

1. Is double click the right gesture for glass, or should glass be a mode switched on in the settings panel?
2. Should the dome's worlds also open on their own now and then, or only when the dome's hex is opened?
3. Can content hexes turn to glass too, or only plain hexes?
