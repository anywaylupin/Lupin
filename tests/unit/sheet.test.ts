import { describe, expect, it } from "vitest";
import { ax, keyOf } from "../../src/hive/hex";
import { buildFront } from "../../src/hive/layout";
import { rng } from "../../src/hive/math";
import {
  drop,
  emptyGaps,
  heldPose,
  hitLoose,
  isLocked,
  isOpen,
  isPlain,
  magnetFor,
  pickUp,
  SETTLE_MS,
  SNAP_MS,
  stepSnap,
  tearOut,
} from "../../src/hive/sheet";

const ids = ["about", "projects", "stack", "experience", "now", "hours"];
const W = 1440;
const H = 900;
const sheet = () => buildFront(ids, W, H, rng(11));

describe("plain and bolted hexes", () => {
  it("never treats content or hole cells as plain or bolted", () => {
    const F = sheet();
    for (const p of F.powered) {
      expect(isPlain(F, p.key)).toBe(false);
      expect(isLocked(F, p.q, p.r, W, H)).toBe(false);
    }
    for (const g of F.hole) {
      expect(isPlain(F, g.key)).toBe(false);
      expect(isOpen(F, g.key)).toBe(true);
    }
  });

  it("bolts the hexes under the bottom corners and only a few others", () => {
    const F = sheet();
    const cornerCell = [...Array(40).keys()]
      .flatMap((a) => [...Array(40).keys()].map((b) => [a - 20, b - 20] as const))
      .find(([q, r]) => {
        const p = ax(q, r, F.R);
        const sx = p.x - F.home.x + W / 2;
        const sy = p.y - F.home.y + H / 2;
        return sx > 0 && sx < 170 && sy < H && sy > H - 150 - F.R * 0.5;
      });
    expect(cornerCell).toBeDefined();
    if (cornerCell) expect(isLocked(F, cornerCell[0], cornerCell[1], W, H)).toBe(true);
    let bolted = 0;
    let onScreen = 0;
    for (let q = -20; q < 20; q++) {
      for (let r = -20; r < 20; r++) {
        const p = ax(q, r, F.R);
        const sx = p.x - F.home.x + W / 2;
        const sy = p.y - F.home.y + H / 2;
        if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
        onScreen++;
        if (isLocked(F, q, r, W, H)) bolted++;
      }
    }
    expect(bolted).toBeGreaterThan(0);
    expect(bolted / onScreen).toBeLessThan(0.12);
  });
});

describe("drag state", () => {
  it("tears a plain hex out, opening its slot", () => {
    const F = sheet();
    const key = keyOf(-5, 0);
    const p = ax(-5, 0, F.R);
    const before = emptyGaps(F).length;
    const grab = tearOut(F, key, -5, 0, { x: p.x + 4, y: p.y - 2 });
    expect(grab.ox).toBe(4);
    expect(F.removed.has(key)).toBe(true);
    expect(isOpen(F, key)).toBe(true);
    expect(emptyGaps(F)).toHaveLength(before + 1);
  });

  it("picks a loose hex up to the top of the stack and frees its seat", () => {
    const F = sheet();
    const first = F.loose[0]!;
    first.seat = F.hole[0]!.key;
    const grab = pickUp(F, 0, { x: first.ax, y: first.ay });
    expect(grab?.loose).toBe(first);
    expect(F.loose.at(-1)).toBe(first);
    expect(first.seat).toBeNull();
  });

  it("hit tests the topmost loose hex", () => {
    const F = sheet();
    const l = F.loose[0]!;
    expect(hitLoose(F, { x: l.ax, y: l.ay })).toBe(0);
    expect(hitLoose(F, { x: l.ax + F.R * 3, y: l.ay + F.R * 3 })).not.toBe(0);
  });

  it("pulls toward a nearby empty slot, bursts at once on drop and snaps in", () => {
    const F = sheet();
    const slot = F.hole[0]!;
    const l = F.loose[0]!;
    l.x = slot.x + F.R * 0.6;
    l.y = slot.y;
    const m = heldPose(F, l, true);
    expect(m?.g.key).toBe(slot.key);
    expect(l.ax).toBeLessThan(l.x);
    drop(F, l, 1000);
    expect(l.seat).toBe(slot.key);
    expect(l.snap?.dur).toBe(SNAP_MS);
    expect(F.fx).toEqual([{ x: slot.x, y: slot.y, t0: 1000 }]);
    stepSnap(F, l, 1000 + SNAP_MS, false);
    expect(l.snap).toBeNull();
    expect(l.x).toBeCloseTo(slot.x);
    expect(F.fx).toHaveLength(1);
    expect(isOpen(F, slot.key)).toBe(false);
  });

  it("does not pull without the magnet and stays loose when dropped far away", () => {
    const F = sheet();
    const l = F.loose[0]!;
    l.x = F.hole[0]!.x + F.R * 0.6;
    l.y = F.hole[0]!.y;
    expect(heldPose(F, l, false)).toBeNull();
    expect(l.ax).toBe(l.x);
    l.x = 1e5;
    l.ax = 1e5;
    expect(magnetFor(F, l)).toBeNull();
    drop(F, l, 0);
    expect(l.seat).toBeNull();
  });

  it("settles a lifted hex back down when it misses every slot", () => {
    const F = sheet();
    const l = F.loose[0]!;
    Object.assign(l, { x: 1e5, y: 0, ax: 1e5, ay: 0 });
    drop(F, l, 0, 0.2, 12);
    expect(l.snap).toMatchObject({ fy: -12, to: { x: 1e5, y: 0, rot: 0.2 }, dur: SETTLE_MS });
    expect(F.fx).toHaveLength(0);
    stepSnap(F, l, SETTLE_MS, false);
    expect(l.y).toBe(0);
    expect(l.rot).toBeCloseTo(0.2);
  });
});
