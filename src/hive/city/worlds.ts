import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  PointsMaterial,
  SphereGeometry,
  type Texture,
} from "three";
import type { Rand } from "../math";
import { above, flat, FLOOR, floor, inDisc, lit, particles, R, scatter, SPREAD, type World } from "./diorama";
import { fallMaterial } from "./ground";

const dummy = new Object3D();

/** A mossy valley: a cliff with a waterfall at the back, pines, birds wheeling and pollen drifting. */
export function forest(rand: Rand, glow: Texture, time: { value: number }): World {
  const group = new Group();
  group.add(floor(0x1f4a2a));
  const cliff = new Mesh(new CylinderGeometry(R * 0.5, R * 0.6, R * 0.8, 7), lit(0x3a3a48));
  cliff.position.set(0, FLOOR + R * 0.4, -R * 0.55);
  const fall = new Mesh(new PlaneGeometry(40, R * 0.78), fallMaterial(time));
  fall.position.set(0, FLOOR + R * 0.39, -R * 0.16);
  const pool = new Mesh(new CircleGeometry(50, 24), flat(0x2a6a9a));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, FLOOR + 0.5, -R * 0.1);
  const pines = scatter(new ConeGeometry(9, 34, 6), lit(0x1f6a3a), 40, () => {
    const [x, z] = inDisc(rand);
    return [x, FLOOR + 17, z, 0.7 + rand() * 0.8];
  });
  const pollen = particles(120, () => above(rand, R * 0.6), new Color(1, 0.95, 0.6), 3, glow);
  const birds = particles(9, () => [0, 0, 0], new Color(0.9, 0.9, 1), 5, glow);
  group.add(cliff, fall, pool, pines, pollen.points, birds.points);
  return {
    name: "Forest falls",
    group,
    sky: new Color(0.35, 0.6, 0.75),
    update: (_dt, t) => {
      for (let i = 0; i < 9; i++) {
        const a = t * 0.4 + i * 0.7;
        birds.pos.setXYZ(i, Math.cos(a) * (60 + i * 6), R * 0.25 + Math.sin(a * 2) * 10, Math.sin(a) * (50 + i * 4));
      }
      birds.pos.needsUpdate = true;
      for (let i = 0; i < 120; i++) pollen.pos.setY(i, FLOOR + ((pollen.pos.getY(i) - FLOOR + 0.2) % (R * 0.6)));
      pollen.pos.needsUpdate = true;
    },
  };
}

/** Dunes under a huge moon, a caravan crossing, and a sandstorm that rolls in and dies away. */
export function desert(rand: Rand, glow: Texture): World {
  const group = new Group();
  group.add(floor(0xc08850));
  const dunes = scatter(new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lit(0xd8a060), 9, (i) => {
    const [x, z] = inDisc(rand, SPREAD * 0.9);
    return [x, FLOOR, z - (i % 2) * 20, 30 + rand() * 40];
  });
  dunes.scale.y = 0.3;
  const moon = new Mesh(new CircleGeometry(48, 32), flat(0xc8b898));
  moon.position.set(-40, R * 0.35, -R * 0.75);
  const halo = new Mesh(new CircleGeometry(80, 32), flat(0xffe0a0, { transparent: true, opacity: 0.2 }));
  halo.position.set(-40, R * 0.35, -R * 0.75 - 1);
  const camels = scatter(new CylinderGeometry(3, 3, 9, 6).rotateZ(Math.PI / 2), lit(0x3a2010), 5, () => [0, 0, 0, 1]);
  const sand = particles(
    260,
    () => [(rand() - 0.5) * SPREAD * 2, FLOOR + rand() * 60, (rand() - 0.5) * SPREAD * 2],
    new Color(0.9, 0.7, 0.45),
    4,
    glow,
  );
  group.add(dunes, moon, halo, camels, sand.points);
  return {
    name: "Desert",
    group,
    sky: new Color(0.25, 0.15, 0.35),
    update: (dt, t) => {
      for (let i = 0; i < 5; i++) {
        const x = ((t * 8 + i * 16) % (SPREAD * 2)) - SPREAD;
        dummy.position.set(x, FLOOR + 8 + Math.abs(Math.sin(t * 3 + i)) * 1.5, 40);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        camels.setMatrixAt(i, dummy.matrix);
      }
      camels.instanceMatrix.needsUpdate = true;
      const storm = Math.max(0, Math.sin(t * 0.25));
      (sand.points.material as PointsMaterial).opacity = storm;
      for (let i = 0; i < 260; i++) {
        let x = sand.pos.getX(i) + dt * (60 + 140 * storm);
        if (x > SPREAD) x -= SPREAD * 2;
        sand.pos.setX(i, x);
      }
      sand.pos.needsUpdate = true;
    },
  };
}

