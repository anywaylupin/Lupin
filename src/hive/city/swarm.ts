import type { Rand } from "../math";
import type { Vec3 } from "./plan";

export interface Bee extends Vec3 {
  vx: number;
  vy: number;
  vz: number;
  swarm: number;
  phase: number;
}

export interface Swarm {
  target: Vec3;
  next: number;
}

export const BEE_SPEED = 90;
/** Bees push apart inside this many units, about two bee lengths at the size the city draws them. */
const PERSONAL = 24;

/** Swarms of seven bees start around their first targets; the seeded spread keeps them from overlapping on load. */
export function createBees(targets: readonly Vec3[], rand: Rand): Bee[] {
  return targets.flatMap((t, swarm) =>
    Array.from({ length: 7 }, () => ({
      x: t.x + (rand() - 0.5) * 80,
      y: t.y + (rand() - 0.5) * 50,
      z: t.z + (rand() - 0.5) * 80,
      vx: 0,
      vy: 0,
      vz: 0,
      swarm,
      phase: rand() * 6,
    })),
  );
}

/**
 * Flocking for the bee swarms: each bee steers toward its swarm's centre and target, matches its neighbours' heading and keeps its distance.
 * Targets move every five to nine seconds, picked by `retarget`, so swarms roam the whole screen instead of circling one spot.
 */
export function stepBees(
  bees: Bee[],
  swarms: Swarm[],
  dt: number,
  retarget: (swarm: number) => Vec3,
  rand: Rand,
): void {
  swarms.forEach((s, i) => {
    s.next -= dt;
    if (s.next > 0) return;
    s.target = retarget(i);
    s.next = 5 + rand() * 4;
  });
  for (const b of bees) {
    const mates = bees.filter((o) => o.swarm === b.swarm && o !== b);
    const n = mates.length || 1;
    const sum = (f: (o: Bee) => number) => mates.reduce((a, o) => a + f(o), 0) / n;
    let ax = (sum((o) => o.x) - b.x) * 0.6 + (sum((o) => o.vx) - b.vx) * 0.5;
    let ay = (sum((o) => o.y) - b.y) * 0.6 + (sum((o) => o.vy) - b.vy) * 0.5;
    let az = (sum((o) => o.z) - b.z) * 0.6 + (sum((o) => o.vz) - b.vz) * 0.5;
    for (const o of mates) {
      const dx = b.x - o.x;
      const dy = b.y - o.y;
      const dz = b.z - o.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < PERSONAL * PERSONAL && d2 > 0) {
        ax += (dx / d2) * 6000;
        ay += (dy / d2) * 6000;
        az += (dz / d2) * 6000;
      }
    }
    const t = swarms[b.swarm]?.target ?? b;
    ax += (t.x - b.x) * 0.5;
    ay += (t.y - b.y) * 0.5;
    az += (t.z - b.z) * 0.5;
    b.vx += ax * dt;
    b.vy += ay * dt;
    b.vz += az * dt;
    const sp = Math.hypot(b.vx, b.vy, b.vz);
    if (sp > BEE_SPEED) {
      b.vx *= BEE_SPEED / sp;
      b.vy *= BEE_SPEED / sp;
      b.vz *= BEE_SPEED / sp;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.z += b.vz * dt;
  }
}
