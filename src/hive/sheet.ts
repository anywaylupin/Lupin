import { ax, keyOf } from "./hex";
import { slotAt, type FrontSheet, type Slot } from "./layout";
import { hash2 } from "./math";

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

/** A plain hex is any hex that is not content, not part of the hole and not already pulled out. */
export function isPlain(F: FrontSheet, key: string): boolean {
  return !F.content.has(key) && !F.gaps.has(key) && !F.removed.has(key);
}

/** Only a few hexes are bolted: the ones under the contact and map corners, plus a rare scattered one for texture. */
export function isLocked(F: FrontSheet, q: number, r: number, W: number, H: number): boolean {
  if (!isPlain(F, keyOf(q, r))) return false;
  const p = ax(q, r, F.R);
  const sx = p.x - F.home.x + W / 2;
  const sy = p.y - F.home.y + H / 2;
  if (sx < 170 && sy > H - 150) return true;
  if (sx > W - 190 && sy > H - 160) return true;
  return hash2(q * 7 + 3, r * 13 + 5) < 0.025;
}