/** A stage with a truss, lasers sweeping the dome, a crowd of lights bouncing and the floor pulsing with the bass. */
export function concert(rand: Rand): World {
  const group = new Group();
  group.add(floor(0x120c20));
  const stage = new Mesh(new CylinderGeometry(70, 76, 14, 6), lit(0x2a2440));
  stage.position.set(0, FLOOR + 7, -R * 0.4);
  const deck = flat(0xff40c0);
  const glowDeck = new Mesh(new CylinderGeometry(71, 71, 1, 6), deck);
  glowDeck.position.set(0, FLOOR + 14.5, -R * 0.4);
  const lasers = Array.from({ length: 6 }, (_, i) => {
    const m = new Mesh(
      new CylinderGeometry(0.6, 0.6, R * 1.4, 4).translate(0, R * 0.7, 0),
      flat(i % 2 ? 0x40f0ff : 0xff40d0, { transparent: true, opacity: 0.7 }),
    );
    m.position.set(-50 + i * 20, FLOOR + 15, -R * 0.4);
    return m;
  });
  const crowd = scatter(new IcosahedronGeometry(3, 0), flat(0xffffff), 140, () => {
    const [x, z] = inDisc(rand, SPREAD * 0.75);
    return [x, FLOOR + 3, z * 0.6 + 40, 1];
  });
  const colours = [0xff40c0, 0x40f0ff, 0xffd040, 0xffffff];
  for (let i = 0; i < 140; i++) crowd.setColorAt(i, new Color(colours[i % 4] ?? 0xffffff));
  group.add(stage, glowDeck, ...lasers, crowd);
  const base = Array.from({ length: 140 }, (_, i) => {
    crowd.getMatrixAt(i, dummy.matrix);
    return dummy.matrix.elements.slice(12, 15);
  });
  return {
    name: "Concert",
    group,
    sky: new Color(0.08, 0.03, 0.15),
    update: (_dt, t) => {
      const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2)), 6);
      deck.color.setHSL((t * 0.1) % 1, 1, 0.3 + beat * 0.4);
      lasers.forEach((l, i) => {
        l.rotation.z = Math.sin(t * (0.7 + i * 0.1) + i) * 0.9;
        l.rotation.x = Math.cos(t * 0.5 + i) * 0.4 - 0.2;
      });
      base.forEach(([x = 0, y = 0, z = 0], i) => {
        dummy.position.set(x, y + Math.max(0, Math.sin(t * 6 + i)) * 4 * (0.5 + beat), z);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        crowd.setMatrixAt(i, dummy.matrix);
      });
      crowd.instanceMatrix.needsUpdate = true;
    },
  };
}

