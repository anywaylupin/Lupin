import { lerp, type Rand } from "../math";

/** A point in the city, in world units of about a metre; y is up and the camera looks down negative z. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Building styles: the old town near the dome is temple halls and pagodas, the ring beyond it mixes them with neon towers, and the back is cyber high-rise.
 * A hybrid is a glass tower crowned with a pagoda roof, the one shape that belongs to both cities.
 */
export type Kind = "pagoda" | "hall" | "tower" | "hybrid" | "cylinder" | "mega";

export interface Building {
  kind: Kind;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  /** 0 pink, 1 cyan, 2 amber: the colour of its neon trim. */
  hue: 0 | 1 | 2;
  seed: number;
}

/** The dome stands at the origin, the centre of the city and of the screen at rest. */
export const DOME = { r: 70, plaza: 135 } as const;
/** The power star hangs above the dome; the beam joins them. */
export const STAR: Vec3 = { x: 0, y: 195, z: -40 };
/** The avenue runs from the camera to the dome, kept clear so nothing ever stands in front of it; torii gates span it. */
export const AVENUE = { half: 40, gates: [110, 200] } as const;
/** Block pitch; streets run on the half-pitch lines between blocks. */
export const CELL = 64;
/** Spans the city covers, wide enough that a full pan on a wide screen still shows rooftops at the edges. */
export const SPAN = { x: 1700, zNear: 230, zFar: -1700 } as const;

/** The camera at rest; phones get a wider lens so the dome is not all they see. */
export const VIEW = {
  eye: { x: 0, y: 210, z: 430 },
  target: { x: 0, y: 45, z: 0 },
  fov: (aspect: number) => (aspect < 1 ? 72 : 55),
} as const;

function pick<T>(rand: Rand, list: readonly T[]): T {
  const v = list[Math.floor(rand() * list.length)];
  if (v === undefined) throw new Error("pick from an empty list");
  return v;
}

/** True where a cell is outside the wedge the camera can ever see, so the city does not build what nobody looks at. */
function offView(x: number, z: number): boolean {
  return Math.abs(x) > 300 + (VIEW.eye.z - z) * 1.05;
}

/**
 * Heights rise with distance from the camera, so the skyline climbs toward the back and the foreground stays low enough to see over.
 * Megastructures only stand far back, where they frame the dome instead of hiding it.
 */
function heightAt(rand: Rand, x: number, z: number): { kind: Kind; h: number } {
  const dome = Math.hypot(x, z);
  const back = VIEW.eye.z - z;
  if (z > 110) return { kind: pick(rand, ["hall", "pagoda"] as const), h: 14 + rand() * 22 };
  if (dome < 330) {
    const kind = pick(rand, ["pagoda", "pagoda", "hall", "hybrid"] as const);
    return { kind, h: kind === "hall" ? 18 + rand() * 18 : 40 + rand() * 70 };
  }
  if (back > 950 && rand() < 0.08) return { kind: "mega", h: 300 + rand() * 200 };
  const kind = pick(rand, ["tower", "tower", "hybrid", "cylinder", "pagoda"] as const);
  const base = Math.min(1, back / 1700);
  const h = lerp(50, 230, base) * (0.5 + rand());
  return { kind, h: kind === "pagoda" ? Math.min(h, 140) : h };
}

/**
 * Lays out the whole city from a seed: one building per block, jittered inside its block, with plazas left empty here and there.
 * The dome's plaza and the avenue in front of it stay clear; two tall pagodas flank the dome as landmarks.
 */
export function planCity(rand: Rand): Building[] {
  const out: Building[] = [];
  for (let z = SPAN.zFar; z <= SPAN.zNear; z += CELL) {
    for (let x = -SPAN.x; x <= SPAN.x; x += CELL) {
      const cx = x + (rand() - 0.5) * 10;
      const cz = z + (rand() - 0.5) * 10;
      if (Math.hypot(cx, cz) < DOME.plaza + CELL / 2) continue;
      if (Math.abs(cx) < AVENUE.half + CELL / 2 && cz > 0) continue;
      if (offView(cx, cz) || rand() < 0.12) continue;
      const { kind, h } = heightAt(rand, cx, cz);
      const big = kind === "mega" ? 1.15 : kind === "hall" ? 0.6 + rand() * 0.2 : 0.5 + rand() * 0.25;
      out.push({
        kind,
        x: cx,
        z: cz,
        w: CELL * big,
        d: CELL * (kind === "hall" ? 0.6 : big),
        h,
        hue: pick(rand, [0, 1, 2] as const),
        seed: Math.floor(rand() * 1e9),
      });
    }
  }
  for (const side of [-1, 1]) {
    out.push({ kind: "pagoda", x: side * 205, z: -70, w: 46, d: 46, h: 190, hue: side < 0 ? 0 : 1, seed: 7 + side });
  }
  return out;
}

/** The fixed shrine inside the dome: a small three-tier pagoda the snow falls on. */
export const SHRINE: Building = { kind: "pagoda", x: 0, z: 0, w: 26, d: 26, h: 52, hue: 2, seed: 3 };

/** Tiers a pagoda of height h gets: three for a shrine, up to seven for the landmarks. */
export function tiersOf(b: Building): number {
  return Math.max(3, Math.min(7, Math.round(b.h / 28)));
}

/**
 * The flying dragon's spine: a straight run from `a` to `b` bent by an S curve up and sideways, so it reads as swimming through the air.
 * `u` runs 0 to 1 along the flight; segments behind the head pass a smaller `u`.
 */
export function serpent(a: Vec3, b: Vec3, u: number, amp: number): Vec3 {
  const w = Math.sin(u * Math.PI * 5);
  return {
    x: lerp(a.x, b.x, u),
    y: lerp(a.y, b.y, u) + w * amp + Math.sin(u * Math.PI) * amp * 0.8,
    z: lerp(a.z, b.z, u) + Math.cos(u * Math.PI * 5) * amp * 0.6,
  };
}

/**
 * The screen is cut into a three by three grid and each set piece takes the cell that has waited longest, so over a minute every corner of the screen sees something.
 * Returns the cell index; `last` holds when each cell was last used.
 */
export function nextCell(last: number[], now: number, rand: Rand): number {
  let best = 0;
  let age = -Infinity;
  last.forEach((t, i) => {
    const a = now - t + rand() * 2;
    if (a > age) {
      age = a;
      best = i;
    }
  });
  last[best] = now;
  return best;
}

/** The centre of a grid cell in normalised device coordinates, with a little jitter so repeats do not land on the same spot. */
export function cellNdc(cell: number, rand: Rand): { x: number; y: number } {
  const col = cell % 3;
  const row = Math.floor(cell / 3);
  return { x: (col - 1) * 0.66 + (rand() - 0.5) * 0.4, y: (1 - row) * 0.6 + (rand() - 0.5) * 0.3 };
}
