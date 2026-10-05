import {
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PointLight,
  TorusGeometry,
} from "three";
import { clamp } from "../math";
import { Emitter } from "./emitter";
import { HUES, NEON, TILES } from "./kit";
import type { Kit, Landmark } from "./landmark";
import { LEVEL, plot, type Vec3 } from "./plan";
import { galleon } from "./ships";

/**
 * Lantern Steps: a night market climbing the cliff in five terraces of stalls under strings of lanterns, with candles floating over it.
 * Its event releases a flight of sky lanterns that climbs past the high ground.
 */
export function lanternSteps(k: Kit, release: (at: Vec3) => void): Landmark {
  const { x } = plot("lantern").at;
  const { p, glow, rand } = k;
  const e = LEVEL.edge;
  p.at(x, 0, 0);
  for (let i = 0; i < 5; i++) {
    const y = LEVEL.under + i * 42;
    const depth = 150 - i * 28;
    p.block("stone", 280, 6, depth, 0, y, e + depth / 2);
    p.box("lit", 280, 0.8, 0.8, 0, y + 6, e + depth, i % 2 ? NEON.pink : NEON.amber);
    for (let s = -120; s < 120; s += 26 + rand() * 14) {
      const sd = e + depth - 18 - rand() * 10;
      p.block("wood", 16, 16, 12, s, y + 6, sd);
      p.block("roof", 22, 1.5, 18, s, y + 22, sd, TILES[Math.floor(rand() * 3)]);
      if (rand() < 0.5) p.box("lamp", 2, 3, 2, s + 8, y + 18, sd + 7);
    }
    for (let s = -130; s < 130; s += 20) {
      const sag = Math.sin(((s + 130) / 260) * Math.PI * 4) * 4;
      p.line(
        [s, y + 40 - Math.abs(sag), e + depth - 4],
        [s + 20, y + 40 - Math.abs(Math.sin(((s + 150) / 260) * Math.PI * 4) * 4), e + depth - 4],
        NEON.amber,
        0.6,
      );
      p.box("lamp", 3, 4, 3, s, y + 38 - Math.abs(sag), e + depth - 4);
    }
  }
  p.at(0, 0, 0);
  const candles = new Emitter(80, glow, {
    size: 10,
    colour: new Color(1.5, 0.95, 0.5),
    gravity: -1.5,
    drag: 0.9,
    life: 12,
  });
  const group = new Group();
  group.add(candles.points);
  return {
    id: "lantern",
    name: "Lantern Steps",
    anchor: { x, y: LEVEL.under + 100, z: e + 80 },
    group,
    update: (dt) => {
      if (rand() < dt * 6)
        candles.emit(
          { x: x + (rand() - 0.5) * 260, y: LEVEL.under + 30 + rand() * 120, z: e + 40 + rand() * 100 },
          1,
          (r) => [(r() - 0.5) * 3, r() * 2, (r() - 0.5) * 3],
          rand,
        );
      candles.update(dt);
    },
    trigger: () => release({ x, y: LEVEL.under + 150, z: e + 70 }),
  };
}

/**
 * Rust Cove: the pirates' hidden harbour, a canal under arches of rusted pipe with a galleon moored at a plank dock.
 * Its event fires the ship's salute: muzzle flashes along the hull, smoke, and the whole cave lighting up for an instant.
 */
export function rustCove(k: Kit): Landmark {
  const { x, z } = plot("rustcove").at;
  const { p, glow, rand } = k;
  const rust = new MeshLambertMaterial({ color: 0x5a3020, emissive: 0x100604 });
  const group = new Group();
  for (let i = 0; i < 6; i++) {
    const arch = new Mesh(new TorusGeometry(140, 5 + (i % 2) * 3, 6, 24, Math.PI), rust);
    arch.position.set(x, LEVEL.under, z + i * 50 - 60);
    group.add(arch);
  }
  p.at(x, 0, 0);
  for (const s of [-1, 1]) p.block("wood", 30, 8, 340, s * 140, LEVEL.under, z + 60);
  for (let i = 0; i < 8; i++) p.box("lamp", 3, 4, 3, (i % 2 ? 1 : -1) * 128, LEVEL.under + 20, z - 80 + i * 45);
  p.line([-140, LEVEL.under + 160, z - 60], [140, LEVEL.under + 160, z - 60], HUES[0] ?? NEON.pink);
  p.at(0, 0, 0);
  const ship = galleon(0x40e0ff);
  ship.scale.setScalar(150);
  ship.position.set(x, LEVEL.water + 8, z + 60);
  ship.rotation.y = Math.PI / 2;
  const flash = new PointLight(0xffa040, 0, 700, 1.6);
  flash.position.set(x, LEVEL.under + 60, z + 60);
  const smoke = new Emitter(160, glow, {
    size: 30,
    colour: new Color(0.35, 0.3, 0.32),
    gravity: -6,
    drag: 0.6,
    life: 4,
    additive: false,
  });
  const muzzle = new Emitter(120, glow, { size: 14, colour: new Color(1.6, 1, 0.4), gravity: 0, drag: 0.2, life: 0.4 });
  group.add(ship, flash, smoke.points, muzzle.points);
  let salute = -1;
  return {
    id: "rustcove",
    name: "Rust Cove",
    anchor: { x, y: LEVEL.under + 40, z: z + 60 },
    group,
    update: (dt, t) => {
      ship.rotation.z = Math.sin(t * 0.8) * 0.03;
      ship.position.y = LEVEL.water + 8 + Math.sin(t * 1.1) * 1.5;
      let light = 0;
      if (salute >= 0) {
        const before = salute;
        salute += dt;
        for (let i = 0; i < 4; i++) {
          const at = i * 0.4;
          if (before < at && salute >= at) {
            const gun = { x: x + 30, y: LEVEL.water + 14, z: z + 10 + i * 30 };
            muzzle.emit(gun, 20, (r) => [40 + r() * 40, (r() - 0.5) * 20, (r() - 0.5) * 20], rand);
            smoke.emit(gun, 10, (r) => [10 + r() * 20, 5 + r() * 10, (r() - 0.5) * 10], rand);
          }
          light = Math.max(light, 1 - Math.abs(salute - at) * 6);
        }
        if (salute > 3) salute = -1;
      }
      flash.intensity = clamp(light, 0, 1) * 8e4;
      smoke.update(dt);
      muzzle.update(dt);
    },
    trigger: () => {
      salute = 0;
    },
  };
}

