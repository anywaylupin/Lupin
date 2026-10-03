export interface Point {
  x: number;
  y: number;
}

export type Axial = readonly [q: number, r: number];

export const SQ3 = Math.sqrt(3);

/** Pointy-top neighbour order; `ring` walks it and the hole edges index into it. */
export const DIRS: readonly Axial[] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

export function keyOf(q: number, r: number): string {
  return `${q},${r}`;
}

export function parseKey(key: string): Axial {
  const [q = 0, r = 0] = key.split(",").map(Number);
  return [q, r];
}

export function ax(q: number, r: number, size: number): Point {
  return { x: size * SQ3 * (q + r / 2), y: size * 1.5 * r };
}

export function axDist(q1: number, r1: number, q2: number, r2: number): number {
  const dq = q1 - q2;
  const dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/**
 * Cube rounding: the component that moved furthest when rounded is rebuilt from the other two.
 * Adding zero turns a rounded -0 into 0, otherwise `Object.is` based tests and set lookups disagree with `keyOf`.
 */
export function toAxial(x: number, y: number, size: number): Axial {
  const q = ((SQ3 / 3) * x - y / 3) / size;
  const r = ((2 / 3) * y) / size;
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return [rq + 0, rr + 0];
}

export function hexVerts(x: number, y: number, size: number, rot = 0): Point[] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30) + rot;
    return { x: x + size * Math.cos(a), y: y + size * Math.sin(a) };
  });
}

export function inPoly(pt: Point, v: readonly Point[]): boolean {
  let inside = false;
  let j = v.at(-1);
  for (const i of v) {
    if (j && i.y > pt.y !== j.y > pt.y && pt.x < ((j.x - i.x) * (pt.y - i.y)) / (j.y - i.y) + i.x) inside = !inside;
    j = i;
  }
  return inside;
}

export function ring(k: number): Axial[] {
  if (k === 0) return [[0, 0]];
  const out: Axial[] = [];
  let q = -k;
  let r = k;
  for (const [dq, dr] of DIRS) {
    for (let s = 0; s < k; s++) {
      out.push([q, r]);
      q += dq;
      r += dr;
    }
  }
  return out;
}

/** Points along a closed polygon every `step` of an edge, so a jittered stroke has enough joints to crawl. */
export function perimeter(v: readonly Point[], step: number): Point[] {
  const pts: Point[] = [];
  for (let s = 0; s < v.length - 1e-6; s += step) {
    const e = Math.floor(s);
    const t = s - e;
    const a = v[e];
    const b = v[(e + 1) % v.length];
    if (a && b) pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return pts;
}

export function lerpPts(a: Point, b: Point, n: number): Point[] {
  return Array.from({ length: n + 1 }, (_, k) => ({ x: a.x + (b.x - a.x) * (k / n), y: a.y + (b.y - a.y) * (k / n) }));
}

export interface HexRange {
  r0: number;
  r1: number;
  q: (r: number) => readonly [number, number];
}

/** Axial rows and columns covering the screen at camera offset (ox, oy) and zoom z, with a one hex margin. */
export function visibleRange(z: number, ox: number, oy: number, W: number, H: number, R: number): HexRange {
  return {
    r0: Math.floor(-oy / z / (1.5 * R)) - 1,
    r1: Math.ceil((H - oy) / z / (1.5 * R)) + 1,
    q: (r) => [Math.floor(-ox / z / (SQ3 * R) - r / 2) - 1, Math.ceil((W - ox) / z / (SQ3 * R) - r / 2) + 1],
  };
}
