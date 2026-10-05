import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Points,
  PointsMaterial,
  type Texture,
} from "three";
import type { Rand } from "../math";
import { AMBER, CYAN, GOLD, PINK } from "./palette";
import { serpent, type Vec3 } from "./plan";

const dummy = new Object3D();

interface Burst {
  at: Vec3;
  t: number;
  colour: Color;
  vel: Float32Array;
}

const SPARKS = 90;
const BURSTS = 4;

/**
 * Fireworks: a rocket climbs from the roofs, bursts into a sphere of sparks that fall and fade.
 * One point cloud holds every burst; fading darkens the colour, which on additive blending is the same as lowering the alpha.
 */
export function fireworks(glow: Texture) {
  const pos = new Float32Array(SPARKS * BURSTS * 3);
  const col = new Float32Array(SPARKS * BURSTS * 3);
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new Float32BufferAttribute(col, 3));
  const points = new Points(
    geo,
    new PointsMaterial({
      size: 40,
      map: glow,
      vertexColors: true,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  points.frustumCulled = false;
  const bursts: (Burst | null)[] = Array.from({ length: BURSTS }, () => null);
  const RISE = 1.1;
  return {
    meshes: [points],
    launch: (at: Vec3, rand: Rand) => {
      const i = bursts.findIndex((b) => !b);
      if (i < 0) return;
      const vel = new Float32Array(SPARKS * 3);
      for (let k = 0; k < SPARKS; k++) {
        const u = rand() * 2 - 1;
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        const sp = 150 + rand() * 40;
        vel.set([Math.cos(a) * r * sp, u * sp, Math.sin(a) * r * sp], k * 3);
      }
      const colour = [PINK, CYAN, AMBER, GOLD][Math.floor(rand() * 4)] ?? GOLD;
      bursts[i] = { at, t: 0, colour, vel };
    },
    update: (dt: number) => {
      const p = geo.getAttribute("position");
      const c = geo.getAttribute("color");
      bursts.forEach((b, bi) => {
        const base = bi * SPARKS;
        if (b && (b.t += dt) > RISE + 2.6) bursts[bi] = null;
        for (let k = 0; k < SPARKS; k++) {
          const i = base + k;
          if (!b) {
            c.setXYZ(i, 0, 0, 0);
            continue;
          }
          if (b.t < RISE) {
            const y = b.at.y - 380 * (1 - b.t / RISE);
            p.setXYZ(i, b.at.x, y - (k % 8) * 9, b.at.z);
            const f = k % 8 === 0 ? 1 : 0.3 * (1 - (k % 8) / 8);
            c.setXYZ(i, GOLD.r * f, GOLD.g * f, GOLD.b * f);
            continue;
          }
          const s = b.t - RISE;
          const drag = (1 - Math.exp(-s * 1.6)) / 1.6;
          p.setXYZ(
            i,
            b.at.x + (b.vel[k * 3] ?? 0) * drag,
            b.at.y + (b.vel[k * 3 + 1] ?? 0) * drag - 30 * s * s,
            b.at.z + (b.vel[k * 3 + 2] ?? 0) * drag,
          );
          const f = Math.max(0, 1 - s / 2.6) * (0.75 + 0.25 * Math.sin(s * 30 + k));
          c.setXYZ(i, b.colour.r * f, b.colour.g * f, b.colour.b * f);
        }
      });
      p.needsUpdate = true;
      c.needsUpdate = true;
    },
  };
}

/** The neon dragon: forty glowing segments swimming across the whole screen, head amber, body shading from pink to cyan. */
export function dragon() {
  const n = 40;
  const mesh = new InstancedMesh(new IcosahedronGeometry(1, 1), new MeshBasicMaterial(), n);
  mesh.frustumCulled = false;
  for (let i = 0; i < n; i++) mesh.setColorAt(i, i === 0 ? AMBER : PINK.clone().lerp(CYAN, i / n));
  let flight: { a: Vec3; b: Vec3; t: number; dur: number; amp: number } | null = null;
  const hide = () => {
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    for (let i = 0; i < n; i++) mesh.setMatrixAt(i, dummy.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  };
  hide();
  return {
    meshes: [mesh],
    busy: () => flight !== null,
    fly: (a: Vec3, b: Vec3, rand: Rand) => {
      flight = { a, b, t: 0, dur: 12 + rand() * 4, amp: 60 + rand() * 40 };
    },
    update: (dt: number) => {
      if (!flight) return;
      flight.t += dt;
      const head = flight.t / flight.dur;
      if (head > 1.25) {
        flight = null;
        hide();
        return;
      }
      for (let i = 0; i < n; i++) {
        const u = head - i * 0.007;
        const p = serpent(flight.a, flight.b, u, flight.amp);
        const s = i === 0 ? 24 : 19 * (1 - i / (n * 1.25));
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.setScalar(u < 0 || u > 1.2 ? 0 : s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
