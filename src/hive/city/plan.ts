import type { Point } from "../hex";

/**
 * Where every hero piece of the city stands, shared by the bake (static structure) and the live layers (what moves on it).
 * Board units; the hole shows a window around FOCUS (960, 430): about x 670 to 1250 on desktop and x 830 to 1090 on phones.
 * FOCUS sits right of the board's centre because desktops show the hole near the right edge, and the board must still reach the left edge of the screen.
 * The dome takes the centre so phones see it whole; everything else frames it inside the desktop window, with fillers beyond for panning.
 * The right twin tower is still being built: solid to `builtTo`, bare frame above, with the crane on top.
 */
export const PLAN = {
  dome: { x: 960, y: 600, rx: 150, ry: 150 },
  twin: { x: 630, w: [70, 62], gap: 34, tops: [250, 300], bridgeY: 336, builtTo: 388, craneTop: 190 },
  cylinder: { x: 1160, r: 36, top: 236 },
  arcology: { x: 490, w: 270, top: 540 },
  pagoda: { x: 1160, w: 150, top: 470 },
  cantilever: { x: 1322, w: 200, top: 560 },
  antennas: { x: 996, w: 150, top: 716 },
  mega: { x: 270, w: 210, top: 500 },
  connector: { x: 766, w: 228, top: 742 },
  tube: [
    { x: 756, y: 624 },
    { x: 880, y: 712 },
    { x: 1060, y: 712 },
    { x: 1164, y: 646 },
  ],
  coaster: { x: 1160, helixTop: 300, helixBottom: 540, helixR: 50, loopX: 1238, loopY: 492, loopR: 44 },
  portals: { a: { x: 720, y: 372 }, b: { x: 1272, y: 292 } },
  perches: { pagoda: { x: 1235, y: 452 }, arcology: { x: 612, y: 520 } },
  swing: { anchor: { x: 798, y: 404 }, len: 170 },
  platforms: [
    { x: 800, y: 214, w: 110 },
    { x: 1062, y: 242, w: 96 },
  ],
} as const;

/**
 * The power star sits in the top right of what desktops see through the hole.
 * On phones the hole opens below the content and only its upper middle is clear, so the star moves there, just above the dome.
 */
export function starAt(portrait: boolean): Point {
  return portrait ? { x: 1040, y: 366 } : { x: 1172, y: 140 };
}

/** A point on a cubic Bezier through four control points. */
export function bezier(p: readonly Point[], t: number): Point {
  const [a, b, c, d] = p;
  if (!a || !b || !c || !d) return { x: 0, y: 0 };
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

/**
 * The rollercoaster track as one closed circuit: three turns down a helix around the cylinder tower, across into a vertical loop, then a lift hill back to the top.
 * `side` is how far round the tower a point is, -1 behind to 1 in front, so the train can pass behind it.
 */
export function coasterAt(t: number): Point & { side: number } {
  const c = PLAN.coaster;
  const u = ((t % 1) + 1) % 1;
  const loopBottom = { x: c.loopX, y: c.loopY + c.loopR };
  if (u < 0.55) {
    const k = u / 0.55;
    const a = k * Math.PI * 6;
    return { x: c.x + Math.sin(a) * c.helixR, y: c.helixTop + (c.helixBottom - c.helixTop) * k, side: Math.cos(a) };
  }
  if (u < 0.62) {
    const k = (u - 0.55) / 0.07;
    return { x: c.x + (loopBottom.x - c.x) * k, y: c.helixBottom + (loopBottom.y - c.helixBottom) * k, side: 1 };
  }
  if (u < 0.82) {
    const a = Math.PI / 2 - ((u - 0.62) / 0.2) * Math.PI * 2;
    return { x: c.loopX + Math.cos(a) * c.loopR, y: c.loopY + Math.sin(a) * c.loopR, side: 1 };
  }
  const k = (u - 0.82) / 0.18;
  return { x: loopBottom.x + (c.x - loopBottom.x) * k, y: loopBottom.y + (c.helixTop - loopBottom.y) * k, side: 1 };
}
