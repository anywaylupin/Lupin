import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  ConeGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
} from "three";
import type { Rand } from "../math";
import { AVENUE, CELL, DOME, SPAN, VIEW, type Building } from "./plan";

/** Car light colours: amber headlights, pink tail lights, cyan for the police and the couriers. */
const LIGHTS = [new Color(1, 0.66, 0.28), new Color(1, 0.28, 0.66), new Color(0.36, 0.85, 1)];

interface Car {
  /** Lane axis: cars on an "x" lane drive across the screen, on a "z" lane toward or away from it. */
  axis: "x" | "z";
  /** The fixed coordinates of the lane: height, and the cross position. */
  y: number;
  at: number;
  dir: 1 | -1;
  speed: number;
  offset: number;
  span: readonly [number, number];
}

const dummy = new Object3D();

function lanes(rand: Rand, count: number, make: (i: number) => Omit<Car, "offset" | "speed" | "dir">): Car[] {
  return Array.from({ length: count }, (_, i) => ({
    ...make(i),
    dir: rand() < 0.5 ? 1 : -1,
    speed: 0,
    offset: rand(),
  }));
}

/**
 * Skyway traffic at five heights and many depths, so every band of the screen has cars crossing it.
 * Each car is a bright body and a long faint trail behind it, two instanced meshes for the whole fleet.
 */
function skyCars(rand: Rand): Car[] {
  const heights = [48, 72, 100, 135, 175];
  const across = lanes(rand, 110, () => {
    const z = SPAN.zFar * 0.75 + rand() * (VIEW.eye.z - 60 - SPAN.zFar * 0.75);
    const reach = 260 + (VIEW.eye.z - z) * 1.05;
    return { axis: "x", y: heights[Math.floor(rand() * heights.length)] ?? 80, at: z, span: [-reach, reach] };
  });
  const deep = lanes(rand, 50, () => {
    const side = rand() < 0.5 ? -1 : 1;
    return {
      axis: "z",
      y: heights[Math.floor(rand() * heights.length)] ?? 80,
      at: side * (140 + rand() * 700),
      span: [SPAN.zFar * 0.8, VIEW.eye.z],
    };
  });
  for (const c of [...across, ...deep]) c.speed = 45 + rand() * 60;
  return [...across, ...deep];
}

/** Street traffic on the grid lines between blocks, kept off the dome plaza and the avenue. */
function streetCars(rand: Rand): Car[] {
  const out: Car[] = [];
  while (out.length < 240) {
    const axis = rand() < 0.55 ? "x" : "z";
    const k = Math.round((rand() - 0.5) * (axis === "x" ? 30 : 50));
    const at = k * CELL + CELL / 2;
    if (axis === "z" && Math.abs(at) < AVENUE.half) continue;
    if (axis === "x" && (at > VIEW.eye.z - 40 || at < SPAN.zFar)) continue;
    const reach = axis === "x" ? 300 + (VIEW.eye.z - at) * 1.05 : 0;
    const span: [number, number] = axis === "x" ? [-reach, reach] : [SPAN.zFar, VIEW.eye.z - 20];
    out.push({ axis, y: 1.2, at, span, dir: rand() < 0.5 ? 1 : -1, speed: 22 + rand() * 26, offset: rand() });
  }
  return out;
}

function where(c: Car, t: number): { x: number; z: number } {
  const len = c.span[1] - c.span[0];
  const u = (((c.offset + (t * c.speed * c.dir) / len) % 1) + 1) % 1;
  const p = c.span[0] + u * len;
  return c.axis === "x" ? { x: p, z: c.at } : { x: c.at, z: p };
}

function fleet(cars: Car[], size: readonly [number, number, number], trail: number, rand: Rand) {
  const body = new InstancedMesh(new BoxGeometry(...size), new MeshBasicMaterial(), cars.length);
  const tail = new InstancedMesh(
    new BoxGeometry(1, size[1] * 0.5, size[2] * 0.5),
    new MeshBasicMaterial({ transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false }),
    cars.length,
  );
  cars.forEach((_, i) => {
    const c = LIGHTS[Math.floor(rand() * LIGHTS.length)] ?? LIGHTS[0];
    if (!c) return;
    body.setColorAt(i, c);
    tail.setColorAt(i, c);
  });
  for (const m of [body, tail]) m.frustumCulled = false;
  const update = (t: number) => {
    cars.forEach((c, i) => {
      const p = where(c, t);
      const yaw = c.axis === "x" ? 0 : Math.PI / 2;
      const bob = c.y > 2 ? Math.sin(t * 1.3 + i) * 0.8 : 0;
      dummy.position.set(p.x, c.y + bob, p.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      const back = (trail / 2 + size[0] / 2) * c.dir;
      dummy.position.set(p.x - (c.axis === "x" ? back : 0), c.y + bob, p.z - (c.axis === "z" ? back : 0));
      dummy.scale.set(trail, 1, 1);
      dummy.updateMatrix();
      tail.setMatrixAt(i, dummy.matrix);
    });
    body.instanceMatrix.needsUpdate = true;
    tail.instanceMatrix.needsUpdate = true;
  };
  return { meshes: [body, tail], update };
}

/** Searchlights on the tallest towers, sweeping slow arcs over the sky; additive cones, so they cost almost nothing. */
function searchlights(tops: readonly Building[]) {
  const mat = new MeshBasicMaterial({
    color: 0x9fd8ff,
    transparent: true,
    opacity: 0.05,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const geo = new ConeGeometry(60, 700, 20, 1, true);
  geo.translate(0, -350, 0);
  geo.rotateX(Math.PI);
  const beams = tops.map((b, i) => {
    const pivot = new Group();
    pivot.position.set(b.x, b.h + 10, b.z);
    const cone = new Mesh(geo, mat);
    pivot.add(cone);
    return { pivot, phase: i * 1.7 };
  });
  return {
    meshes: beams.map((b) => b.pivot),
    update: (t: number) => {
      for (const b of beams) {
        b.pivot.rotation.z = Math.sin(t * 0.25 + b.phase) * 0.6;
        b.pivot.rotation.x = Math.cos(t * 0.19 + b.phase) * 0.35 - 0.1;
      }
    },
  };
}

export interface Traffic {
  group: Group;
  update: (t: number) => void;
}

export function createTraffic(buildings: readonly Building[], rand: Rand): Traffic {
  const sky = fleet(skyCars(rand), [4, 1.2, 1.8], 16, rand);
  const street = fleet(streetCars(rand), [2.6, 0.9, 1.3], 8, rand);
  const tallest = [...buildings]
    .filter((b) => b.kind === "mega" || (b.h > 200 && Math.hypot(b.x, b.z) > DOME.plaza * 3))
    .sort((a, b) => b.h - a.h)
    .slice(0, 4);
  const lights = searchlights(tallest);
  const group = new Group();
  group.add(...sky.meshes, ...street.meshes, ...lights.meshes);
  return {
    group,
    update: (t) => {
      sky.update(t);
      street.update(t);
      lights.update(t);
    },
  };
}
