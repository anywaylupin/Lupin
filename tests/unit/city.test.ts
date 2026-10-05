import { describe, expect, it } from "vitest";
import { claim, createStage, REST } from "../../src/hive/city/events";
import { AVENUE, cellNdc, DOME, nextCell, planCity, serpent, tiersOf, VIEW } from "../../src/hive/city/plan";
import { BEE_SPEED, createBees, stepBees, type Swarm } from "../../src/hive/city/swarm";
import { boltedAt, buildFront } from "../../src/hive/layout";
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
    const r = rng(5);
    const targets = [
      { x: -100, y: 80, z: 0 },
      { x: 100, y: 120, z: -200 },
    ];
    const swarms: Swarm[] = targets.map((target) => ({ target, next: 3 }));
    const bees = createBees(targets, r);
    const roam = () => ({ x: (r() - 0.5) * 400, y: 60 + r() * 120, z: -r() * 400 });
    for (let i = 0; i < 900; i++) stepBees(bees, swarms, 1 / 60, roam, r);
    for (const swarm of [0, 1]) {
      const mine = bees.filter((b) => b.swarm === swarm);
      const c = ["x", "y", "z"].map((k) => mine.reduce((a, b) => a + b[k as "x"], 0) / mine.length);
      for (const b of mine) {
        expect(Math.hypot(b.x - (c[0] ?? 0), b.y - (c[1] ?? 0), b.z - (c[2] ?? 0))).toBeLessThan(80);
        expect(Math.hypot(b.vx, b.vy, b.vz)).toBeLessThanOrEqual(BEE_SPEED + 0.001);
      }
      const apart = mine.flatMap((a, i) => mine.slice(i + 1).map((b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)));
      expect(Math.min(...apart)).toBeGreaterThan(1);
    }
  });
});

describe("city plan", () => {
  const city = planCity(rng(7));

  it("is the same city for the same seed", () => {
    expect(planCity(rng(7))).toEqual(city);
  });

  it("keeps the dome's plaza and the avenue in front of it clear", () => {
    for (const b of city) {
      const r = Math.max(b.w, b.d) / 2;
      expect(Math.hypot(b.x, b.z) - r).toBeGreaterThan(DOME.r);
      if (b.z > 0) expect(Math.abs(b.x) - b.w / 2).toBeGreaterThan(AVENUE.half - 20);
    }
  });

  it("builds on both sides, near and far, so every corner of the screen has a skyline", () => {
    const quads = [
      city.filter((b) => b.x < -200 && b.z < -400),
      city.filter((b) => b.x > 200 && b.z < -400),
      city.filter((b) => b.x < -100 && b.z > 0),
      city.filter((b) => b.x > 100 && b.z > 0),
    ];
    for (const q of quads) expect(q.length).toBeGreaterThan(10);
  });

  it("mixes temples and pagodas with cyber towers", () => {
    const kinds = new Set(city.map((b) => b.kind));
    for (const k of ["pagoda", "hall", "tower", "hybrid", "cylinder"]) expect(kinds.has(k as never)).toBe(true);
    for (const b of city.filter((b) => b.kind === "pagoda")) expect(tiersOf(b)).toBeGreaterThanOrEqual(3);
  });

  it("keeps the foreground low enough to see over", () => {
    const eyeY = VIEW.eye.y;
    for (const b of city.filter((b) => b.z > 110)) expect(b.h).toBeLessThan(eyeY / 3);
  });

  it("swims the dragon from one end to the other", () => {
    const a = { x: -500, y: 120, z: -300 };
    const b = { x: 500, y: 160, z: -300 };
    const s0 = serpent(a, b, 0, 20);
    const s1 = serpent(a, b, 1, 20);
    expect(s0.x).toBe(a.x);
    expect(s1.x).toBe(b.x);
    expect(Math.abs(s1.y - b.y)).toBeLessThan(1e-6);
  });
});

describe("event cells", () => {
  it("visits every cell of the screen before repeating one", () => {
    const last = Array.from({ length: 9 }, () => 0);
    const r = rng(3);
    const seen = new Set<number>();
    for (let t = 1; t <= 9; t++) seen.add(nextCell(last, t * 10, r));
    expect(seen.size).toBe(9);
  });

  it("keeps each cell's spot on screen", () => {
    const r = rng(4);
    for (let c = 0; c < 9; c++) {
      for (let k = 0; k < 20; k++) {
        const p = cellNdc(c, r);
        expect(Math.abs(p.x)).toBeLessThan(1);
        expect(Math.abs(p.y)).toBeLessThan(1);
      }
    }
  });
});

describe("layout extras", () => {
  it("bolts hexes whose body covers the corner buttons even when the centre is just outside", () => {
    expect(boltedAt(99, 99, 170 + 50, 900 - 150 - 50, 165, 1440, 900)).toBe(true);
    expect(boltedAt(99, 99, 700, 400, 165, 1440, 900)).toBe(false);
  });

  it("keeps spares off the hole", () => {
    const F = buildFront(ids, 1440, 900, rng(9));
    for (const l of F.loose)
      for (const g of F.hole) expect(Math.hypot(g.x - l.x, g.y - l.y)).toBeGreaterThanOrEqual(F.R * 1.25);
  });
});
