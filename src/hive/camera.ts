import { clamp } from "./math";
import type { Point } from "./hex";

export interface Cam {
  x: number;
  y: number;
  z: number;
}

export interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface Bounds {
  lo: Point;
  hi: Point;
  mid: Point;
  fits: { x: boolean; y: boolean };
}

/** Zooms in log space and moves by how far the zoom has progressed, so the target cell stays under the camera instead of sliding past it. */
export function camLerp(a: Cam, b: Cam, f: number): Cam {
  const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * f);
  const w = Math.abs(a.z - b.z) < 1e-6 ? f : (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, z };
}

/** The camera centres a sheet's home area may take at zoom z; when the area is smaller than the screen it fits and stays centred. */
export function bounds(r: Rect, z: number, W: number, H: number): Bounds {
  const lo = { x: r.x0 + W / 2 / z, y: r.y0 + H / 2 / z };
  const hi = { x: r.x1 - W / 2 / z, y: r.y1 - H / 2 / z };
  const mid = { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 };
  return { lo, hi, mid, fits: { x: lo.x >= hi.x, y: lo.y >= hi.y } };
}

export function restOf(r: Rect, c: Cam, W: number, H: number): Point {
  const b = bounds(r, c.z, W, H);
  return {
    x: b.fits.x ? b.mid.x : clamp(c.x, b.lo.x, b.hi.x),
    y: b.fits.y ? b.mid.y : clamp(c.y, b.lo.y, b.hi.y),
  };
}

/** Pans past the home area stretch at a third of the pointer speed, then spring back on release. */
export function rubber(v: number, lo: number, hi: number): number {
  if (v < lo) return lo - (lo - v) * 0.35;
  if (v > hi) return hi + (v - hi) * 0.35;
  return v;
}
