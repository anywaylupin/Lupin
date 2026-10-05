import { Color, Group } from "three";
import { Emitter } from "./emitter";
import { NEON } from "./kit";
import type { Kit, Landmark } from "./landmark";
import { plot } from "./plan";

/**
 * Bamboo Veil: a tower wrapped in bamboo and hanging vines, with a small grove on every setback.
 * Its event sends a swarm of fireflies out of the leaves and up into the night.
 */
export function bambooVeil(k: Kit): Landmark {
  const { x, z } = plot("bamboo").at;
  const { p, glow, rand } = k;
  const leaf: [number, number, number] = [0.12, 0.32, 0.14];
  const dark: [number, number, number] = [0.06, 0.2, 0.1];
  p.at(x, 0, z);
  let y = 0;
  let w = 110;
  for (const h of [260, 200, 160]) {
    p.block("body", w, h, w, 0, y, 0, undefined, 3131 + y);
    p.edges(w, h, w, 0, y, 0, NEON.green);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = w * 0.62;
      p.cyl("plant", 1.2, 1, h * (0.6 + rand() * 0.5), Math.cos(a) * r, y, Math.sin(a) * r, 5, leaf);
    }
    for (let i = 0; i < 6; i++) {
      const tx = (rand() - 0.5) * w * 0.8;
      const tz = (rand() - 0.5) * w * 0.8;
      p.cyl("wood", 2, 1.5, 22, tx, y + h, tz, 5);
      p.box("plant", 26, 18, 26, tx, y + h + 28, tz, i % 2 ? leaf : dark);
    }
    for (let i = 0; i < 10; i++) {
      const vx = (rand() - 0.5) * w;
      p.box("plant", 2.5, h * 0.4, 2.5, vx, y + h * 0.8, w / 2 + 2, dark);
    }
    y += h;
    w *= 0.75;
  }
  p.at(0, 0, 0);
  const flies = new Emitter(260, glow, { size: 6, colour: new Color(0.9, 1.4, 0.4), gravity: -6, drag: 0.7, life: 6 });
  const group = new Group();
  group.add(flies.points);
  let swarm = -1;
  return {
    id: "bamboo",
    name: "Bamboo Veil",
    anchor: { x, y: 360, z },
    group,
    update: (dt) => {
      if (swarm >= 0) {
        swarm += dt;
        if (swarm < 3)
          flies.emit(
            { x: x + (rand() - 0.5) * 110, y: 100 + rand() * 500, z: z + 60 },
            4,
            (r) => [(r() - 0.5) * 60, r() * 30, r() * 50],
            rand,
          );
        if (swarm > 3) swarm = -1;
      } else if (rand() < dt * 3)
        flies.emit(
          { x: x + (rand() - 0.5) * 110, y: 50 + rand() * 600, z: z + 60 },
          1,
          (r) => [(r() - 0.5) * 10, r() * 6, r() * 10],
          rand,
        );
      flies.update(dt);
    },
    trigger: () => {
      swarm = 0;
    },
  };
}
