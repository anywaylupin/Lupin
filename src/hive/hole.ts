import { axDist, DIRS, keyOf, type Axial } from "./hex";

/**
 * Where the broken patch sits: below the content in portrait, to its right in landscape.
 * Landscape anchors one column closer than the prototype's (3, 1) because hexes are 1.5x larger and the patch would otherwise fall off screen.
 */
export function holeAnchor(portrait: boolean): Axial {
  return portrait ? [-1, 3] : [2, 1];
}

/** Tail cells relative to the anchor, rising up and to the right into the teardrop; landscape has room for a wider shoulder and a longer tip. */
const TAIL: readonly Axial[] = [
  [2, -2],
  [2, -1],
  [1, -2],
];
const LANDSCAPE_TAIL: readonly Axial[] = [
  [3, -3],
  [3, -2],
  [2, 0],
  [1, 1],
  [4, -4],
];

/**
 * The broken patch: an anchor cell, its six neighbours, then a tail up and to the right that gives it a teardrop shape.
 * Content cells and anything within two steps of the origin are never broken, so the hole cannot touch the name cell.
 */
export function holeCells(portrait: boolean, content: ReadonlySet<string>): Axial[] {
  const [hq, hr] = holeAnchor(portrait);
  const offsets = [[0, 0] as const, ...DIRS, ...TAIL, ...(portrait ? [] : LANDSCAPE_TAIL)];
  const seen = new Set<string>();
  return offsets
    .map(([dq, dr]): Axial => [hq + dq, hr + dr])
    .filter(([q, r]) => {
      const key = keyOf(q, r);
      if (seen.has(key) || content.has(key) || axDist(q, r, 0, 0) < 2) return false;
      seen.add(key);
      return true;
    });
}
