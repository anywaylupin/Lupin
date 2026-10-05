import { ax, hexVerts, inPoly, keyOf, type Point } from "./hex";
import { boltedAt, framed, slotAt, type FrontSheet, type Loose, type Slot } from "./layout";
import { clamp, ease, easeOut, lerp } from "./math";
import { HEX } from "./theme";

/** A drop snaps into an empty slot within this many hex radii; the magnet starts pulling from 1.9. */
export const MAGNET_RANGE = 1.9;
export const SEAT_RANGE = 1.15;
export const SNAP_MS = 240;

export function occupied(F: FrontSheet, key: string): boolean {
  return F.loose.some((h) => h.seat === key);
}

/** Slots showing the city: the original hole plus every hex pulled out, minus any a loose hex now sits in. */
export function emptyGaps(F: FrontSheet): Slot[] {
  const out = F.hole.filter((g) => !occupied(F, g.key));
  for (const k of F.removed) if (!occupied(F, k)) out.push(slotAt(k, F.R));
  return out;
}

export function isOpen(F: FrontSheet, key: string): boolean {
  return (F.gaps.has(key) || F.removed.has(key)) && !occupied(F, key);
}

/** A plain hex is any hex that is not content, not part of the hole, not pulled out and not glass. */
export function isPlain(F: FrontSheet, key: string): boolean {
  return !F.content.has(key) && !F.gaps.has(key) && !F.removed.has(key) && !F.glass.has(key);
}

/** Fixed hexes are the frame round the explorable area and everything past it, plus the ones under the contact and map corners. */
export function isLocked(F: FrontSheet, q: number, r: number, W: number, H: number): boolean {
  if (!isPlain(F, keyOf(q, r))) return false;
  const p = ax(q, r, F.R);
  return framed(F.rect, p, F.R) || boltedAt(p.x - F.home.x + W / 2, p.y - F.home.y + H / 2, F.R, W, H);
}

/** Glass mode turns a plain hex to glass and a glass hex back; anything else is left alone. Returns whether the hex is now glass. */
export function toggleGlass(F: FrontSheet, key: string): boolean {
  if (F.glass.delete(key)) return false;
  if (!isPlain(F, key)) return false;
  F.glass.add(key);
  return true;
}

export function glassSlots(F: FrontSheet): Slot[] {
  return [...F.glass].map((k) => slotAt(k, F.R));
}

export function loosePoly(l: Loose, R: number): Point[] {
  return hexVerts(l.ax, l.ay, R * HEX, l.rot);
}

/** Topmost loose hex under a world point; later entries draw on top, so the search runs backwards. */
export function hitLoose(F: FrontSheet, wp: Point): number {
  for (let i = F.loose.length - 1; i >= 0; i--) {
    const l = F.loose[i];
    if (l && inPoly(wp, loosePoly(l, F.R))) return i;
  }
  return -1;
}

/** The nearest empty slot within range and how strongly it pulls, from 0 at the edge of range to 1 on top of it. */
export function magnetFor(F: FrontSheet, l: Point): { g: Slot; k: number } | null {
  let best: Slot | null = null;
  let bd = F.R * MAGNET_RANGE;
  for (const g of emptyGaps(F)) {
    const d = Math.hypot(g.x - l.x, g.y - l.y);
    if (d < bd) {
      bd = d;
      best = g;
    }
  }
  return best ? { g: best, k: 1 - bd / (F.R * MAGNET_RANGE) } : null;
}

/** Lifts a loose hex to the top of the stack and frees any slot it was sitting in. */
export function pickUp(F: FrontSheet, idx: number, wp: Point): { loose: Loose; ox: number; oy: number } | null {
  const [l] = F.loose.splice(idx, 1);
  if (!l) return null;
  F.loose.push(l);
  l.seat = null;
  l.snap = null;
  l.x = l.ax;
  l.y = l.ay;
  return { loose: l, ox: wp.x - l.ax, oy: wp.y - l.ay };
}

/** Pulls a plain hex out of the sheet, leaving its slot open to the city. */
export function tearOut(F: FrontSheet, key: string, q: number, r: number, wp: Point) {
  const p = ax(q, r, F.R);
  const l: Loose = { x: p.x, y: p.y, rot: 0, seat: null, snap: null, ax: p.x, ay: p.y };
  F.removed.add(key);
  F.loose.push(l);
  return { loose: l, ox: wp.x - p.x, oy: wp.y - p.y };
}

/** A released hex that misses every slot settles from its lifted height back onto the sheet over this long. */
export const SETTLE_MS = 160;

/**
 * Releases a held hex where it is drawn, `rot` and `lift` being its tilt and height while held.
 * Close enough to an empty slot it snaps in, and the seat burst fires at once, so the drop feels instant instead of waiting out the 240 ms snap.
 */
export function drop(F: FrontSheet, l: Loose, now: number, rot = l.rot, lift = 0): void {
  l.x = l.ax;
  l.y = l.ay;
  l.rot = rot;
  const m = magnetFor(F, l);
  if (m && Math.hypot(m.g.x - l.x, m.g.y - l.y) < F.R * SEAT_RANGE) {
    l.seat = m.g.key;
    l.snap = {
      fx: l.x,
      fy: l.y - lift,
      frot: rot,
      to: m.g,
      t0: now,
      dur: SNAP_MS,
      delay: 0,
      curve: "out",
      burst: false,
    };
    F.fx.push({ x: m.g.x, y: m.g.y, t0: now });
    return;
  }
  if (lift)
    l.snap = {
      fx: l.x,
      fy: l.y - lift,
      frot: rot,
      to: { x: l.x, y: l.y, rot },
      t0: now,
      dur: SETTLE_MS,
      delay: 0,
      curve: "out",
      burst: false,
    };
}

/** The magnet drags the drawn position towards the slot by up to 45% of the gap, easing in with the square of the pull. */
export function heldPose(F: FrontSheet, l: Loose, magnet: boolean) {
  const m = magnet ? magnetFor(F, l) : null;
  const pull = m ? m.k * m.k * 0.45 : 0;
  l.ax = l.x + (m ? (m.g.x - l.x) * pull : 0);
  l.ay = l.y + (m ? (m.g.y - l.y) * pull : 0);
  return m;
}

/** Advances a snapping hex; a hex that lands in a seat on a reset adds its seat burst on arrival. */
export function stepSnap(F: FrontSheet, l: Loose, now: number, reduced: boolean): void {
  const s = l.snap;
  if (!s) {
    if (!l.seat) {
      l.ax = l.x;
      l.ay = l.y;
    }
    return;
  }
  const p = reduced ? 1 : clamp((now - s.t0 - s.delay) / s.dur, 0, 1);
  const e = s.curve === "inOut" ? ease(p) : easeOut(p);
  l.x = lerp(s.fx, s.to.x, e);
  l.y = lerp(s.fy, s.to.y, e);
  l.rot = lerp(s.frot, s.to.rot ?? 0, e);
  l.ax = l.x;
  l.ay = l.y;
  if (p >= 1) {
    l.snap = null;
    if (l.seat && s.burst) F.fx.push({ x: l.x, y: l.y, t0: now });
  }
}
