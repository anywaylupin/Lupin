import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PointLight,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  type Texture,
} from "three";
import type { Rand } from "../math";
import { waterMaterial } from "./ground";
import { galleon } from "./ships";
import { above, flat, FLOOR, floor, inDisc, lit, particles, R, scatter, SPREAD, type World } from "./diorama";

const dummy = new Object3D();

/** A galleon riding a storm on a dark sea, rain driving across it and lightning lighting the sails. */
export function cove(rand: Rand, glow: Texture, time: { value: number }): World {
  const group = new Group();
  const sea = new Mesh(new CircleGeometry(SPREAD * 1.15, 48), waterMaterial(time));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = FLOOR;
  const ship = galleon(0xf0e0c0);
  ship.scale.setScalar(110);
  ship.position.set(0, FLOOR + 6, 0);
  const flash = new PointLight(0xc0c8ff, 0, 600, 1.5);
  flash.position.set(-60, R * 0.5, -40);
  const rain = particles(240, () => above(rand, R), new Color(0.7, 0.8, 1), 2.5, glow);
  group.add(sea, ship, flash, rain.points);
  let bolt = 3;
  return {
    name: "Pirate cove",
    group,
    sky: new Color(0.06, 0.06, 0.14),
    update: (dt, t) => {
      ship.rotation.set(Math.sin(t * 0.9) * 0.12, t * 0.05, Math.sin(t * 0.7) * 0.08);
      ship.position.y = FLOOR + 6 + Math.sin(t * 1.3) * 3;
      bolt -= dt;
      flash.intensity = bolt < 0.15 && bolt > 0 ? 6e4 : 0;
      if (bolt <= 0) bolt = 2 + rand() * 4;
      for (let i = 0; i < 240; i++) {
        let y = rain.pos.getY(i) - dt * 160;
        if (y < FLOOR) y += R;
        rain.pos.setY(i, y);
        rain.pos.setX(i, rain.pos.getX(i) + dt * 30 * (y > R * 0.9 ? 0 : 1));
      }
      rain.pos.needsUpdate = true;
    },
  };
}

