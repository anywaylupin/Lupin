import type { Point } from "../hex";
import { rng } from "../math";
import { AMBER, CYAN, PINK } from "../theme";
import { HZ } from "./board";
import { createStage, type Stage } from "./events";
import { PLAN } from "./plan";

export interface Sign {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string | null;
  c: string;
  layer: "mid" | "nearmid";
  horizontal: boolean;
}

export interface Lane {
  layer: "farmid" | "nearmid" | "near";
  y: number;
  dir: 1 | -1;
  speed: number;
  c: string;
  n: number;
  size: number;
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

export interface Bee extends Point {
  vx: number;
  vy: number;
  swarm: number;
  phase: number;
}

export interface Ripple extends Point {
  t: number;
}

/**
 * Everything in the city that moves. Timers count down in seconds of their own clock: `life` time runs only with traffic and lights on, `weather` time only with rain and storms on, so each switch freezes its half of the city.
 * The first car, bolt, flare and blast come early so a visitor sees each within a few seconds.
 */
export interface Scene {
  life: number;
  weather: number;
  stage: Stage;
  signs: Sign[];
  lanes: Lane[];
  car: Car | null;
  nextCar: number;
  bolt: Bolt | null;
  nextBolt: number;
  boom: Boom | null;
  nextBoom: number;
  flare: number | null;
  nextFlare: number;
  glow: number;
  capsules: number[];
  portal: { t: number; rest: number };
  coaster: number;
  ripples: Ripple[];
  bees: Bee[];
  swarms: { target: Point; next: number }[];
  wukong: { at: "pagoda" | "arcology"; leap: number | null; next: number };
}

/** Two swarms of six bees start spread over the sky above the dome; the seeded spread keeps them from overlapping on load. */
function hive(): Bee[] {
  const r = rng(11);
  return Array.from({ length: 12 }, (_, i) => ({
    x: PLAN.dome.x - 140 + (i % 6) * 18 + (i < 6 ? 0 : 200) + r() * 10,
    y: 240 + r() * 60,
    vx: 0,
    vy: 0,
    swarm: i < 6 ? 0 : 1,
    phase: r() * 6,
  }));
}

/** The Mandarin signs read night market, tangerine, open and express delivery; 橘 nods to Juka. */
export function createScene(): Scene {
  const d = PLAN.dome;
  return {
    life: 0,
    weather: 0,
    stage: createStage(),
    signs: [
      { x: PLAN.pagoda.x - 6, y: 560, w: 28, h: 92, text: "夜市", c: PINK, layer: "nearmid", horizontal: false },
      { x: PLAN.twin.x + 21, y: 280, w: 28, h: 28, text: "橘", c: CYAN, layer: "mid", horizontal: false },
      { x: PLAN.twin.x + 107, y: 410, w: 58, h: 24, text: "开放", c: AMBER, layer: "mid", horizontal: true },
      { x: PLAN.connector.x + 20, y: 770, w: 18, h: 70, text: null, c: CYAN, layer: "nearmid", horizontal: false },
      { x: PLAN.connector.x + 90, y: 772, w: 64, h: 28, text: "快递", c: PINK, layer: "nearmid", horizontal: true },
    ],
    lanes: [
      { layer: "farmid", y: HZ + 6, dir: 1, speed: 36, c: AMBER, n: 22, size: 1.8 },
      { layer: "farmid", y: HZ + 12, dir: -1, speed: 30, c: PINK, n: 18, size: 1.8 },
      { layer: "nearmid", y: 876, dir: 1, speed: 64, c: AMBER, n: 9, size: 2.8 },
      { layer: "nearmid", y: 884, dir: -1, speed: 56, c: CYAN, n: 8, size: 2.8 },
      { layer: "near", y: 912, dir: 1, speed: 110, c: AMBER, n: 6, size: 3.8 },
      { layer: "near", y: 920, dir: -1, speed: 100, c: PINK, n: 5, size: 3.8 },
    ],
    car: null,
    nextCar: 7,
    bolt: null,
    nextBolt: 5,
    boom: null,
    nextBoom: 14,
    flare: null,
    nextFlare: 3,
    glow: 0,
    capsules: [0, 0.5],
    portal: { t: 0, rest: 1 },
    coaster: 0,
    ripples: [],
    bees: hive(),
    swarms: [
      { target: { x: d.x - 90, y: 260 }, next: 4 },
      { target: { x: d.x + 120, y: 300 }, next: 6 },
    ],
    wukong: { at: "pagoda", leap: null, next: 9 },
  };
}
