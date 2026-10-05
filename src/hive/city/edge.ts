import {
  AdditiveBlending,
  BoxGeometry,
  CircleGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  TorusGeometry,
} from "three";
import { clamp } from "../math";
import { Emitter } from "./emitter";
import { fallMaterial, waterMaterial } from "./ground";
import { NEON } from "./kit";
import type { Kit, Landmark } from "./landmark";
import { LEVEL, plot, RAIL } from "./plan";

const SPAN = 3600;

/**
 * Silverfall: a tower whose terraces step down to the cliff edge, each pouring into the next, and the last over the cliff into a pool in the undercity.
 * Its event is a surge: the falls run fast and bright, mist rolls up the cliff and a neon rainbow stands over the gorge.
 */
export function silverfall(k: Kit): Landmark {
  const { x, z } = plot("silverfall").at;
  const { p, glow, rand, time } = k;
  const e = LEVEL.edge;
  p.at(x, 0, z);
  p.block("body", 110, 660, 110, 0, 0, -40, undefined, 6060);
  p.edges(110, 660, 110, 0, 0, -40, NEON.cyan);
  const steps = [520, 380, 240, 110];
  steps.forEach((y, i) => {
    const dz = 30 + i * 22;
    p.block("stone", 130, 8, 50, 0, y, dz);
    p.box("lit", 130, 1, 1, 0, y + 8, dz + 25, NEON.cyan);
  });
  p.at(0, 0, 0);
  const surgeU = { value: 0 };
  const sheet = fallMaterial(time, surgeU);
  const group = new Group();
  steps.forEach((y, i) => {
    const next = steps[i + 1] ?? 0;
    const f = new Mesh(new PlaneGeometry(70, y - next), sheet);
    f.position.set(x, (y + next) / 2, z + 30 + i * 22 + 26);
    group.add(f);
  });
  const big = new Mesh(new PlaneGeometry(90, LEVEL.deck - LEVEL.under), sheet);
  big.position.set(x, (LEVEL.deck + LEVEL.under) / 2, e + 6);
  const pool = new Mesh(new CircleGeometry(90, 32), waterMaterial(time));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x, LEVEL.water + 1, e + 70);
  const mist = new Emitter(220, glow, {
    size: 50,
    colour: new Color(0.45, 0.55, 0.7),
    gravity: -8,
    drag: 0.7,
    life: 4,
    additive: false,
  });
  const bow = new Group();
  const bowMats = ["#ff3060", "#ff9030", "#ffe040", "#40ff80", "#40c0ff", "#a050ff"].map(
    (c) =>
      new MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }),
  );
  bowMats.forEach((m, i) => {
    const arc = new Mesh(new TorusGeometry(150 - i * 5, 2.2, 4, 40, Math.PI), m);
    bow.add(arc);
  });
  bow.position.set(x, LEVEL.under + 20, e + 90);
  group.add(big, pool, mist.points, bow);
  let surge = 0;
  return {
    id: "silverfall",
    name: "Silverfall",
    anchor: { x, y: -100, z: e },
    group,
    update: (dt) => {
      surge = Math.max(0, surge - dt * 0.25);
      surgeU.value = surge;
      const rate = 6 + surge * 40;
      if (rand() < dt * rate)
        mist.emit(
          { x: x + (rand() - 0.5) * 80, y: LEVEL.under + 10, z: e + 40 },
          1 + Math.floor(surge * 3),
          (r) => [(r() - 0.5) * 30, 10 + r() * 20 + surge * 30, r() * 20],
          rand,
        );
      mist.update(dt);
      const show = clamp(surge * 1.5 - 0.2, 0, 0.8);
      for (const m of bowMats) m.opacity = show;
    },
    trigger: () => {
      surge = 1;
    },
  };
}

/**
 * Threadline: a tower standing on the undercity floor and climbing past the cliff, with the subway viaduct running straight through its lower floors.
 * A train runs the viaduct all the time; the event sends an express through, and each floor band lights as it passes.
 */