/** Endless shelves round the walls, candles floating in the air and books flying between them like birds. */
export function library(rand: Rand, glow: Texture): World {
  const group = new Group();
  group.add(floor(0x2a1810));
  const shelves = scatter(new BoxGeometry(40, 120, 12), lit(0x3a2010), 14, (i) => {
    const a = (i / 14) * Math.PI * 2;
    return [Math.cos(a) * SPREAD, FLOOR + 60, Math.sin(a) * SPREAD, 1, -a + Math.PI / 2];
  });
  const spines = scatter(new BoxGeometry(2.4, 9, 6), lit(0xffffff), 420, (i) => {
    const a = ((i % 14) / 14) * Math.PI * 2 + (rand() - 0.5) * 0.3;
    const y = FLOOR + 8 + Math.floor(i / 14) * 3.8;
    return [Math.cos(a) * (SPREAD - 7), y, Math.sin(a) * (SPREAD - 7), 1, -a + Math.PI / 2];
  });
  const hues = [0x8a2020, 0x204a8a, 0x2a6a30, 0x8a6a20, 0x5a2a7a];
  for (let i = 0; i < 420; i++) spines.setColorAt(i, new Color(hues[i % 5] ?? 0x8a2020));
  const candles = particles(60, () => above(rand, R * 0.7), new Color(1, 0.8, 0.45), 9, glow);
  const books = scatter(new BoxGeometry(8, 1.5, 6), lit(0xc0a070), 12, () => [0, 0, 0, 1]);
  group.add(shelves, spines, candles.points, books);
  const baseY = Array.from({ length: 60 }, (_, i) => candles.pos.getY(i));
  return {
    name: "Great library",
    group,
    sky: new Color(0.12, 0.07, 0.04),
    update: (_dt, t) => {
      for (let i = 0; i < 60; i++) candles.pos.setY(i, (baseY[i] ?? 0) + Math.sin(t + i) * 3);
      candles.pos.needsUpdate = true;
      for (let i = 0; i < 12; i++) {
        const a = t * 0.5 + (i / 12) * Math.PI * 2;
        const r = 50 + (i % 3) * 25;
        dummy.position.set(Math.cos(a) * r, R * 0.1 + Math.sin(a * 3 + i) * 15, Math.sin(a) * r);
        dummy.rotation.set(Math.sin(t * 12 + i) * 0.6, -a, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        books.setMatrixAt(i, dummy.matrix);
      }
      books.instanceMatrix.needsUpdate = true;
    },
  };
}

/** A volcano over a lava lake, ash rising, and every so often an eruption throwing glowing rock into the air. */
export function volcano(rand: Rand, glow: Texture): World {
  const group = new Group();
  group.add(floor(0x1a1210));
  const cone = new Mesh(new CylinderGeometry(22, 110, 120, 12, 1, true), lit(0x2a1a18));
  cone.position.set(0, FLOOR + 60, -40);
  const lava = new Mesh(new CircleGeometry(22, 16), flat(0xff6020));
  lava.rotation.x = -Math.PI / 2;
  lava.position.set(0, FLOOR + 118, -40);
  const lake = new Mesh(new RingGeometry(120, SPREAD * 1.1, 32), flat(0xff4010));
  lake.rotation.x = -Math.PI / 2;
  lake.position.y = FLOOR + 0.5;
  const ash = particles(
    150,
    () => [(rand() - 0.5) * 80, FLOOR + 120 + rand() * R * 0.5, -40 + (rand() - 0.5) * 80],
    new Color(0.4, 0.35, 0.4),
    6,
    glow,
  );
  const rocks = particles(60, () => [0, -999, 0], new Color(1, 0.5, 0.15), 8, glow);
  const vel = Array.from({ length: 60 }, () => [0, 0, 0]);
  group.add(cone, lava, lake, ash.points, rocks.points);
  let next = 2;
  return {
    name: "Volcano",
    group,
    sky: new Color(0.25, 0.06, 0.03),
    update: (dt, t) => {
      (lava.material as MeshBasicMaterial).color.setHSL(0.05, 1, 0.45 + Math.sin(t * 3) * 0.08);
      for (let i = 0; i < 150; i++) {
        let y = ash.pos.getY(i) + dt * 12;
        if (y > R * 0.8) y = FLOOR + 120;
        ash.pos.setY(i, y);
      }
      ash.pos.needsUpdate = true;
      next -= dt;
      if (next <= 0) {
        next = 4 + rand() * 4;
        vel.forEach((v, i) => {
          v[0] = (rand() - 0.5) * 80;
          v[1] = 60 + rand() * 80;
          v[2] = (rand() - 0.5) * 80;
          rocks.pos.setXYZ(i, 0, FLOOR + 120, -40);
        });
      }
      vel.forEach((v, i) => {
        v[1] = (v[1] ?? 0) - 60 * dt;
        rocks.pos.setXYZ(
          i,
          rocks.pos.getX(i) + (v[0] ?? 0) * dt,
          Math.max(FLOOR - 10, rocks.pos.getY(i) + (v[1] ?? 0) * dt),
          rocks.pos.getZ(i) + (v[2] ?? 0) * dt,
        );
      });
      rocks.pos.needsUpdate = true;
    },
  };
}

/** A blossom garden: cherry trees in pink, a red arched bridge over a pond and petals blowing through. */
export function blossom(rand: Rand, glow: Texture): World {
  const group = new Group();
  group.add(floor(0x2a4a2a));
  const pond = new Mesh(new CircleGeometry(60, 32), flat(0x204a6a));
  pond.rotation.x = -Math.PI / 2;
  pond.position.y = FLOOR + 0.5;
  const bridge = new Mesh(new TorusGeometry(46, 2.5, 6, 24, Math.PI), flat(0xd02020));
  bridge.position.set(0, FLOOR, 0);
  const spots = Array.from({ length: 12 }, () => {
    const [x, z] = inDisc(rand);
    return Math.hypot(x, z) < 70 ? ([x * 2.2, z * 2.2] as const) : ([x, z] as const);
  });
  const trunks = scatter(new CylinderGeometry(2, 3, 30, 6), lit(0x3a2418), 12, (i) => [
    spots[i]?.[0] ?? 0,
    FLOOR + 15,
    spots[i]?.[1] ?? 0,
    1,
  ]);
  const crowns = scatter(new IcosahedronGeometry(16, 1), lit(0xffa0c8), 12, (i) => [
    spots[i]?.[0] ?? 0,
    FLOOR + 36,
    spots[i]?.[1] ?? 0,
    0.8 + rand() * 0.5,
  ]);
  const petals = particles(160, () => above(rand, R * 0.7), new Color(1, 0.6, 0.8), 4, glow);
  group.add(pond, bridge, trunks, crowns, petals.points);
  return {
    name: "Blossom garden",
    group,
    sky: new Color(0.55, 0.35, 0.5),
    update: (dt, t) => {
      for (let i = 0; i < 160; i++) {
        let y = petals.pos.getY(i) - dt * 6;
        if (y < FLOOR) y += R * 0.7;
        petals.pos.setXYZ(i, petals.pos.getX(i) + Math.sin(t + i) * dt * 10, y, petals.pos.getZ(i));
      }
      petals.pos.needsUpdate = true;
    },
  };
}

/** Deep space through a station window: a ringed planet rising and setting against a nebula, stars, and a meteor shower streaking past. */
export function space(rand: Rand, glow: Texture): World {
  const group = new Group();
  const frame = new Mesh(new TorusGeometry(R * 0.7, 6, 6, 6), lit(0x404860));
  frame.rotation.z = Math.PI / 6;
  frame.position.z = R * 0.2;
  const planet = new Mesh(new SphereGeometry(70, 32, 20), lit(0x6a50c0));
  const ring = new Mesh(
    new RingGeometry(90, 120, 48),
    new MeshBasicMaterial({ color: 0xc0a0ff, transparent: true, opacity: 0.4, side: DoubleSide, fog: false }),
  );
  ring.rotation.x = 1.2;
  const stars = particles(
    200,
    () => {
      const a = rand() * Math.PI * 2;
      const b = rand() * Math.PI - Math.PI / 2;
      const r = R * 0.9;
      return [Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r - R * 0.2];
    },
    new Color(1, 1, 1),
    3,
    glow,
  );
  const streaks = new BufferGeometry();
  const sp = new Float32BufferAttribute(new Float32Array(12 * 6), 3);
  streaks.setAttribute("position", sp);
  const meteors = new LineSegments(
    streaks,
    new LineBasicMaterial({ color: 0xffe0c0, transparent: true, blending: AdditiveBlending, fog: false }),
  );
  meteors.frustumCulled = false;
  const seeds = Array.from({ length: 12 }, () => [rand(), rand(), rand()]);
  const nebula = particles(
    6,
    () => [(rand() - 0.5) * R, R * 0.1 + rand() * R * 0.4, -R * 0.6],
    new Color(0.35, 0.15, 0.6),
    260,
    glow,
  );
  group.add(nebula.points, frame, planet, ring, stars.points, meteors);
  return {
    name: "Deep space",
    group,
    sky: new Color(0.05, 0.03, 0.14),
    update: (_dt, t) => {
      const rise = Math.sin(t * 0.08);
      planet.position.set(30, R * 0.05 + rise * 60, -R * 0.4);
      ring.position.copy(planet.position);
      planet.rotation.y = t * 0.1;
      seeds.forEach(([a = 0, b = 0, c = 0], i) => {
        const k = (t * (0.3 + c * 0.3) + a) % 1;
        const x = -R * 0.8 + k * R * 1.6;
        const y = R * 0.6 - k * R * 0.9 + b * 40;
        sp.setXYZ(i * 2, x, y, -R * 0.3 + c * 60);
        sp.setXYZ(i * 2 + 1, x - 26, y + 15, -R * 0.3 + c * 60);
      });
      sp.needsUpdate = true;
    },
  };
}
