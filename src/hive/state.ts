import type { Cam } from "./camera";
import type { HiveData } from "./data";
import type { Point } from "./hex";
import type { BackSheet, FrontSheet, Loose } from "./layout";
import type { Effect, Prefs } from "./prefs";
import type { Route } from "./route";

export type Where = "front" | "back";

export interface LeafOpen {
  where: Where;
  idx: number;
  base: Cam;
  target: Cam;
}

export interface CardFlip extends LeafOpen {
  dir: "in" | "out";
  t0: number;
  done: () => void;
}

export interface SecAnim {
  dir: "in" | "out";
  t0: number;
  done: () => void;
}

/**
 * Section and leaf state on one timer each, as in the prototype.
 * `S` runs 0 to 1 while a section opens; `CF` is the flip progress of the cell turning into a leaf this frame.
 */
export interface Nav {
  sec: number;
  S: number;
  secAnim: SecAnim | null;
  cardFlip: CardFlip | null;
  leafOpen: LeafOpen | null;
  CF: { where: Where; idx: number; f: number } | null;
  busy: boolean;
  target: Route | null;
}

export type Drag =
  | { kind: "pan"; x: number; y: number; cx: number; cy: number }
  | { kind: "loose"; loose: Loose; ox: number; oy: number };

/** A press on a plain hex that has not yet moved far enough to tear the hex out. */
export interface Pending {
  key: string;
  q: number;
  r: number;
  x: number;
  y: number;
  wp: Point;
}

export interface Hive {
  data: HiveData;
  W: number;
  H: number;
  DPR: number;
  front: FrontSheet;
  backs: (BackSheet | null)[];
  frontCam: Cam;
  backCam: Cam;
  pointer: Point;
  clock: number;
  nav: Nav;
  hoverKey: string | null;
  hoverLoose: number;
  grow: Map<string, number>;
  drag: Drag | null;
  dragMoved: boolean;
  pending: Pending | null;
  prefs: Prefs;
  reduced: boolean;
}

export function createNav(): Nav {
  return { sec: -1, S: 0, secAnim: null, cardFlip: null, leafOpen: null, CF: null, busy: false, target: null };
}

/** An effect runs only when its switch is on and the visitor has not asked for reduced motion. */
export function on(h: Hive, name: Effect): boolean {
  return h.prefs[name] && !h.reduced;
}

export function onBack(h: Hive): boolean {
  return h.nav.sec >= 0 && h.nav.S >= 1;
}

export function activeCam(h: Hive): Cam {
  return onBack(h) ? h.backCam : h.frontCam;
}
