import { axDist, DIRS, keyOf, type Axial } from "./hex";

/** Where the broken patch sits: below the content in portrait, to its right in landscape. */
export function holeAnchor(portrait: boolean): Axial {
  return portrait ? [-1, 3] : [3, 1];
}

/**
 * The broken patch: an anchor cell, its six neighbours, then a short tail up and to the right that gives it a teardrop shape.
 * Landscape has the room for one more tail cell.
 * Content cells and anything within two steps of the origin are never broken, so the hole cannot touch the name cell.
 */
export function holeCells(portrait: boolean, content: ReadonlySet<string>): Axial[] {
  const [hq, hr] = holeAnchor(portrait);
  const cells: Axial[] = [
    [hq, hr],
    ...DIRS.map(([dq, dr]): Axial => [hq + dq, hr + dr]),
    [hq + 2, hr - 2],
    [hq + 2, hr - 1],
    [hq + 1, hr - 2],
  ];
  if (!portrait) cells.push([hq + 3, hr - 3]);
  const seen = new Set<string>();
  return cells.filter(([q, r]) => {
    const key = keyOf(q, r);
    if (seen.has(key) || content.has(key) || axDist(q, r, 0, 0) < 2) return false;
    seen.add(key);
    return true;
  });
}
