import {
  AdditiveBlending,
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
} from "three";
import { Emitter } from "./emitter";
import { waterMaterial } from "./ground";
import { NEON, roof, TILES } from "./kit";
import type { Kit, Landmark } from "./landmark";
import { plot } from "./plan";

const dummy = new Object3D();

/**
 * Steamvault: a windowless data stack ribbed with cooling fins and banded with amber vent grilles that breathe a little steam.
 * Its event blasts every vent at once in a column of steam while the stack's lights stutter.
 */
export function steamvault(k: Kit): Landmark {
  const { x, z } = plot("steamvault").at;
  const { p, glow, rand } = k;
  const w = 120;
  const h = 780;
  p.at(x, 0, z);
  p.block("metal", w, h, w, 0, 0, 0);
  for (let i = -5; i <= 5; i++) p.block("metal", 3, h - 40, 14, (i * w) / 11, 0, w / 2 + 7);
  for (const c of [-1, 1]) p.cyl("metal", 10, 10, 50, c * 30, h, 0, 10);
  p.at(0, 0, 0);
  const vents = new MeshBasicMaterial({ color: 0xffa040 });
  const bands = new Group();
  for (let y = 80; y < h; y += 110) {
    const band = new Mesh(new BoxGeometry(w + 4, 6, w + 4), vents);
    band.position.set(x, y, z);
    bands.add(band);
  }
  const steam = new Emitter(260, glow, {
    size: 60,
    colour: new Color(0.35, 0.33, 0.4),
    gravity: -14,
    drag: 0.8,
    life: 4.5,
    additive: false,
  });
  const group = new Group();
  group.add(bands, steam.points);
  let blast = -1;
  return {
    id: "steamvault",
    name: "Steamvault",
    anchor: { x, y: h * 0.6, z: z + w / 2 },
    group,
    update: (dt, t) => {
      const flick = blast >= 0 ? (Math.sin(t * 40) > 0 ? 1.4 : 0.3) : 0.7 + 0.3 * Math.sin(t * 1.5);
      vents.color.setRGB(1 * flick, 0.6 * flick, 0.25 * flick);
      if (blast >= 0) {
        blast += dt;
        steam.emit(
          { x: x + (rand() - 0.5) * 60, y: h + 40, z },
          3,
          (r) => [(r() - 0.5) * 30, 80 + r() * 60, (r() - 0.5) * 30],
          rand,
        );
        steam.emit(
          { x, y: 80 + Math.floor(rand() * 7) * 110, z: z + w / 2 + 4 },
          2,
          (r) => [(r() - 0.5) * 30, 10, 60 + r() * 40],
          rand,
        );
        if (blast > 2.5) blast = -1;
      } else if (rand() < dt * 3)
        steam.emit({ x: x + (rand() - 0.5) * 60, y: h + 50, z }, 1, (r) => [(r() - 0.5) * 10, 30 + r() * 20, 0], rand);
      steam.update(dt);
    },
    trigger: () => {
      blast = 0;
    },
  };
}

/**
 * Starberth: a broad tower carrying a rooftop cradle for the Wanderer, ringed with landing lights that chase round it.
 * Its event calls the Wanderer down to land, wait and lift off again.
 */
export function starberth(k: Kit, dock: () => void): Landmark {
  const { x, z } = plot("starberth").at;
  const { p } = k;
  const w = 160;
  const h = 540;
  p.at(x, 0, z);
  p.block("body", w, h, w * 0.8, 0, 0, 0, undefined, 5150);
  p.edges(w, h, w * 0.8, 0, 0, 0, NEON.cyan);
  p.cyl("metal", 110, 90, 10, 0, h, 0, 32);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    p.strut(
      "metal",
      { x: Math.cos(a) * 60, y: h - 60, z: Math.sin(a) * 50 },
      { x: Math.cos(a) * 105, y: h + 4, z: Math.sin(a) * 105 },
      2.5,
    );
    p.strut(
      "metal",
      { x: Math.cos(a) * 100, y: h + 10, z: Math.sin(a) * 100 },
      { x: Math.cos(a) * 80, y: h + 40, z: Math.sin(a) * 80 },
      2,
    );
  }
  p.ring(0, h + 11, 0, 70, NEON.amber, 32);
  p.at(0, 0, 0);
  const n = 24;
  const lights = new InstancedMesh(new BoxGeometry(5, 3, 5), new MeshBasicMaterial(), n);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    dummy.position.set(x + Math.cos(a) * 104, h + 11, z + Math.sin(a) * 104);
    dummy.updateMatrix();
    lights.setMatrixAt(i, dummy.matrix);
    lights.setColorAt(i, new Color(0, 0, 0));
  }
  const group = new Group();
  group.add(lights);
  const on = new Color(1.5, 0.4, 0.9);
  const off = new Color(0.15, 0.05, 0.1);
  return {
    id: "starberth",
    name: "Starberth",
    anchor: { x, y: h + 40, z },
    group,
    update: (_dt, t) => {
      const head = Math.floor(t * 12) % n;
      for (let i = 0; i < n; i++) lights.setColorAt(i, (head - i + n) % n < 4 ? on : off);
      if (lights.instanceColor) lights.instanceColor.needsUpdate = true;
    },
    trigger: dock,
  };
}

