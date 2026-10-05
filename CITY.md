# City plan

The design for the city behind the sheet, second version.
It replaces the first design entirely; only the names, the pirates and wizards, the split between undercity and high ground, and the bees carry over.
The code in `src/hive/city/` still follows the first design until the phases below rebuild it.

## Direction

A sleek sci-fi megacity packed as tight as Manhattan, on one flat ground.
Every tower is two worlds stacked: its lower third is the undercity, its upper part the high ground.
Lumen is one of the buildings, not the centre of anything.

| Influence          | What it brings                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Akira              | Scale and speed: light-trail bikes in the street canyons, huge signage, a city under pressure in its scenarios           |
| Edgerunners        | Graphic punch: hot pink and yellow neon against graphite, loud holograms and ads down in the alleys                      |
| Arcane             | The class split, turned vertical: clean high ground on the decks and towers, a chem-lit undercity in the streets beneath |
| Chongqing, Chengdu | A 3D city: skybridges, escalators and lifts between towers; Lantern Steps follows Hongyadong                             |

Palette: graphite, white, brushed silver and smoked glass up high, with cyan and amber as the light accents; warm clutter and hot neon below the deck.
Lit windows come in floor bands, never random dots.

## Layout

- **One flat ground, packed tight.** A dense street grid like New York, towers filling their lots, streets narrow. The view shows only city: no edge, no outskirts, no horizon line.
- **The split.** The bottom third of every tower is the undercity: shopfronts, pipes, signs, steam. Above it the high ground starts: clean glass, white cladding, gardens.
- **The deck line.** At that third, plazas and bridges join neighbouring towers into the high ground. The undercity shows only beneath the decks and between the buildings.
- **Getting around.** Bridges at the deck and higher, glass tubes, escalators up to terraces, lifts, and portals that link rooftops across the city.
- **Heights.** Towers stand within a narrow band of each other, so the skyline reads as one mass and every landmark still shows its crown.
- **Camera.** Looking down at a steep angle so streets and decks show. Panning the hex sheet moves across the grid and turns it a little, so towers show more than one face.

## Lumen

A building like any other on the grid, filling a two by two block, shaped like the Las Vegas Sphere: an undercity podium to the deck line, a sphere sunk about a fifth into it, a glowing seam, and an LED skin over the whole ball.

- **A small face.** Just eyes and a mouth in bright LED on a dark skin: no cheeks, no full-ball emoji. Small enough to move round the sphere like a character living on it.
- **Where it goes.** Most of the time it sits near the top and follows the pointer. Now and then it slides down the side to peer into the street below, looks around, and climbs back up.
- **The rest of the skin.** Dark LED with slow colour waves, and a ticker band round the middle carrying the owner's projects and city messages.
- **Moods.** The face follows the world state: it smiles in peace, cheers at festivals, hides low on the ball during an invasion, trembles at the dark force, frowns in civil war and sleeps at night.

## Landmarks

| Name             | Where    | Design                                                 | Everyday event                                   |
| ---------------- | -------- | ------------------------------------------------------ | ------------------------------------------------ |
| Lumen            | Two lots | LED sphere with a roaming face                         | Follows the pointer; peeks into the street       |
| Kaleido          | Tower    | Slab wrapped by two curved screens                     | Ad takeover lands on one of the owner's projects |
| Bell Crown       | Tower    | Graphite tower crowned with stacked metal temple roofs | The bell rings a ring of light across the sky    |
| Ironbloom        | Tower    | Half built: solid base, white steel lattice, crane     | The crane hoists a beam while welders spark      |
| Bamboo Veil      | Tower    | Green vertical fins and sky gardens                    | Fireflies pour out of the gardens                |
| Steamvault       | Tower    | Windowless ribbed data stack with vents                | Vents blast a column of steam                    |
| Starberth        | Tower    | Rooftop landing cradle                                 | The Wanderer lands and lifts off                 |
| Lotus Pillar     | Deck     | One-pillar shrine in a lotus pond on a deck plaza      | Pads light in a ripple, petals lift              |
| Silverfall       | Both     | Tower pouring a waterfall from the deck to the street  | The falls surge and a neon rainbow forms         |
| Threadline       | Both     | Tower the maglev runs straight through                 | An express bursts through, floors light in turn  |
| Ascender         | Both     | Glass lifts from the street to the roof                | The lifts race to the top                        |
| Lantern Steps    | Street   | Hongyadong-style stacked terraces under the deck       | A flight of sky lanterns rises between towers    |
| Rust Cove        | Street   | Pirate harbour on the one canal street                 | The galleon fires a salute                       |
| The Crucible     | Street   | Foundry glowing orange and chem green in a back alley  | A pour of molten metal lights the alley          |
| Owlspire Academy | Sky      | Floating rock with a crooked spire, books in orbit     | A spell lights every window and showers sparks   |

The ships keep their names: the Wanderer, a spaceship that cloaks, and the Night Kite, the pirates' sky galleon.

## World state

The city reads one world state with three independent axes, so new times, seasons and storylines are data, not new code.
Each axis changes the sky, the light, the particles, which events may run, and Lumen's mood.

- **Time:** day, blue hour and night, later dawn and dusk; it can follow the visitor's clock.
- **Season:** spring petals, summer fireflies and fireworks, autumn leaves and amber gardens, winter snow on every roof; it can follow the calendar.
- **Scenario:** peace, festival, alien invasion, dark force and civil war; set by hand or on a schedule, such as an invasion one week a year.

## Events

| Scenario       | Events                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Peace          | Light-trail bikes racing the street canyons, maglev express, commuters through the portals, broom race between rooftops, Night Kite smuggling run, each landmark's own event |
| Festival       | Fireworks between the towers, lantern flights out of the alleys, a countdown shared by Kaleido and Lumen, a dragon of drones weaving along the bridges                       |
| Alien invasion | A mothership over the grid, tractor beams lifting cars off the bridges, rooftop turrets firing, the Wanderer decloaking to fight, Lumen's face hiding low                    |
| Dark force     | A crimson sky, shadow fog rising out of the streets up to the decks, Owlspire's shield over the rooftops, wizard duels across the bridges                                    |
| Civil war      | The deck line becomes a front: barricades on the bridges, fires and smoke in the streets, searchlights from Bell Crown, pirates raiding the lifts                            |

Behind every hex: a torn or glass hex asks the director for the nearest event, and the scenario decides which ones are allowed.

## Models

- Generated as `.glb` files by a script in the repo, in a stylised smooth style: bevelled edges, curved forms, physically based metal, glass and concrete.
- One file per landmark plus a small kit for fillers, vehicles and props, each named after its landmark so a hand-made model can replace it later.
- Every model gets a preview page to rotate and approve before it goes into the site.

## Phases

1. **Blockout:** the concept model, to agree the grid, the deck line, heights and mood. Done as an interactive preview.
2. **Model generator:** the `.glb` pipeline and the first landmark as the quality bar.
3. **Models:** the remaining landmarks, Lumen, ships, the tower kit and the links, each approved in the preview.
4. **City:** the grid, the camera, the world state and Lumen's face in the site.
5. **Events:** the director, everyday events, then the scenarios.
6. **Polish:** low graphics, tests and visual baselines.

## Open questions

1. Is a third of the tower height the right line between undercity and high ground, or closer to half?
2. Should the camera stay at a steep angle, or come down lower so the towers rise up in front of the viewer?
3. Should Lumen keep the worlds inside the sphere as an occasional show?
4. Which landmark should be modelled first as the quality bar for the rest?
