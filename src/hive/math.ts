export type Rand = () => number;

/** Seeded (mulberry32) so the gaps, the city and the stack layout look the same until the page reloads. */
export function rng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable noise for a pair of integers, used wherever a frame needs the same random value twice. */
export function hash2(a: number, b: number): number {
  return rng((a * 73856093) ^ (b * 19349663))();
}

export function ease(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
}

export function easeOut(p: number): number {
  return 1 - (1 - p) ** 3;
}

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
