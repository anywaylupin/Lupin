import { describe, expect, it } from "vitest";
import { stepBees } from "../../src/hive/city/cast";
import { claim, createStage, REST } from "../../src/hive/city/events";
import { bezier, coasterAt, PLAN, starAt } from "../../src/hive/city/plan";
import { createScene } from "../../src/hive/city/scene";
import { keyOf } from "../../src/hive/hex";
import { boltedAt, buildFront, holeView } from "../../src/hive/layout";
import { rng } from "../../src/hive/math";

const ids = ["about", "projects", "stack", "experience", "now", "hours"];

describe("stage scheduler", () => {
  it("lets one set piece run at a time, with a rest after it", () => {
    const s = createStage();
    expect(claim(s, 0, 1.4)).toBe(true);
    expect(claim(s, 1, 0.5)).toBe(false);
    expect(claim(s, 1.4 + REST - 0.01, 0.5)).toBe(false);
    expect(claim(s, 1.4 + REST, 0.5)).toBe(true);
  });
});

describe("bee swarms", () => {
  it("stay together, keep apart and never outrun their top speed", () => {
    const scene = createScene();
    const r = rng(5);
    for (let i = 0; i < 600; i++) stepBees(scene.bees, scene.swarms, 1 / 60, r);
    for (const swarm of [0, 1]) {
      const bees = scene.bees.filter((b) => b.swarm === swarm);
      const cx = bees.reduce((a, b) => a + b.x, 0) / bees.length;
      const cy = bees.reduce((a, b) => a + b.y, 0) / bees.length;
      for (const b of bees) {
        expect(Math.hypot(b.x - cx, b.y - cy)).toBeLessThan(120);
        expect(Math.hypot(b.vx, b.vy)).toBeLessThanOrEqual(70.001);
      }
      const apart = bees.flatMap((a, i) => bees.slice(i + 1).map((b) => Math.hypot(a.x - b.x, a.y - b.y)));
      expect(Math.min(...apart)).toBeGreaterThan(2);
    }
  });
});

describe("city plan", () => {
  it("closes the coaster circuit without jumps", () => {
    let prev = coasterAt(0);
    for (let i = 1; i <= 2000; i++) {
      const p = coasterAt(i / 2000);
      expect(Math.hypot(p.x - prev.x, p.y - prev.y)).toBeLessThan(6);
      prev = p;
    }
    const start = coasterAt(0);
    expect(Math.hypot(prev.x - start.x, prev.y - start.y)).toBeLessThan(1e-6);
  });

  it("puts the coaster behind the tower for part of each helix turn", () => {
    const sides = Array.from({ length: 200 }, (_, i) => coasterAt((i / 200) * 0.55).side);
    expect(sides.some((s) => s < 0)).toBe(true);
    expect(sides.some((s) => s > 0)).toBe(true);
  });

  it("runs the tube from the arcology to the pagoda", () => {
    expect(bezier(PLAN.tube, 0)).toEqual(PLAN.tube[0]);
    expect(bezier(PLAN.tube, 1)).toEqual(PLAN.tube[3]);
  });

  it("hangs the star where each layout's hole can show it", () => {
    expect(starAt(false).y).toBeLessThan(starAt(true).y);
  });
});

describe("layout extras", () => {
  for (const [W, H] of [
    [390, 844],
    [1440, 900],
  ] as const) {
    it(`hides two eggs behind plain, pullable hexes at ${W}x${H}`, () => {
      const F = buildFront(ids, W, H, rng(2));
      expect([...F.eggs.values()].sort()).toEqual(["nap", "nest"]);
      for (const key of F.eggs.keys()) {
        expect(F.content.has(key)).toBe(false);
        expect(F.gaps.has(key)).toBe(false);
      }
    });

    it(`centres the city on the part of the hole that is on screen at ${W}x${H}`, () => {
      const F = buildFront(ids, W, H, rng(2));
      const v = holeView(F, W, H);
      expect(v.x).toBeGreaterThan(0);
      expect(v.x).toBeLessThan(W);
      expect(v.y).toBeGreaterThan(0);
      expect(v.y).toBeLessThan(H);
    });
  }

  it("bolts hexes whose body covers the corner buttons even when the centre is just outside", () => {
    expect(boltedAt(99, 99, 170 + 50, 900 - 150 - 50, 165, 1440, 900)).toBe(true);
    expect(boltedAt(99, 99, 700, 400, 165, 1440, 900)).toBe(false);
  });

  it("keeps spares off the hole", () => {
    const F = buildFront(ids, 1440, 900, rng(9));
    for (const l of F.loose)
      for (const g of F.hole) expect(Math.hypot(g.x - l.x, g.y - l.y)).toBeGreaterThanOrEqual(F.R * 1.25);
    expect(F.eggs.has(keyOf(1, 0))).toBe(true);
  });
});
