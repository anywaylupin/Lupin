import type { Cam, Rect } from "./camera";
import { ax, keyOf, ring, type Axial, type Point } from "./hex";
import { holeCells } from "./hole";
import { clamp, hash2, type Rand } from "./math";

export interface Slot extends Point {
  q: number;
  r: number;
  key: string;
}

/** A slot holding content: `idx` points into the content list and `key` is the hover and focus id. */
export interface Placed extends Slot {
  idx: number;
  id: string;
}

export interface Snap {
  fx: number;
  fy: number;
  frot: number;
  to: Point & { rot?: number };
  t0: number;
  dur: number;
  delay: number;
  curve: "out" | "inOut";
  /** True when the seat burst should fire on arrival; a hand drop fires it at release instead. */
  burst: boolean;
}

/** A hex off the sheet: (x, y) is where it is held or resting, (ax, ay) where it is drawn after the magnet pull. */
export interface Loose extends Point {
  rot: number;
  seat: string | null;
  snap: Snap | null;
  ax: number;
  ay: number;
}

export interface LooseSeed extends Point {
  rot: number;
}

export interface SeatFx extends Point {
  t0: number;
}

export interface FrontSheet {
  R: number;
  portrait: boolean;
  home: Cam;
  rect: Rect;
  powered: Placed[];
  content: Set<string>;
  gaps: Map<string, Slot>;
  hole: Slot[];
  hc: Point;
  loose: Loose[];
  initLoose: LooseSeed[];
  removed: Set<string>;
  fx: SeatFx[];
  shake: { key: string; t0: number } | null;
}

export interface BackSheet {
  home: Cam;
  rect: Rect;
  items: Placed[];
  taken: Set<string>;
}

/** Content sits in a tight flower around the origin; index 0 is the name cell at the centre. */
export const CONTENT_SLOTS: readonly Axial[] = [
  [0, 0],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [1, -1],
  [0, 1],
];

export function isPortrait(W: number, H: number): boolean {
  return H > W * 1.1;
}

/**
 * Hex circumradius: 1.5x the prototype on desktop, which also halves how many hexes fill the screen.
 * Phones grow only 1.2x, the most that still fits the content flower across a 390px screen.
 */
export function hexRadius(W: number, H: number): number {
  return isPortrait(W, H) ? clamp(Math.min(W / 5.4, H / 8.75), 36, 108) : clamp(Math.min(W / 8, H / 5.4), 60, 165);
}

export function slotAt(key: string, R: number): Slot {
  const [q, r] = key.split(",").map(Number);
  return slot(q ?? 0, r ?? 0, R);
}

export function slot(q: number, r: number, R: number): Slot {
  return { q, r, key: keyOf(q, r), ...ax(q, r, R) };
}

/**
 * The camera rests so the content flower sits a margin in from the left in landscape, or centred in portrait, leaving the rest of the screen to the hole.
 * The flower spans 2.51 radii left and 1.65 right of the name cell, edge to edge.
 */
export function frontHome(R: number, portrait: boolean, W: number): Cam {
  if (portrait) return { x: -0.43 * R, y: R * 1.6, z: 1 };
  return { x: W / 2 - 2.51 * R - Math.max(48, W * 0.05), y: 0, z: 1 };
}

export function frontRect(home: Cam, W: number, H: number, R: number): Rect {
  return {
    x0: home.x - W / 2 - R * 2,
    x1: home.x + W / 2 + R * 2,
    y0: home.y - H / 2 - R * 2,
    y1: home.y + H / 2 + R * 2,
  };
}

/**
 * Three spare hexes rest beside the hole, kept clear of the screen edges, the contact and map corners, the content and the hole itself.
 * With 1.5x hexes a spare over the hole hid most of the city behind it, so spares keep 1.25 radii from every hole cell.
 * After 600 failed tries the search widens so small screens still place all three.
 */
