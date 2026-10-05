import { describe, expect, it } from "vitest";
import { claim, createStage, REST } from "../../src/hive/city/events";
import {
  chooseFor,
  COOLDOWN,
  DOME,
  LEVEL,
  planFillers,
  planShafts,
  PLOTS,
  serpent,
  type Candidate,
} from "../../src/hive/city/plan";
import { BEE_SPEED, createBees, stepBees, type Swarm } from "../../src/hive/city/swarm";
import { boltedAt, buildFront, holeView } from "../../src/hive/layout";
import { rng } from "../../src/hive/math";

const ids = ["about", "projects", "stack", "experience", "now", "hours"];

describe("stage scheduler", () => {
  it("lets one flash run at a time, with a rest after it", () => {
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
      { x: -300, y: 300, z: 0 },
      { x: 300, y: 400, z: -400 },
    ];
    const swarms: Swarm[] = targets.map((target) => ({ target, next: 3 }));
    const bees = createBees(targets, r);
    const roam = () => ({ x: (r() - 0.5) * 1000, y: 200 + r() * 300, z: -r() * 800 });
    for (let i = 0; i < 900; i++) stepBees(bees, swarms, 1 / 60, roam, r);
    for (const swarm of [0, 1]) {
      const mine = bees.filter((b) => b.swarm === swarm);
      const cx = mine.reduce((a, b) => a + b.x, 0) / mine.length;
      const cy = mine.reduce((a, b) => a + b.y, 0) / mine.length;
      const cz = mine.reduce((a, b) => a + b.z, 0) / mine.length;
      for (const b of mine) {
        expect(Math.hypot(b.x - cx, b.y - cy, b.z - cz)).toBeLessThan(160);
        expect(Math.hypot(b.vx, b.vy, b.vz)).toBeLessThanOrEqual(BEE_SPEED + 0.001);
      }
      const apart = mine.flatMap((a, i) => mine.slice(i + 1).map((b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)));
      expect(Math.min(...apart)).toBeGreaterThan(4);
    }
  });
});

describe("city plan", () => {
  const fillers = planFillers(rng(7));

  it("is the same city for the same seed", () => {
    expect(planFillers(rng(7))).toEqual(fillers);
  });

  it("names every landmark once", () => {
    const names = PLOTS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain("Owlspire Academy");
  });

  it("keeps filler off Lumen and every landmark plot on the deck", () => {
    for (const f of fillers) {
      const r = Math.max(f.w, f.d) / 2;
      expect(Math.hypot(f.x - DOME.x, f.z - DOME.z) - r).toBeGreaterThan(DOME.r);
      for (const p of PLOTS.filter((q) => q.level === "upper" || q.level === "edge"))
        expect(Math.hypot(f.x - p.at.x, f.z - p.at.z)).toBeGreaterThan(p.room);
    }
  });

  it("builds tall and packed, with both sides of Lumen filled", () => {
    const near = fillers.filter((f) => !f.far);
    expect(near.filter((f) => f.x < -300).length).toBeGreaterThan(15);
    expect(near.filter((f) => f.x > 300).length).toBeGreaterThan(15);
    const tall = near.filter((f) => f.h > 400).length;
    expect(tall / near.length).toBeGreaterThan(0.5);
  });

  it("stands Lumen on the deck behind the cliff edge, wider than any tower", () => {
    expect(DOME.z + DOME.r).toBeLessThan(LEVEL.edge);
    for (const f of fillers) expect(f.w).toBeLessThan(DOME.r * 2);
  });

  it("sinks shafts into the deck away from each other", () => {
    const shafts = planShafts(rng(9));
    expect(shafts.length).toBeGreaterThan(4);
    for (const s of shafts) expect(s.z).toBeLessThan(LEVEL.edge);
  });

  it("swims the dragon from one end to the other", () => {
    const a = { x: -500, y: 120, z: -300 };
    const b = { x: 500, y: 160, z: -300 };
    expect(serpent(a, b, 0, 20).x).toBe(a.x);
    expect(serpent(a, b, 1, 20).x).toBe(b.x);
    expect(Math.abs(serpent(a, b, 1, 20).y - b.y)).toBeLessThan(1e-6);
  });
});

describe("choosing what happens behind a hex", () => {
  const list = (): Candidate[] => [
    { id: "near", at: { x: 0.5, y: 0.5 }, last: -99 },
    { id: "far", at: { x: -0.9, y: -0.9 }, last: -99 },
    { id: "show-a", at: null, last: -99 },
    { id: "show-b", at: null, last: -50 },
  ];

  it("picks the landmark showing nearest the open hex", () => {
    const l = list();
    expect(l[chooseFor({ x: 0.45, y: 0.4 }, l, 0)]?.id).toBe("near");
  });

  it("falls back to the staged show that waited longest when no landmark is close", () => {
    const l = list();
    expect(l[chooseFor({ x: -0.2, y: 0.9 }, l, 0)]?.id).toBe("show-a");
  });

  it("skips a landmark still cooling down", () => {
    const l = list();
    const near = l[0];
    if (near) near.last = 0;
    expect(l[chooseFor({ x: 0.5, y: 0.5 }, l, COOLDOWN - 1)]?.id).not.toBe("near");
  });
});

describe("layout extras", () => {
  for (const [W, H] of [
    [390, 844],
    [1440, 900],
  ] as const) {
    it(`frames Lumen in the part of the hole that is on screen at ${W}x${H}`, () => {
      const F = buildFront(ids, W, H, rng(2));
      const v = holeView(F, W, H);
      expect(v.x).toBeGreaterThan(0);
      expect(v.x).toBeLessThan(W);
      expect(v.y).toBeGreaterThan(0);
      expect(v.y).toBeLessThan(H);
    });
  }

  it("bolts hexes whose body covers the corner buttons even when the centre is just outside", () => {
    expect(boltedAt(170 + 50, 900 - 150 - 50, 165, 1440, 900)).toBe(true);
    expect(boltedAt(700, 400, 165, 1440, 900)).toBe(false);
  });

  it("keeps spares off the hole", () => {
    const F = buildFront(ids, 1440, 900, rng(9));
    for (const l of F.loose)
      for (const g of F.hole) expect(Math.hypot(g.x - l.x, g.y - l.y)).toBeGreaterThanOrEqual(F.R * 1.25);
  });
});
