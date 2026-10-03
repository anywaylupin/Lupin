import { describe, expect, it } from "vitest";
import { ax, keyOf } from "../../src/hive/hex";
import { buildFront, type FrontSheet } from "../../src/hive/layout";
import { rng } from "../../src/hive/math";
import {
  applyReset,
  planReset,
  RESET_MS,
  SETTLE_GRACE_MS,
  settleReset,
  STAGGER_CAP_MS,
  STAGGER_MS,
} from "../../src/hive/reset";
import { drop, emptyGaps, stepSnap, tearOut } from "../../src/hive/sheet";

const ids = ["about", "projects", "stack", "experience", "now", "hours"];
const sheet = () => buildFront(ids, 1440, 900, rng(3));

function pull(F: FrontSheet, q: number, r: number, to: { x: number; y: number }) {
  const { loose } = tearOut(F, keyOf(q, r), q, r, ax(q, r, F.R));
  Object.assign(loose, { x: to.x, y: to.y, ax: to.x, ay: to.y });
  return loose;
}

function finish(F: FrontSheet) {
  for (const l of F.loose) stepSnap(F, l, 1e9, false);
  settleReset(F);
}

describe("reset planning", () => {
  it("does nothing on an untouched sheet except send spares home", () => {
    const F = sheet();
    const plan = planReset(F);
    expect(plan.moves.every((m) => m.seat === null)).toBe(true);
    for (const m of plan.moves) expect(m.to).toEqual(F.initLoose[m.hex]);
  });

  it("matches each pulled hex to its nearest open slot", () => {
    const F = sheet();
    const a = ax(-4, 0, F.R);
    const b = ax(-4, 3, F.R);
    pull(F, -4, 0, { x: b.x + 5, y: b.y });
    pull(F, -4, 3, { x: a.x - 5, y: a.y });
    const plan = planReset(F);
    const seated = plan.moves.filter((m) => m.seat);
    expect(seated).toHaveLength(2);
    const byHex = Object.fromEntries(seated.map((m) => [m.hex, m.seat]));
    expect(byHex[F.loose.length - 2]).toBe(keyOf(-4, 3));
    expect(byHex[F.loose.length - 1]).toBe(keyOf(-4, 0));
  });

  it("staggers moves 45 ms apart and caps the delay at 500 ms", () => {
    const F = sheet();
    for (let q = -8; q < 6; q++) pull(F, q, -3, ax(q, -2, F.R));
    const plan = planReset(F);
    plan.moves.forEach((m, i) => expect(m.delay).toBe(Math.min(i * STAGGER_MS, STAGGER_CAP_MS)));
    expect(Math.max(...plan.moves.map((m) => m.delay))).toBe(STAGGER_CAP_MS);
    expect(plan.settleAfter).toBe(RESET_MS + STAGGER_CAP_MS + SETTLE_GRACE_MS);
  });

  it("settles almost at once under reduced motion", () => {
    expect(planReset(sheet(), true).settleAfter).toBe(SETTLE_GRACE_MS);
  });

  it("frees a hex sitting in the original hole and sends it home", () => {
    const F = sheet();
    const spare = F.loose[0]!;
    const slot = F.hole[0]!;
    Object.assign(spare, { x: slot.x, y: slot.y, ax: slot.x, ay: slot.y });
    drop(F, spare, 0);
    stepSnap(F, spare, 1e9, false);
    expect(emptyGaps(F)).toHaveLength(F.hole.length - 1);
    applyReset(F, planReset(F), 0);
    finish(F);
    expect(
      emptyGaps(F)
        .map((g) => g.key)
        .sort(),
    ).toEqual(F.hole.map((g) => g.key).sort());
  });

  it("never sends two hexes to one slot when one is still flying in", () => {
    const F = sheet();
    const target = ax(-5, 1, F.R);
    const flying = pull(F, -5, 1, { x: target.x + 30, y: target.y });
    drop(F, flying, 0);
    expect(flying.snap).not.toBeNull();
    pull(F, -6, 2, ax(-6, 3, F.R));
    const plan = planReset(F);
    const seats = plan.moves.map((m) => m.seat).filter(Boolean);
    expect(new Set(seats).size).toBe(seats.length);
    expect(seats).not.toContain(keyOf(-5, 1));
  });
});

describe("reset end to end", () => {
  it("restores the original hole and the original spares", () => {
    const F = sheet();
    const start = F.initLoose.map((p) => ({ ...p }));
    pull(F, -3, -2, { x: 0, y: 400 });
    pull(F, 2, 3, { x: -300, y: 0 });
    pull(F, -6, 1, { x: 200, y: -300 });
    applyReset(F, planReset(F), 0);
    finish(F);
    expect(F.removed.size).toBe(0);
    expect(F.loose).toHaveLength(start.length);
    expect(
      emptyGaps(F)
        .map((g) => g.key)
        .sort(),
    ).toEqual(F.hole.map((g) => g.key).sort());
    const rest = F.loose.map((l) => ({ x: l.x, y: l.y, rot: l.rot }));
    for (const p of start)
      expect(rest.some((l) => Math.abs(l.x - p.x) < 1e-9 && Math.abs(l.y - p.y) < 1e-9)).toBe(true);
  });
});