/**
 * Lotus Pillar: a raised stone terrace holding a lotus pond, and in the pond a small two-roofed shrine standing on a single pillar.
 * Hologram koi circle under the pads; its event lights the pads in a ripple out from the pillar and lifts petals into the air.
 */
export function lotusPillar(k: Kit): Landmark {
  const { x, z } = plot("lotus").at;
  const { p, glow, rand, time } = k;
  const top = 40;
  const pondR = 110;
  p.at(x, 0, z);
  p.block("stone", 300, top, 300, 0, 0, 0);
  p.loop(
    [
      [-150, top + 0.5, -150],
      [150, top + 0.5, -150],
      [150, top + 0.5, 150],
      [-150, top + 0.5, 150],
    ],
    NEON.pink,
  );
  p.cyl("stone", pondR + 6, pondR + 6, 4, 0, top, 0, 40);
  p.cyl("stone", 8, 6, 52, 0, top, 0, 10);
  p.block("wood", 44, 26, 44, 0, top + 52, 0);
  roof(p, 0, top + 78, 0, 36, 36, 16, 8, TILES[0] ?? [0.3, 0.1, 0.1], NEON.amber);
  roof(p, 0, top + 92, 0, 22, 22, 14, 6, TILES[0] ?? [0.3, 0.1, 0.1], NEON.amber);
  for (const s of [-1, 1]) p.box("lamp", 4, 6, 4, s * 30, top + 70, 26);
  p.at(0, 0, 0);
  const pond = new Mesh(new CircleGeometry(pondR, 40), waterMaterial(time));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(x, top + 4.5, z);
  const count = 34;
  const pads = new InstancedMesh(new CylinderGeometry(9, 9, 1, 12), new MeshBasicMaterial(), count);
  const dist: number[] = [];
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const r = 22 + Math.sqrt(rand()) * (pondR - 30);
    dist.push(r);
    dummy.position.set(x + Math.cos(a) * r, top + 5, z + Math.sin(a) * r);
    dummy.scale.setScalar(0.6 + rand() * 0.6);
    dummy.updateMatrix();
    pads.setMatrixAt(i, dummy.matrix);
    pads.setColorAt(i, new Color(0.1, 0.4, 0.2));
  }
  const koi = new InstancedMesh(
    new SphereGeometry(1, 8, 6).scale(7, 2, 3),
    new MeshBasicMaterial({
      color: 0xff8030,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    6,
  );
  const petals = new Emitter(160, glow, {
    size: 7,
    colour: new Color(1.4, 0.5, 0.9),
    gravity: -10,
    drag: 0.6,
    life: 5,
  });
  const group = new Group();
  group.add(pond, pads, koi, petals.points);
  let wave = -1;
  const base = new Color(0.1, 0.4, 0.2);
  const lit = new Color();
  return {
    id: "lotus",
    name: "Lotus Pillar",
    anchor: { x, y: top + 60, z },
    group,
    update: (dt, t) => {
      for (let i = 0; i < 6; i++) {
        const a = t * (0.3 + i * 0.05) + i;
        const r = 40 + i * 9;
        dummy.position.set(x + Math.cos(a) * r, top + 3, z + Math.sin(a) * r);
        dummy.rotation.set(0, -a, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        koi.setMatrixAt(i, dummy.matrix);
      }
      koi.instanceMatrix.needsUpdate = true;
      if (wave >= 0) wave += dt;
      for (let i = 0; i < count; i++) {
        const front = wave >= 0 ? Math.max(0, 1 - Math.abs((dist[i] ?? 0) - wave * 50) / 20) : 0;
        lit.copy(base).lerp(NEON_PINK, front);
        pads.setColorAt(i, lit);
      }
      if (pads.instanceColor) pads.instanceColor.needsUpdate = true;
      if (wave >= 0 && rand() < dt * 25) {
        const a = rand() * Math.PI * 2;
        const r = wave * 50;
        petals.emit(
          { x: x + Math.cos(a) * r, y: top + 6, z: z + Math.sin(a) * r },
          2,
          (q) => [(q() - 0.5) * 10, 15 + q() * 15, (q() - 0.5) * 10],
          rand,
        );
      }
      if (wave > 3) wave = -1;
      petals.update(dt);
    },
    trigger: () => {
      wave = 0;
    },
  };
}

const NEON_PINK = new Color(1.6, 0.4, 1.0);
