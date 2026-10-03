import { describe, expect, it } from "vitest";
import { axDist, keyOf } from "../../src/hive/hex";
import { holeAnchor, holeCells } from "../../src/hive/hole";
import { CONTENT_SLOTS } from "../../src/hive/layout";

const content = new Set(CONTENT_SLOTS.map(([q, r]) => keyOf(q, r)));
const keys = (portrait: boolean) => holeCells(portrait, content).map(([q, r]) => keyOf(q, r));

describe("hole", () => {
  it("is nine cells in portrait, where one tail cell would land on content, and eleven in landscape", () => {
    expect(keys(true)).toHaveLength(9);
    expect(keys(false)).toHaveLength(11);
  });

  it("keeps the anchor and its whole ring", () => {
    for (const portrait of [true, false]) {
      const [hq, hr] = holeAnchor(portrait);
      const cells = holeCells(portrait, content);
      expect(cells.filter(([q, r]) => axDist(q, r, hq, hr) <= 1)).toHaveLength(7);
    }
  });

  it("never touches content or the cells next to it", () => {
    for (const portrait of [true, false]) {
      for (const [q, r] of holeCells(portrait, content)) {
        expect(content.has(keyOf(q, r))).toBe(false);
        expect(axDist(q, r, 0, 0)).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("has no duplicates", () => {
    expect(new Set(keys(false)).size).toBe(keys(false).length);
  });

  it("tapers to a tail up and to the right of the anchor", () => {
    const [hq, hr] = holeAnchor(false);
    const tail = holeCells(false, content).filter(([q, r]) => axDist(q, r, hq, hr) > 1);
    expect(tail.map(([q, r]) => keyOf(q, r))).toEqual([keyOf(5, -1), keyOf(5, 0), keyOf(4, -1), keyOf(6, -2)]);
  });
});
