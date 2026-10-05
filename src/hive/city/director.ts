import type { Rand } from "../math";
import type { Lumen } from "./dome";
import type { Landmark } from "./landmark";
import type { Life } from "./life";
import type { Magic } from "./magic";
import { chooseFor, DOME, type Candidate, type Ndc, type Vec3 } from "./plan";
import type { Ships } from "./ships";
import type { Sky } from "./sky";

/** Everything the director can set in motion. */
export interface Cast {
  landmarks: readonly Landmark[];
  lumen: Lumen;
  life: Life;
  magic: Magic;
  sky: Sky;
  ships: Ships;
}

/** How the director finds its way round the screen: the world point behind a screen point, and the screen point of a world point. */
export interface Lens {
  at: (n: Ndc, dist: number) => Vec3;
  project: (v: Vec3) => Ndc | null;
  /** Screen points where the city shows through the sheet right now. */
  open: () => Ndc[];
}

export interface Director {
  /** Advances on life time; `clock` is the city's wall clock and `weatherT` its weather time, for lightning. */
  step: (dt: number, clock: number, weatherT: number) => void;
  /** A hex just opened here; the next event is staged behind it within half a second. */
  reveal: (at: Ndc) => void;
}

type Show = Candidate & { run: (spot: Ndc, weatherT: number) => void };

/**
 * Stages the city's events: every few seconds of life time it picks a spot where the city shows through the sheet, preferring a hex that just opened,
 * and runs the landmark event nearest that spot, or failing that the staged show that waited longest.
 * So a hex torn anywhere on the screen soon shows something happening behind it.
 */
export function createDirector(c: Cast, lens: Lens, rand: Rand): Director {
  const { at } = lens;
  const show = (id: string, run: Show["run"]): Show => ({ id, at: null, last: -99, run });
  const shows: Show[] = [
    ...c.landmarks.map((l) => show(l.id, () => l.trigger())),
    show("lumen", () => c.lumen.open()),
    show("fireworks", (s) => {
      c.life.fireworks(at(s, 900 + rand() * 600));
      c.lumen.react("happy");
    }),
    show("lanterns", (s) => c.life.lanterns(at({ x: s.x, y: s.y - 0.3 }, 700 + rand() * 500))),
    show("dragon", (s) => {
      const side = rand() < 0.5 ? -1 : 1;
      const d = 700 + rand() * 600;
      c.life.dragon(at({ x: -1.4 * side, y: s.y }, d), at({ x: 1.4 * side, y: s.y + (rand() - 0.5) * 0.5 }, d));
    }),
    show("stars", (s) => (s.y > 0 ? c.magic.constellation(at(s, 4200)) : c.life.fireworks(at(s, 1000)))),
    show("lightning", (s, w) => void c.sky.strike(at(s, 1600), w)),
    show("raid", () => c.ships.raid()),
    show("race", () => c.magic.race()),
    show("spirit", (s) => c.magic.spirit(at({ x: -1.3, y: s.y }, 1500), at({ x: 1.3, y: s.y + 0.1 }, 1500))),
  ];
  const anchors = new Map<string, Vec3>(c.landmarks.map((l) => [l.id, l.anchor]));
  anchors.set("lumen", { x: DOME.x, y: DOME.y, z: DOME.z });
  const reveals: Ndc[] = [];
  let next = 3;
  return {
    reveal: (n) => {
      reveals.push(n);
      if (reveals.length > 4) reveals.shift();
      next = Math.min(next, 0.4);
    },
    step: (dt, clock, weatherT) => {
      next -= dt;
      if (next > 0) return;
      next = 2.5 + rand() * 2;
      const open = lens.open();
      const spot = reveals.shift() ??
        open[Math.floor(rand() * open.length)] ?? { x: (rand() - 0.5) * 1.6, y: (rand() - 0.5) * 1.6 };
      for (const s of shows) {
        const a = anchors.get(s.id);
        s.at = a ? (lens.project(a) ?? { x: 9, y: 9 }) : null;
      }
      const chosen = shows[chooseFor(spot, shows, clock)];
      if (!chosen) return;
      chosen.last = clock;
      chosen.run(spot, weatherT);
    },
  };
}
