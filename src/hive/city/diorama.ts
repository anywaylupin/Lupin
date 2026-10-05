import {
  AdditiveBlending,
  BufferGeometry,
  CircleGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  Points,
  PointsMaterial,
  type Material,
  type Texture,
} from "three";
import type { Rand } from "../math";
import { DOME } from "./plan";

/** One world inside Lumen: a diorama on a floor disc, its own inner sky colour, and what moves in it. */
export interface World {
  name: string;
  group: Group;
  sky: Color;
  update: (dt: number, t: number) => void;
}

export const R = DOME.r;
/** The floor of every world sits a third of the way down the sphere, so its horizon meets the dome's widest ring. */
export const FLOOR = -R * 0.35;
export const SPREAD = R * 0.85;

const dummy = new Object3D();

export function lit(colour: number | Color): MeshLambertMaterial {
  return new MeshLambertMaterial({ color: colour, fog: false });
}

export function flat(
  colour: number | Color,
  extra: Partial<{ transparent: boolean; opacity: number }> = {},
): MeshBasicMaterial {
  return new MeshBasicMaterial({ color: colour, fog: false, ...extra });
}

export function floor(colour: number): Mesh {
  const m = new Mesh(new CircleGeometry(SPREAD * 1.15, 48), lit(colour));
  m.rotation.x = -Math.PI / 2;
  m.position.y = FLOOR;
  return m;
}

/** Instances of one shape placed by `place`, which returns position, scale and turn for each. */
export function scatter(
  geo: BufferGeometry,
  mat: Material,
  n: number,
  place: (i: number) => [number, number, number, number, number?],
): InstancedMesh {
  const m = new InstancedMesh(geo, mat, n);
  for (let i = 0; i < n; i++) {
    const [x, y, z, s, yaw = 0] = place(i);
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
  }
  m.frustumCulled = false;
  return m;
}

/** A cloud of drifting particles; `move` updates the positions in place each frame. */
export function particles(
  n: number,
  seed: (i: number) => [number, number, number],
  colour: Color,
  size: number,
  glow: Texture,
): { points: Points; pos: Float32BufferAttribute } {
  const geo = new BufferGeometry();
  const pos = new Float32BufferAttribute(new Float32Array(n * 3), 3);
  for (let i = 0; i < n; i++) pos.setXYZ(i, ...seed(i));
  geo.setAttribute("position", pos);
  const points = new Points(
    geo,
    new PointsMaterial({
      color: colour,
      size,
      map: glow,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  points.frustumCulled = false;
  return { points, pos };
}

export function inDisc(rand: Rand, r = SPREAD): [number, number] {
  const a = rand() * Math.PI * 2;
  const d = Math.sqrt(rand()) * r;
  return [Math.cos(a) * d, Math.sin(a) * d];
}

/** A random point over the floor, up to `height` above it. */
export function above(rand: Rand, height: number): [number, number, number] {
  const [x, z] = inDisc(rand);
  return [x, FLOOR + rand() * height, z];
}
