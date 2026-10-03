import { describe, expect, it } from "vitest";
import {
  ax,
  axDist,
  hexVerts,
  inPoly,
  keyOf,
  parseKey,
  perimeter,
  ring,
  toAxial,
  visibleRange,
} from "../../src/hive/hex";

describe("axial coordinates", () => {
  it("round trips every cell within four rings through pixel space", () => {
    for (let k = 0; k <= 4; k++) {
      for (const [q, r] of ring(k)) {
        const p = ax(q, r, 37);
        expect(toAxial(p.x, p.y, 37)).toEqual([q, r]);
        expect(toAxial(p.x + 10, p.y - 8, 37)).toEqual([q, r]);
      }
    }
  });

  it("never returns negative zero, so keys match", () => {
    const [q, r] = toAxial(-0.1, -0.1, 50);
    expect(Object.is(q, -0)).toBe(false);
    expect(Object.is(r, -0)).toBe(false);
    expect(keyOf(q, r)).toBe("0,0");
  });

  it("measures hex distance", () => {
    expect(axDist(0, 0, 0, 0)).toBe(0);
    expect(axDist(0, 0, 3, -1)).toBe(3);
    expect(axDist(-1, 3, 0, 0)).toBe(3);
  });

  it("parses keys back", () => {
    expect(parseKey(keyOf(-2, 5))).toEqual([-2, 5]);
  });
});

describe("rings", () => {
  it("holds 6k distinct cells at distance k", () => {
    expect(ring(0)).toEqual([[0, 0]]);
    for (let k = 1; k <= 5; k++) {
      const cells = ring(k);
      expect(cells).toHaveLength(6 * k);
      expect(new Set(cells.map(([q, r]) => keyOf(q, r))).size).toBe(6 * k);
      for (const [q, r] of cells) expect(axDist(q, r, 0, 0)).toBe(k);
    }
  });
});

describe("polygons", () => {
  const v = hexVerts(100, 50, 20);

  it("builds six pointy-top vertices at the radius", () => {
    expect(v).toHaveLength(6);
    for (const p of v) expect(Math.hypot(p.x - 100, p.y - 50)).toBeCloseTo(20);
    expect(Math.min(...v.map((p) => p.y))).toBeCloseTo(30);
  });

  it("hit tests inside and outside", () => {
    expect(inPoly({ x: 100, y: 50 }, v)).toBe(true);
    expect(inPoly({ x: 100, y: 31 }, v)).toBe(true);
    expect(inPoly({ x: 118, y: 33 }, v)).toBe(false);
  });

  it("samples a perimeter evenly", () => {
    expect(perimeter(v, 0.5)).toHaveLength(12);
  });
});

describe("visible range", () => {
  it("covers every cell centre on screen", () => {
    const R = 40;
    const W = 800;
    const H = 600;
    const vr = visibleRange(1, W / 2, H / 2, W, H, R);
    for (let y = 0; y <= H; y += 25) {
      for (let x = 0; x <= W; x += 25) {
        const [q, r] = toAxial(x - W / 2, y - H / 2, R);
        const [q0, q1] = vr.q(r);
        expect(r).toBeGreaterThanOrEqual(vr.r0);
        expect(r).toBeLessThanOrEqual(vr.r1);
        expect(q).toBeGreaterThanOrEqual(q0);
        expect(q).toBeLessThanOrEqual(q1);
      }
    }
  });
});
