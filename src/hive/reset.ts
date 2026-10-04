import type { Point } from "./hex";
import { slotAt, type FrontSheet } from "./layout";

export const RESET_MS = 520;
export const STAGGER_MS = 45;
export const STAGGER_CAP_MS = 500;
/** Grace after the last hex lands before the sheet heals, so the seat burst starts on a hex that is still loose. */
export const SETTLE_GRACE_MS = 80;

export interface ResetMove {
  hex: number;
  seat: string | null;
  to: Point & { rot: number };
  delay: number;
}

export interface ResetPlan {
  moves: ResetMove[];
  settleAfter: number;
}

/**
 * Reset sends every loose hex to the nearest slot that was pulled open, one after another, and returns the spares to where they started beside the broken patch.
 * Pairs are chosen greedily by the shortest remaining distance, so hexes near a slot never cross the sheet to a farther one.
 * The prototype treated a hex still flying into a pulled slot as not filling it, which could send two hexes to one slot; here any seated hex fills its slot.
 */
export function planReset(F: FrontSheet, reduced = false): ResetPlan {
  const targets = [...F.removed].filter((k) => !F.loose.some((h) => h.seat === k)).map((k) => slotAt(k, F.R));
  const free = F.loose
    .map((_, i) => i)
    .filter((i) => {
      const seat = F.loose[i]?.seat;
      return !(seat && F.removed.has(seat));
    });
  const moves: ResetMove[] = [];
  const delay = () => Math.min(moves.length * STAGGER_MS, STAGGER_CAP_MS);
  while (targets.length && free.length) {
    let best = { fi: 0, ti: 0, d: Infinity };
    for (const [fi, hi] of free.entries()) {
      const h = F.loose[hi];
      if (!h) continue;
      for (const [ti, g] of targets.entries()) {
        const d = Math.hypot(g.x - h.ax, g.y - h.ay);
        if (d < best.d) best = { fi, ti, d };
      }
    }
    const [hi] = free.splice(best.fi, 1);
    const [g] = targets.splice(best.ti, 1);
    if (hi === undefined || !g) break;
    moves.push({ hex: hi, seat: g.key, to: { x: g.x, y: g.y, rot: 0 }, delay: delay() });
  }
  const homes = F.initLoose.slice();
  for (const hi of free) {
    const h = F.loose[hi];
    if (!h) continue;
    let best = { i: -1, d: Infinity };
    for (const [i, p] of homes.entries()) {
      const d = Math.hypot(p.x - h.ax, p.y - h.ay);
      if (d < best.d) best = { i, d };
    }
    const [p] = best.i >= 0 ? homes.splice(best.i, 1) : [];
    if (p) moves.push({ hex: hi, seat: null, to: { x: p.x, y: p.y, rot: p.rot }, delay: delay() });
  }
  const settleAfter = (reduced ? 0 : RESET_MS + Math.min(moves.length * STAGGER_MS, STAGGER_CAP_MS)) + SETTLE_GRACE_MS;
  return { moves, settleAfter };
}

export function applyReset(F: FrontSheet, plan: ResetPlan, now: number): void {
  for (const m of plan.moves) {
    const h = F.loose[m.hex];
    if (!h) continue;
    h.seat = m.seat;
    h.snap = {
      fx: h.ax,
      fy: h.ay,
      frot: h.rot,
      to: m.to,
      t0: now,
      dur: RESET_MS,
      delay: m.delay,
      curve: "inOut",
      burst: true,
    };
  }
}

/** Hexes resting in pulled slots rejoin the sheet: they stop being loose and their slots stop being open. */
export function settleReset(F: FrontSheet): void {
  F.loose = F.loose.filter((h) => {
    if (h.seat && F.removed.has(h.seat) && !h.snap) {
      F.removed.delete(h.seat);
      return false;
    }
    return true;
  });
}
