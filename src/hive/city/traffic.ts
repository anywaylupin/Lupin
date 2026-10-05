import { AdditiveBlending, BoxGeometry, Color, Group, InstancedMesh, MeshBasicMaterial, Object3D } from "three";
import type { Rand } from "../math";
import { LEVEL } from "./plan";

/** Car light colours: amber headlights, pink tail lights, cyan for the police and the couriers. */
const LIGHTS = [new Color(1.4, 0.8, 0.3), new Color(1.4, 0.3, 0.8), new Color(0.4, 1.1, 1.4)];

interface Car {
  /** Cars on an "x" lane cross the screen; on a "z" lane they fly toward or away from it. */
  axis: "x" | "z";
  y: number;
  /** The lane's fixed cross coordinate: z for an "x" lane, x for a "z" lane. */
  at: number;
  dir: 1 | -1;
  speed: number;
  offset: number;
  span: readonly [number, number];
}

const dummy = new Object3D();

function pick<T>(rand: Rand, list: readonly T[], fallback: T): T {
  return list[Math.floor(rand() * list.length)] ?? fallback;
}

/**
 * Skyways over the upper city at six heights and many depths, toward-and-away lanes between the towers, and low hover lanes through the undercity.
 * Every band of the screen has something crossing it.
 */
function lanes(rand: Rand): Car[] {
  const out: Car[] = [];
  const heights = [140, 220, 320, 430, 560, 700];
  for (let i = 0; i < 150; i++) {
    const z = -1800 + rand() * 1900;
    const reach = 1600 + (LEVEL.edge - z) * 0.7;
    out.push({
      axis: "x",
      y: pick(rand, heights, 300),
      at: z,
      span: [-reach, reach],
      dir: 1,
      speed: 0,
      offset: rand(),
    });
  }
  for (let i = 0; i < 50; i++) {
    const side = rand() < 0.5 ? -1 : 1;
    out.push({
      axis: "z",
      y: pick(rand, heights, 300),
      at: side * (200 + rand() * 1200),
      span: [-2000, 1200],
      dir: 1,
      speed: 0,
      offset: rand(),
    });
  }
  for (let i = 0; i < 50; i++) {
    const z = LEVEL.edge + 80 + rand() * 700;
    out.push({
      axis: "x",
      y: LEVEL.under + 40 + rand() * 120,
      at: z,
      span: [-2600, 2600],
      dir: 1,
      speed: 0,
      offset: rand(),
    });
  }
  for (const c of out) {
    c.dir = rand() < 0.5 ? 1 : -1;
    c.speed = 80 + rand() * 120;
  }
  return out;
}

function where(c: Car, t: number): { x: number; z: number } {
  const len = c.span[1] - c.span[0];
  const u = (((c.offset + (t * c.speed * c.dir) / len) % 1) + 1) % 1;
  const p = c.span[0] + u * len;
  return c.axis === "x" ? { x: p, z: c.at } : { x: c.at, z: p };
}

export interface Traffic {
  group: Group;
  update: (t: number) => void;
}

/** The fleet as two instanced meshes: bright bodies and long faint light trails behind them. */
export function createTraffic(rand: Rand): Traffic {
  const cars = lanes(rand);
  const size = [10, 3, 4.5] as const;
  const trail = 40;
  const body = new InstancedMesh(new BoxGeometry(...size), new MeshBasicMaterial(), cars.length);
  const tail = new InstancedMesh(
    new BoxGeometry(1, size[1] * 0.5, size[2] * 0.5),
    new MeshBasicMaterial({ transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false }),
    cars.length,
  );
  cars.forEach((_, i) => {
    const c = pick(rand, LIGHTS, new Color(1, 1, 1));
    body.setColorAt(i, c);
    tail.setColorAt(i, c);
  });
  for (const m of [body, tail]) m.frustumCulled = false;
  const group = new Group();
  group.add(body, tail);
  return {
    group,
    update: (t) => {
      cars.forEach((c, i) => {
        const p = where(c, t);
        const yaw = c.axis === "x" ? 0 : Math.PI / 2;
        const bob = Math.sin(t * 1.3 + i) * 2;
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
    },
  };
}
