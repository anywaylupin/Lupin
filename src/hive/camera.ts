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

/** Wheel zoom stays between these; past 1.6x the near city layers run out of board and buildings start to float. */
export const ZOOM_MIN = 0.6;
export const ZOOM_MAX = 1.6;

/** A zoom in progress: the target scale and the world point that stays under the screen point (sx, sy). */
export interface ZoomAnim {
  target: number;
  sx: number;
  sy: number;
  wx: number;
  wy: number;
}

/** Starts or retargets a smooth zoom from a wheel delta, anchored at the pointer. */
export function zoomTowards(
  c: Cam,
  prev: ZoomAnim | null,
  deltaY: number,
  sx: number,
  sy: number,
  W: number,
  H: number,
): ZoomAnim {
  const target = clamp((prev?.target ?? c.z) * Math.exp(-deltaY * 0.0015), ZOOM_MIN, ZOOM_MAX);
  return { target, sx, sy, wx: (sx - W / 2) / c.z + c.x, wy: (sy - H / 2) / c.z + c.y };
}

/**
 * Eases the camera's scale toward the target with a 90 ms time constant, keeping the anchor under the pointer.
 * Returns true once it has landed.
 */
export function stepZoom(c: Cam, z: ZoomAnim, dt: number, W: number, H: number): boolean {
  const k = 1 - Math.exp(-dt / 0.09);
  c.z += (z.target - c.z) * k;
  const done = Math.abs(z.target - c.z) < 0.0005;
  if (done) c.z = z.target;
  c.x = z.wx - (z.sx - W / 2) / c.z;
  c.y = z.wy - (z.sy - H / 2) / c.z;
  return done;
}