export function spawnLoose(
  hc: Point,
  hole: readonly Point[],
  home: Cam,
  powered: readonly Point[],
  W: number,
  H: number,
  R: number,
  rand: Rand,
) {
  const loose: LooseSeed[] = [];
  for (let tries = 0; loose.length < 3 && tries < 1200; tries++) {
    const a = rand() * Math.PI * 2;
    const d = R * (2.3 + rand() * (tries > 600 ? 3 : 1.4));
    const x = hc.x + Math.cos(a) * d;
    const y = hc.y + Math.sin(a) * d;
    const sx = x - home.x + W / 2;
    const sy = y - home.y + H / 2;
    if (sx < R || sx > W - R || sy < R * 1.6 || sy > H - R) continue;
    if (sx < 190 && sy > H - 170) continue;
    if (sx > W - 210 && sy > H - 180) continue;
    if (powered.some((c) => Math.hypot(c.x - x, c.y - y) < R * 1.9)) continue;
    if (loose.some((h) => Math.hypot(h.x - x, h.y - y) < R * 1.9)) continue;
    if (hole.some((g) => Math.hypot(g.x - x, g.y - y) < R * 1.25)) continue;
    loose.push({ x, y, rot: (rand() - 0.5) * 0.6 });
  }
  return loose;
}

/**
 * Whether a plain hex at screen point (sx, sy) is bolted: under the contact or map corner, or one of the rare scattered ones.
 * The corner boxes grow by half a radius so a hex whose body covers the buttons counts even when its centre sits outside them, as large hexes do.
 */
export function boltedAt(q: number, r: number, sx: number, sy: number, R: number, W: number, H: number): boolean {
  const pad = R * 0.5;
  if (sx < 170 + pad && sy > H - 150 - pad) return true;
  if (sx > W - 190 - pad && sy > H - 160 - pad) return true;
  return hash2(q * 7 + 3, r * 13 + 5) < 0.025;
}

/** The front sheet has no edge; it holds the content flower, the broken patch and the three spares. */
export function buildFront(ids: readonly string[], W: number, H: number, rand: Rand): FrontSheet {
  const portrait = isPortrait(W, H);
  const R = hexRadius(W, H);
  const powered = ids.map((id, idx): Placed => {
    const [q, r] = CONTENT_SLOTS[idx] ?? [0, 0];
    return { ...slot(q, r, R), idx, id: `f:${id}` };
  });
  const home = frontHome(R, portrait, W);
  const content = new Set(powered.map((c) => c.key));
  const hole = holeCells(portrait, content).map(([q, r]) => slot(q, r, R));
  const gaps = new Map(hole.map((g) => [g.key, g]));
  const hc = hole.reduce((s, g) => ({ x: s.x + g.x / hole.length, y: s.y + g.y / hole.length }), { x: 0, y: 0 });
  const initLoose = spawnLoose(hc, hole, home, powered, W, H, R, rand);
  return {
    R,
    portrait,
    home,
    rect: frontRect(home, W, H, R),
    powered,
    content,
    gaps,
    hole,
    hc,
    loose: initLoose.map((h) => ({ ...h, seat: null, snap: null, ax: h.x, ay: h.y })),
    initLoose,
    removed: new Set(),
    fx: [],
    shake: null,
  };
}

/** A back sheet: Back at the origin with the cards in rings around it, on the same endless field. */
export function buildBack(section: string, ids: readonly string[], W: number, H: number, R: number): BackSheet {
  const all = ["back", ...ids];
  const slots: Axial[] = [];
  for (let k = 0; slots.length < all.length; k++) slots.push(...ring(k));
  const items = all.map((id, idx): Placed => {
    const [q, r] = slots[idx] ?? [0, 0];
    return { ...slot(q, r, R), idx, id: `b:${section}:${id}` };
  });
  const rect = { x0: -W / 2 - R * 1.2, x1: W / 2 + R * 1.2, y0: -H / 2 - R * 1.2, y1: H / 2 + R * 1.2 };
  for (const p of items) {
    rect.x0 = Math.min(rect.x0, p.x - R * 2);
    rect.x1 = Math.max(rect.x1, p.x + R * 2);
    rect.y0 = Math.min(rect.y0, p.y - R * 2);
    rect.y1 = Math.max(rect.y1, p.y + R * 2);
  }
  return { home: { x: 0, y: 0, z: 1 }, rect, items, taken: new Set(items.map((p) => p.key)) };
}
