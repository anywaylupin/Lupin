import type { Point } from "../hex";
import { AMBER, CYAN, PINK } from "../theme";
import { HZ } from "./board";

export interface Sign {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string | null;
  c: string;
  k: number;
  horizontal: boolean;
}

export interface Lane {
  k: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  c: string;
  n: number;
  size: number;
}

export interface Rail {
  k: number;
  a: Point;
  b: Point;
  sag: number;
  pods: { t: number; dir: 1 | -1 }[];
  next: number;
  speed: number;
  scale: number;
}

export interface Platform {
  k: number;
  x: number;
  y: number;
  w: number;
  ph: number;
}

export interface Drone {
  cx: number;
  cy: number;
  ax: number;
  ay: number;
  sp: number;
  ph: number;
}

export interface Car {
  p: number;
  dir: 1 | -1;
  y: number;
  dur: number;
}

export interface Bolt {
  t: number;
  x: number;
  main: Point[];
  branches: Point[][];
}

export interface Boom {
  t: number;
  x: number;
  y: number;
  sparks: { vx: number; vy: number }[];
  puffs: { dx: number; r: number; d: number }[];
}

/**
 * Everything in the city that moves, keyed by the parallax factor `k` of the layer it lives on.
 * Timers count down in seconds; the first car, bolt and blast come early so a visitor sees each within a few seconds.
 */
export interface Scene {
  signs: Sign[];
  lanes: Lane[];
  rails: Rail[];
  platforms: Platform[];
  drones: Drone[];
  car: Car | null;
  nextCar: number;
  bolt: Bolt | null;
  nextBolt: number;
  boom: Boom | null;
  nextBoom: number;
}

/** The Mandarin signs read night market, tangerine, open and express delivery; 橘 nods to Juka. */
export function createScene(): Scene {
  return {
    signs: [
      { x: 600, y: 360, w: 30, h: 100, text: "夜市", c: PINK, k: 0.6, horizontal: false },
      { x: 760, y: 345, w: 28, h: 28, text: "橘", c: CYAN, k: 0.6, horizontal: false },
      { x: 890, y: 410, w: 60, h: 26, text: "开放", c: AMBER, k: 0.6, horizontal: true },
      { x: 1020, y: 430, w: 18, h: 80, text: null, c: CYAN, k: 0.6, horizontal: false },
      { x: 690, y: 640, w: 64, h: 28, text: "快递", c: PINK, k: 0.85, horizontal: true },
    ],
    lanes: [
      { k: 0.35, y: HZ + 6, dir: 1, speed: 40, c: AMBER, n: 46, size: 1.6 },
      { k: 0.35, y: HZ + 12, dir: -1, speed: 34, c: PINK, n: 40, size: 1.6 },
      { k: 0.85, y: 748, dir: 1, speed: 70, c: AMBER, n: 18, size: 2.4 },
      { k: 0.85, y: 756, dir: -1, speed: 62, c: CYAN, n: 16, size: 2.4 },
      { k: 1.1, y: 912, dir: 1, speed: 120, c: AMBER, n: 10, size: 3.4 },
      { k: 1.1, y: 920, dir: -1, speed: 110, c: PINK, n: 9, size: 3.4 },
    ],
    rails: [
      { k: 0.6, a: { x: 100, y: 410 }, b: { x: 1500, y: 386 }, sag: 16, pods: [], next: 0.5, speed: 150, scale: 0.8 },
      { k: 0.85, a: { x: -60, y: 560 }, b: { x: 1660, y: 600 }, sag: 22, pods: [], next: 2, speed: 120, scale: 1.2 },
    ],
    platforms: [
      { k: 0.6, x: 700, y: 300, w: 140, ph: 0 },
      { k: 0.6, x: 1000, y: 270, w: 104, ph: 2 },
      { k: 0.85, x: 850, y: 480, w: 120, ph: 4 },
    ],
    drones: Array.from({ length: 5 }, (_, i) => ({
      cx: 640 + i * 90,
      cy: 330 + (i % 2) * 40,
      ax: 40 + i * 6,
      ay: 18,
      sp: 0.3 + i * 0.07,
      ph: i * 1.3,
    })),
    car: null,
    nextCar: 6,
    bolt: null,
    nextBolt: 4,
    boom: null,
    nextBoom: 12,
  };
}
