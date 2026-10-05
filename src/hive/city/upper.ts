import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  TorusGeometry,
  Vector2,
} from "three";
import { clamp, ease } from "../math";
import { Emitter } from "./emitter";
import { NEON, pagoda, roof, TILES } from "./kit";
import type { Kit, Landmark } from "./landmark";
import { plot } from "./plan";

/**
 * Kaleido: a slab tower wrapped on two faces by one giant screen each, framed in light, with floodlights along its top.
 * Its event is a takeover: every giant screen glitches hard and lands on one of the owner's projects while the frame flares.
 */
export function kaleido(k: Kit): Landmark {
  const { x, z } = plot("kaleido").at;
  const { p, boards } = k;
  const w = 170;
  const d = 130;
  const h = 760;
  p.at(x, 0, z);
  p.block("body", w, h, d, 0, 0, 0, undefined, 4242);
  p.edges(w, h, d, 0, 0, 0, NEON.cyan);
  const tex = boards.get("giant");
  const sw = w - 16;
  const sh = sw * 1.25;
  p.screen(tex, sw, sh, 0, 420, d / 2 + 1.5);
  p.screen(boards.get("giant"), d - 16, (d - 16) * 1.25, -w / 2 - 1.5, 420, 0, -Math.PI / 2);
  p.screen(boards.get("tall"), 40, 100, 0, 150, d / 2 + 1.5);
  p.block("metal", w * 0.6, 40, d * 0.6, 0, h, 0);
  p.cyl("metal", 2, 1, 90, 0, h + 40, 0, 5);
  p.box("lamp", 4, 4, 4, 0, h + 130, 0);
  p.at(0, 0, 0);
  const flare = new MeshBasicMaterial({ color: 0x40e0ff });
  const frame = new Group();
  for (const [fw, fh, fx, fz, yaw] of [
    [sw + 8, sh + 8, 0, d / 2 + 2, 0],
    [d - 8, (d - 16) * 1.25 + 8, -w / 2 - 2, 0, -Math.PI / 2],
  ] as const) {
    for (const [bw, bh, bx, by] of [
      [fw, 3, 0, fh / 2],
      [fw, 3, 0, -fh / 2],
      [3, fh, fw / 2, 0],
      [3, fh, -fw / 2, 0],
    ] as const) {
      const bar = new Mesh(new BoxGeometry(bw, bh, 2), flare);
      const holder = new Group();
      holder.position.set(x + fx, 420, z + fz);
      holder.rotation.y = yaw;
      bar.position.set(bx, by, 0);
      holder.add(bar);
      frame.add(holder);
    }
  }
  let burst = 0;
  return {
    id: "kaleido",
    name: "Kaleido",
    anchor: { x, y: 420, z: z + d / 2 },
    group: frame,
    update: (dt, t) => {
      burst = Math.max(0, burst - dt);
      const pulse = 0.6 + 0.4 * Math.sin(t * 2);
      flare.color.setRGB(0.25 * pulse + burst, 0.9 * pulse + burst * 0.3, 1 * pulse + burst);
    },
    trigger: () => {
      boards.takeover("giant");
      burst = 1.5;
    },
  };
}

/**
 * Bell Crown: a skyscraper crowned with three stacked temple roofs and an open belfry with a great bell.
 * Its event rings the bell: it swings, and a ring of light rolls out across the sky from the crown.
 */