/** A coral reef: coral in warm colours, koi circling, bubbles rising and a whale gliding overhead. */
export function reef(rand: Rand, glow: Texture): World {
  const group = new Group();
  group.add(floor(0x1a3a5a));
  const coralCols = [0xff6a8a, 0xffa040, 0xc060ff, 0x40e0c0];
  const coral = scatter(new ConeGeometry(5, 26, 5), lit(0xffffff), 60, () => {
    const [x, z] = inDisc(rand);
    return [x, FLOOR + 10, z, 0.6 + rand(), rand() * 6];
  });
  for (let i = 0; i < 60; i++) coral.setColorAt(i, new Color(coralCols[i % 4] ?? 0xffffff));
  const koi = scatter(new SphereGeometry(1, 8, 6).scale(6, 2, 2.5), lit(0xff7030), 14, () => [0, 0, 0, 1]);
  const whale = new Mesh(new SphereGeometry(1, 16, 10).scale(70, 18, 22), lit(0x2a4a7a));
  const bubbles = particles(80, () => above(rand, R), new Color(0.7, 0.9, 1), 4, glow);
  group.add(coral, koi, whale, bubbles.points);
  return {
    name: "Reef",
    group,
    sky: new Color(0.05, 0.3, 0.5),
    update: (dt, t) => {
      for (let i = 0; i < 14; i++) {
        const a = t * (0.4 + (i % 3) * 0.1) + i;
        const r = 40 + (i % 5) * 18;
        dummy.position.set(Math.cos(a) * r, FLOOR + 30 + (i % 4) * 12, Math.sin(a) * r);
        dummy.rotation.set(0, -a, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        koi.setMatrixAt(i, dummy.matrix);
      }
      koi.instanceMatrix.needsUpdate = true;
      const w = ((t * 0.05) % 1) * 2 - 1;
      whale.position.set(w * R * 1.1, R * 0.35, -20);
      for (let i = 0; i < 80; i++) {
        let y = bubbles.pos.getY(i) + dt * 20;
        if (y > R * 0.6) y = FLOOR;
        bubbles.pos.setY(i, y);
      }
      bubbles.pos.needsUpdate = true;
    },
  };
}

/** A tundra night: snow falling, an aurora rippling in green and violet, and a lighthouse sweeping its beam. */
export function tundra(rand: Rand, glow: Texture): World {
  const group = new Group();
  group.add(floor(0xdde8f8));
  const tower = new Mesh(new CylinderGeometry(7, 10, 70, 10), lit(0xf0f0f0));
  tower.position.set(60, FLOOR + 35, -60);
  const lamp = new Mesh(new SphereGeometry(6, 10, 8), flat(0xfff0b0));
  lamp.position.set(60, FLOOR + 74, -60);
  const beam = new Mesh(
    new ConeGeometry(14, 160, 12, 1, true).rotateZ(Math.PI / 2).translate(80, 0, 0),
    flat(0xfff0b0, { transparent: true, opacity: 0.18 }),
  );
  beam.position.copy(lamp.position);
  const ribbons = Array.from({ length: 4 }, (_, i) => {
    const m = new Mesh(
      new PlaneGeometry(R * 1.4, 60, 30, 1),
      new MeshBasicMaterial({
        color: i % 2 ? 0x60ff90 : 0xa060ff,
        transparent: true,
        opacity: 0.25,
        blending: AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    m.position.set(0, R * 0.35 + i * 12, -R * 0.4 - i * 10);
    return m;
  });
  const snow = particles(
    200,
    () => [(rand() - 0.5) * SPREAD * 2, FLOOR + rand() * R, (rand() - 0.5) * SPREAD * 2],
    new Color(1, 1, 1),
    3,
    glow,
  );
  group.add(tower, lamp, beam, ...ribbons, snow.points);
  const base = ribbons.map((m) => Float32Array.from(m.geometry.getAttribute("position").array));
  return {
    name: "Tundra",
    group,
    sky: new Color(0.03, 0.05, 0.15),
    update: (dt, t) => {
      beam.rotation.y = t * 0.8;
      ribbons.forEach((m, k) => {
        const p = m.geometry.getAttribute("position");
        const b = base[k];
        if (!b) return;
        for (let i = 0; i < p.count; i++)
          p.setZ(i, (b[i * 3 + 2] ?? 0) + Math.sin((b[i * 3] ?? 0) * 0.03 + t * (0.6 + k * 0.2)) * 14);
        p.needsUpdate = true;
      });
      for (let i = 0; i < 200; i++) {
        let y = snow.pos.getY(i) - dt * 12;
        if (y < FLOOR) y += R;
        snow.pos.setY(i, y);
      }
      snow.pos.needsUpdate = true;
    },
  };
}
