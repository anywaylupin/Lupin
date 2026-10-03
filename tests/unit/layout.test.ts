import { describe, expect, it } from "vitest";
import { buildBack, buildFront, hexRadius, isPortrait } from "../../src/hive/layout";
import { rng } from "../../src/hive/math";

const ids = ["about", "projects", "stack", "experience", "now", "hours"];
const sizes = [
  [390, 844],
  [1440, 900],
] as const;

describe("sizing", () => {
  it("treats tall screens as portrait", () => {
    expect(isPortrait(390, 844)).toBe(true);
    expect(isPortrait(1440, 900)).toBe(false);
  });

  it("clamps the hex size", () => {
    expect(hexRadius(390, 844)).toBe(60);
    expect(hexRadius(1440, 900)).toBe(110);
    expect(hexRadius(200, 300)).toBe(30);
  });
});

describe("front sheet", () => {
  for (const [W, H] of sizes) {
    it(`places content, the hole and up to three spares clear of everything at ${W}x${H}`, () => {
      const F = buildFront(ids, W, H, rng(42));
      expect(F.powered.map((p) => p.id)).toEqual(ids.map((id) => `f:${id}`));
      expect(F.powered[0]).toMatchObject({ q: 0, r: 0, x: 0, y: 0 });
      expect(F.loose.length).toBeGreaterThan(0);
      expect(F.loose.length).toBeLessThanOrEqual(3);
      for (const l of F.loose) {
        const sx = l.x - F.home.x + W / 2;
        const sy = l.y - F.home.y + H / 2;
        expect(sx).toBeGreaterThanOrEqual(F.R);
        expect(sx).toBeLessThanOrEqual(W - F.R);
        expect(sy).toBeLessThanOrEqual(H - F.R);
        for (const p of F.powered) expect(Math.hypot(p.x - l.x, p.y - l.y)).toBeGreaterThanOrEqual(F.R * 1.9);
      }
    });
  }

  it("is the same for the same seed", () => {
    expect(buildFront(ids, 1440, 900, rng(7)).loose).toEqual(buildFront(ids, 1440, 900, rng(7)).loose);
  });
});

describe("back sheet", () => {
  it("puts Back at the origin and the cards in rings", () => {
    const B = buildBack("projects", ["a", "b", "c", "d"], 1440, 900, 110);
    expect(B.items[0]).toMatchObject({ q: 0, r: 0, id: "b:projects:back" });
    expect(B.items).toHaveLength(5);
    expect(B.taken.size).toBe(5);
  });

  it("grows its rect to keep every card reachable", () => {
    const ids25 = Array.from({ length: 25 }, (_, i) => `s${i}`);
    const B = buildBack("stack", ids25, 390, 844, 60);
    for (const p of B.items) {
      expect(p.x - 120).toBeGreaterThanOrEqual(B.rect.x0);
      expect(p.y + 120).toBeLessThanOrEqual(B.rect.y1);
    }
  });
});