export function bellCrown(k: Kit): Landmark {
  const { x, z } = plot("bell").at;
  const { p } = k;
  const w = 140;
  const h = 880;
  p.at(x, 0, z);
  p.block("body", w, h * 0.6, w, 0, 0, 0, undefined, 777);
  p.block("body", w * 0.82, h * 0.4, w * 0.82, 0, h * 0.6, 0, undefined, 778);
  p.edges(w, h * 0.6, w, 0, 0, 0, NEON.amber);
  p.edges(w * 0.82, h * 0.4, w * 0.82, 0, h * 0.6, 0, NEON.amber);
  for (const yy of [200, 400]) p.box("lit", w + 2, 2, w + 2, 0, yy, 0, NEON.red);
  for (const [cx, cz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const)
    p.block("wood", 8, 60, 8, (cx * w * 0.32) | 0, h, (cz * w * 0.32) | 0);
  roof(p, 0, h + 60, 0, w * 0.6, w * 0.6, 50, 18, TILES[0] ?? [0.3, 0.1, 0.1], NEON.amber);
  pagoda(p, 0, h + 100, 0, w * 0.6, 180, 3, TILES[0] ?? [0.3, 0.1, 0.1], NEON.amber);
  p.at(0, 0, 0);
  const bell = new Mesh(
    new LatheGeometry(
      [
        [0, 0],
        [14, 0],
        [12, 6],
        [10, 24],
        [6, 30],
        [0, 31],
      ].map(([a, b]) => new Vector2(a, b)),
      20,
    ),
    new MeshLambertMaterial({ color: 0xc8902a, emissive: 0x3a2008 }),
  );
  const pivot = new Group();
  pivot.position.set(x, h + 56, z);
  bell.position.y = -34;
  pivot.add(bell);
  const ringMat = new MeshBasicMaterial({
    color: 0xffc060,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const ring = new Mesh(new TorusGeometry(1, 0.02, 6, 64), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, h + 40, z);
  const group = new Group();
  group.add(pivot, ring);
  let ringT = -1;
  return {
    id: "bell",
    name: "Bell Crown",
    anchor: { x, y: h + 60, z },
    group,
    update: (dt, t) => {
      if (ringT >= 0) ringT += dt;
      const swing = ringT >= 0 ? Math.sin(ringT * 5) * 0.5 * Math.exp(-ringT * 0.6) : Math.sin(t * 0.5) * 0.02;
      pivot.rotation.z = swing;
      const e = ease(clamp(ringT / 3, 0, 1));
      ring.scale.setScalar(20 + e * 900);
      ringMat.opacity = ringT >= 0 ? (1 - e) * 0.9 : 0;
      if (ringT > 4) ringT = -1;
    },
    trigger: () => {
      ringT = 0;
    },
  };
}

/**
 * Ironbloom: a tower still being built, solid to half height and bare steel frame above, with a tower crane on top.
 * The jib turns slowly all the time; its event hoists a beam from the street to the top while welders throw sparks.
 */
export function ironbloom(k: Kit): Landmark {
  const { x, z } = plot("ironbloom").at;
  const { p, glow, rand } = k;
  const w = 120;
  const solid = 420;
  const h = 820;
  p.at(x, 0, z);
  p.block("body", w, solid, w, 0, 0, 0, undefined, 909);
  p.edges(w, solid, w, 0, 0, 0, NEON.amber);
  for (let y = solid; y < h; y += 40) {
    for (const [cx, cz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const)
      p.box("metal", 3, 40, 3, (cx * w) / 2, y + 20, (cz * w) / 2);
    p.box("metal", w, 2.5, 3, 0, y + 40, w / 2);
    p.box("metal", w, 2.5, 3, 0, y + 40, -w / 2);
    p.box("metal", 3, 2.5, w, w / 2, y + 40, 0);
    p.box("metal", 3, 2.5, w, -w / 2, y + 40, 0);
    p.strut("metal", { x: -w / 2, y, z: w / 2 }, { x: w / 2, y: y + 40, z: w / 2 }, 0.9);
  }
  p.box("metal", 10, 160, 10, w / 2 - 10, h + 80, -w / 2 + 10);
  p.at(0, 0, 0);
  const steel = new MeshLambertMaterial({ color: 0x5a6080 });
  const jib = new Group();
  jib.position.set(x + w / 2 - 10, h + 160, z - w / 2 + 10);
  const arm = new Mesh(new BoxGeometry(260, 6, 6), steel);
  arm.position.x = -90;
  const counter = new Mesh(new BoxGeometry(24, 14, 14), steel);
  counter.position.x = 40;
  const cable = new Mesh(
    new CylinderGeometry(0.4, 0.4, 1, 4).translate(0, -0.5, 0),
    new MeshBasicMaterial({ color: 0xa0a8c0 }),
  );
  cable.position.x = -200;
  const beam = new Mesh(new BoxGeometry(60, 5, 6), new MeshLambertMaterial({ color: 0xc06020 }));
  const cab = new Mesh(new BoxGeometry(4, 4, 4), new MeshBasicMaterial({ color: 0xff3030 }));
  cab.position.set(-220, 3, 0);
  jib.add(arm, counter, cable, beam, cab);
  const sparks = new Emitter(200, glow, {
    size: 5,
    colour: new Color(1.4, 0.9, 0.4),
    gravity: 60,
    drag: 0.6,
    life: 1.2,
  });
  const group = new Group();
  group.add(jib, sparks.points);
  let hoist = -1;
  const weld = { x: x + (rand() - 0.5) * w, y: solid + 60, z: z + w / 2 };
  return {
    id: "ironbloom",
    name: "Ironbloom",
    anchor: { x, y: solid + 140, z },
    group,
    update: (dt, t) => {
      jib.rotation.y = Math.sin(t * 0.12) * 1.2 + 0.4;
      let drop = 120 + Math.sin(t * 0.3) * 60;
      if (hoist >= 0) {
        hoist += dt / 8;
        drop = 160 + h - ease(clamp(hoist, 0, 1)) * (h + 60);
        if (rand() < dt * 30)
          sparks.emit(
            { x: weld.x, y: weld.y + rand() * 200, z: weld.z },
            6,
            (r) => [(r() - 0.5) * 40, r() * 40, r() * 30],
            rand,
          );
        if (hoist > 1.2) hoist = -1;
      } else if (rand() < dt * 2) sparks.emit(weld, 4, (r) => [(r() - 0.5) * 30, r() * 30, r() * 20], rand);
      cable.scale.y = drop;
      beam.position.set(-200, -drop, 0);
      beam.rotation.y = Math.sin(t * 0.7) * 0.3;
      sparks.update(dt);
    },
    trigger: () => {
      hoist = 0;
    },
  };
}