export function threadline(k: Kit): Landmark {
  const { x, z } = plot("threadline").at;
  const { p } = k;
  const base = LEVEL.under;
  p.at(x, 0, z);
  p.block("body", 100, RAIL.y - base - 6, 100, 0, base, 0, undefined, 1212);
  p.block("body", 100, 900, 100, 0, RAIL.y + 26, 0, undefined, 1213);
  p.edges(100, 900, 100, 0, RAIL.y + 26, 0, NEON.pink);
  for (const s of [-1, 1]) p.block("metal", 8, 32, 100, s * 46, RAIL.y - 6, 0);
  p.at(0, 0, 0);
  for (let px = -SPAN; px < SPAN; px += 130) p.block("metal", 8, RAIL.y - base - 8, 8, px, base, RAIL.z);
  p.block("metal", SPAN * 2, 6, 16, 0, RAIL.y - 8, RAIL.z);
  p.box("lit", SPAN * 2, 0.8, 0.8, 0, RAIL.y - 2, RAIL.z + 8, NEON.cyan);
  const floors = new MeshBasicMaterial({ color: 0x401020 });
  const bands = new Group();
  for (let y = RAIL.y + 60; y < RAIL.y + 900; y += 60) {
    const b = new Mesh(new BoxGeometry(102, 3, 102), floors);
    b.position.set(x, y, z);
    bands.add(b);
  }
  const body = new MeshLambertMaterial({ color: 0xc8d0e8, emissive: 0x202840 });
  const glass = new MeshBasicMaterial({ color: 0xfff0c0 });
  const train = new Group();
  for (let i = 0; i < 6; i++) {
    const car = new Mesh(new BoxGeometry(46, 12, 12), body);
    car.position.x = -i * 49;
    const win = new Mesh(new BoxGeometry(40, 3, 12.4), glass);
    win.position.set(-i * 49, 2, 0);
    train.add(car, win);
  }
  train.position.set(0, RAIL.y + 2, RAIL.z);
  const group = new Group();
  group.add(bands, train);
  let at = -SPAN;
  let express = 0;
  return {
    id: "threadline",
    name: "Threadline",
    anchor: { x, y: RAIL.y, z },
    group,
    update: (dt) => {
      express = Math.max(0, express - dt);
      at += dt * (express > 0 ? 700 : 160);
      if (at > SPAN + 300) at = -SPAN;
      train.position.x = at;
      const near = Math.max(0, 1 - Math.abs(at - 150 - x) / 260);
      const glow = 0.25 + near * (express > 0 ? 1.4 : 0.6);
      floors.color.setRGB(glow, glow * 0.25, glow * 0.6);
    },
    trigger: () => {
      express = 6;
      at = x - 1600;
    },
  };
}

/**
 * Ascender: a slender tower from the undercity floor to above the skyline, with three glass elevator tubes up its face.
 * The cars ride up and down all the time; its event races them against each other from bottom to top.
 */
export function ascender(k: Kit): Landmark {
  const { x, z } = plot("ascender").at;
  const { p } = k;
  const base = LEVEL.under;
  const h = 1120;
  p.at(x, 0, z);
  p.block("body", 70, h, 70, 0, base, 0, undefined, 4444);
  p.edges(70, h, 70, 0, base, 0, NEON.cyan);
  for (const dx of [-24, 0, 24]) p.cyl("glass", 8, 8, h, dx, base, 44, 10);
  p.block("metal", 110, 20, 90, 0, base + h, 0);
  p.cyl("metal", 2, 1, 120, 0, base + h + 20, 0, 5);
  p.box("lamp", 5, 5, 5, 0, base + h + 140, 0);
  p.at(0, 0, 0);
  const lit = [0xff40c0, 0x40e0ff, 0xffc040].map((c) => new MeshBasicMaterial({ color: c }));
  const cars = lit.map((m, i) => {
    const car = new Mesh(new BoxGeometry(12, 16, 12), m);
    car.position.set(x - 24 + i * 24, base, z + 44);
    return car;
  });
  const group = new Group();
  group.add(...cars);
  let race = -1;
  const speeds = [1, 1, 1];
  return {
    id: "ascender",
    name: "Ascender",
    anchor: { x, y: 200, z: z + 44 },
    group,
    update: (dt, t) => {
      cars.forEach((c, i) => {
        if (race >= 0) {
          const k = clamp((race * (speeds[i] ?? 1)) / 4, 0, 1);
          c.position.y = base + 10 + k * (h - 20);
        } else c.position.y = base + 10 + (0.5 + 0.5 * Math.sin(t * (0.15 + i * 0.04) + i * 2)) * (h - 20);
      });
      if (race >= 0) {
        race += dt;
        if (race > 6) race = -1;
      }
    },
    trigger: () => {
      race = 0;
      for (let i = 0; i < 3; i++) speeds[i] = 0.8 + k.rand() * 0.5;
    },
  };
}