/**
 * The Crucible: a foundry of furnaces and chimneys in the undercity, its mouths glowing all night.
 * Its event tips the great ladle: a stream of molten metal pours into the moulds and the whole cavern lights orange.
 */
export function crucible(k: Kit): Landmark {
  const { x, z } = plot("crucible").at;
  const { p, glow, rand } = k;
  const base = LEVEL.under;
  p.at(x, 0, z);
  for (const [fx, fz, r, h] of [
    [-90, -40, 40, 90],
    [0, -70, 50, 120],
    [90, -30, 36, 80],
  ] as const) {
    p.cyl("metal", r, r * 0.8, h, fx, base, fz, 14);
    p.box("lit", r * 0.8, 14, 2, fx, base + 20, fz + r * 0.9, NEON.amber);
  }
  for (const [cx, cz] of [
    [-120, -90],
    [-40, -110],
    [60, -120],
    [140, -90],
  ] as const)
    p.cyl("metal", 12, 9, 300, cx, base, cz, 10);
  p.block("metal", 260, 30, 80, 0, base, 60);
  p.at(0, 0, 0);
  const ladle = new Mesh(new CylinderGeometry(28, 20, 34, 14), new MeshLambertMaterial({ color: 0x3a3a48 }));
  const pivot = new Group();
  pivot.position.set(x, base + 150, z + 20);
  ladle.position.y = -20;
  pivot.add(ladle);
  const stream = new Mesh(
    new CylinderGeometry(4, 6, 1, 8).translate(0, -0.5, 0),
    new MeshBasicMaterial({ color: 0xffa030 }),
  );
  stream.position.set(x + 30, base + 140, z + 20);
  const light = new PointLight(0xff7020, 2e4, 900, 1.6);
  light.position.set(x, base + 80, z + 60);
  const smoke = new Emitter(180, glow, {
    size: 50,
    colour: new Color(0.25, 0.2, 0.22),
    gravity: -16,
    drag: 0.85,
    life: 6,
    additive: false,
  });
  const embers = new Emitter(160, glow, {
    size: 6,
    colour: new Color(1.6, 0.7, 0.2),
    gravity: 30,
    drag: 0.5,
    life: 1.5,
  });
  const group = new Group();
  group.add(pivot, stream, light, smoke.points, embers.points);
  let pour = -1;
  return {
    id: "crucible",
    name: "The Crucible",
    anchor: { x, y: base + 100, z: z + 40 },
    group,
    update: (dt, t) => {
      if (rand() < dt * 4) {
        const c = [-120, -40, 60, 140][Math.floor(rand() * 4)] ?? 0;
        smoke.emit({ x: x + c, y: base + 300, z: z - 100 }, 1, (r) => [(r() - 0.5) * 10, 20 + r() * 10, 0], rand);
      }
      let k2 = 0;
      if (pour >= 0) {
        pour += dt;
        k2 = pour < 1 ? pour : pour < 4 ? 1 : Math.max(0, 5 - pour);
        if (rand() < dt * 30)
          embers.emit(
            { x: x + 30, y: base + 40, z: z + 20 },
            4,
            (r) => [(r() - 0.5) * 60, 30 + r() * 40, (r() - 0.5) * 60],
            rand,
          );
        if (pour > 5) pour = -1;
      }
      pivot.rotation.z = -k2 * 0.9;
      stream.visible = k2 > 0.6;
      stream.scale.y = 100 * k2;
      light.intensity = (2e4 + Math.sin(t * 7) * 3e3) * (1 + k2 * 4);
      smoke.update(dt);
      embers.update(dt);
    },
    trigger: () => {
      pour = 0;
    },
  };
}
