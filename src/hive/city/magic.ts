import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  Points,
  PointsMaterial,
  SphereGeometry,
  Vector3,
  type Texture,
} from "three";
import { clamp, type Rand } from "../math";
import { Emitter } from "./emitter";
import { PLOTS, type Vec3 } from "./plan";

/** Constellation outlines in a unit box, as pairs of points to join: an owl, a ship, a hex and a bee. */
const SHAPES: readonly (readonly [number, number][])[] = [
  [
    [-0.4, 0.5],
    [0, 0.8],
    [0, 0.8],
    [0.4, 0.5],
    [0.4, 0.5],
    [0.4, -0.3],
    [0.4, -0.3],
    [0, -0.7],
    [0, -0.7],
    [-0.4, -0.3],
    [-0.4, -0.3],
    [-0.4, 0.5],
    [-0.2, 0.2],
    [0.2, 0.2],
  ],
  [
    [-0.8, -0.2],
    [0.8, -0.2],
    [0.8, -0.2],
    [0.6, -0.5],
    [0.6, -0.5],
    [-0.6, -0.5],
    [-0.6, -0.5],
    [-0.8, -0.2],
    [0, -0.2],
    [0, 0.8],
    [0, 0.8],
    [0.5, 0.1],
    [0.5, 0.1],
    [0, 0.1],
  ],
  [
    [0.8, 0],
    [0.4, 0.7],
    [0.4, 0.7],
    [-0.4, 0.7],
    [-0.4, 0.7],
    [-0.8, 0],
    [-0.8, 0],
    [-0.4, -0.7],
    [-0.4, -0.7],
    [0.4, -0.7],
    [0.4, -0.7],
    [0.8, 0],
  ],
  [
    [-0.5, 0],
    [0, 0.3],
    [0, 0.3],
    [0.5, 0],
    [0.5, 0],
    [0, -0.3],
    [0, -0.3],
    [-0.5, 0],
    [-0.2, 0.25],
    [-0.5, 0.8],
    [0.2, 0.25],
    [0.5, 0.8],
  ],
];

/** The spirit fox's outline, nose to tail, in a unit box. */
const FOX: readonly [number, number][] = [
  [0.9, 0.3],
  [0.7, 0.45],
  [0.75, 0.7],
  [0.6, 0.5],
  [0.45, 0.55],
  [0.4, 0.3],
  [-0.3, 0.3],
  [-0.6, 0.5],
  [-1, 0.6],
  [-0.7, 0.3],
  [-0.4, 0.1],
  [-0.45, -0.4],
  [-0.35, -0.4],
  [-0.3, 0],
  [0.3, 0],
  [0.35, -0.4],
  [0.45, -0.4],
  [0.45, 0.1],
  [0.75, 0.2],
];

/** A broom rider: a stick with bristles, a cloaked body and a pointed hat. */
function rider(cloak: number): Group {
  const g = new Group();
  const wood = new MeshLambertMaterial({ color: 0x6a4020 });
  const stick = new Mesh(new CylinderGeometry(0.6, 0.6, 30, 5).rotateZ(Math.PI / 2), wood);
  const brush = new Mesh(new ConeGeometry(3, 9, 6).rotateZ(Math.PI / 2), new MeshLambertMaterial({ color: 0xc09040 }));
  brush.position.x = -17;
  const body = new Mesh(
    new BoxGeometry(5, 10, 5),
    new MeshLambertMaterial({ color: cloak, emissive: cloak, emissiveIntensity: 0.3 }),
  );
  body.position.set(2, 6, 0);
  const head = new Mesh(new SphereGeometry(2.4, 8, 6), new MeshLambertMaterial({ color: 0xe0c0a0 }));
  head.position.set(2.5, 13, 0);
  const hat = new Mesh(new ConeGeometry(3, 8, 8), new MeshLambertMaterial({ color: 0x1a1640 }));
  hat.position.set(2.5, 18, 0);
  g.add(stick, brush, body, head, hat);
  g.scale.setScalar(1.6);
  return g;
}

export interface Magic {
  group: Group;
  update: (dt: number, t: number) => void;
  /** Three broom riders race a lap of the upper city. */
  race: () => void;
  /** The stars round `at` join into a shape, hold it and scatter. */
  constellation: (at: Vec3) => void;
  /** A fox of light runs across the rooftops from one side to the other and vanishes. */
  spirit: (from: Vec3, to: Vec3) => void;
}

const RACE_S = 16;

/** The wizards' half of the sky: broom races, constellations and the spirit fox, each hidden until its event. */
export function createMagic(glow: Texture, rand: Rand): Magic {
  const group = new Group();
  const tops = PLOTS.filter((p) => p.level === "upper").map(
    (p) => new Vector3(p.at.x, 420 + rand() * 260, p.at.z + 160),
  );
  const course = new CatmullRomCurve3(
    tops.sort((a, b) => Math.atan2(a.z + 300, a.x) - Math.atan2(b.z + 300, b.x)),
    true,
  );
  const riders = [0xa02040, 0x2040a0, 0x20a060].map(rider);
  for (const r of riders) r.visible = false;
  const trail = new Emitter(400, glow, { size: 8, colour: new Color(1.3, 1, 0.5), gravity: 4, drag: 0.5, life: 1.2 });
  group.add(...riders, trail.points);
  let race = -1;
  const pace = [1, 1, 1];

  const geo = new BufferGeometry();
  const lp = new Float32BufferAttribute(new Float32Array(32 * 3), 3);
  geo.setAttribute("position", lp);
  const lineMat = new LineBasicMaterial({ color: 0xc8d8ff, transparent: true, opacity: 0, blending: AdditiveBlending });
  const lines = new LineSegments(geo, lineMat);
  lines.frustumCulled = false;
  const starGeo = new BufferGeometry();
  const sp = new Float32BufferAttribute(new Float32Array(32 * 3), 3);
  starGeo.setAttribute("position", sp);
  const starMat = new PointsMaterial({
    color: 0xffffff,
    size: 14,
    map: glow,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const stars = new Points(starGeo, starMat);
  stars.frustumCulled = false;
  group.add(lines, stars);
  let shapeT = -1;
  let count = 0;

  const foxGeo = new BufferGeometry();
  const fp = new Float32BufferAttribute(new Float32Array(160 * 3), 3);
  foxGeo.setAttribute("position", fp);
  const foxMat = new PointsMaterial({
    color: new Color(0.6, 1.2, 1.4),
    size: 9,
    map: glow,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const fox = new Points(foxGeo, foxMat);
  fox.frustumCulled = false;
  fox.visible = false;
  const foxPts = Array.from({ length: 160 }, (_, i) => {
    const a = FOX[i % FOX.length] ?? [0, 0];
    const b = FOX[(i + 1) % FOX.length] ?? [0, 0];
    const k = rand();
    return i < 100 ? [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] : [(rand() - 0.5) * 1.2, rand() * 0.3];
  });
  const foxTrail = new Emitter(300, glow, {
    size: 7,
    colour: new Color(0.5, 1.1, 1.3),
    gravity: -5,
    drag: 0.6,
    life: 1.5,
  });
  group.add(fox, foxTrail.points);
  let run: { from: Vec3; to: Vec3; t: number } | null = null;

  return {
    group,
    race: () => {
      if (race >= 0) return;
      race = 0;
      for (let i = 0; i < 3; i++) pace[i] = 0.9 + rand() * 0.25;
      for (const r of riders) r.visible = true;
    },
    constellation: (at) => {
      const shape = SHAPES[Math.floor(rand() * SHAPES.length)] ?? SHAPES[0] ?? [];
      const s = 220 + rand() * 120;
      count = shape.length;
      shape.forEach(([sx, sy], i) => {
        lp.setXYZ(i, at.x + sx * s, at.y + sy * s, at.z);
        sp.setXYZ(i, at.x + sx * s, at.y + sy * s, at.z);
      });
      lp.needsUpdate = true;
      sp.needsUpdate = true;
      shapeT = 0;
    },
    spirit: (from, to) => {
      run = { from, to, t: 0 };
      fox.visible = true;
    },
    update: (dt, t) => {
      if (race >= 0) {
        race += dt / RACE_S;
        riders.forEach((r, i) => {
          const u = (race * (pace[i] ?? 1) + i * 0.02) % 1;
          const p = course.getPointAt(u);
          const q = course.getPointAt((u + 0.005) % 1);
          r.position.copy(p);
          r.position.y += Math.sin(t * 3 + i) * 4;
          r.lookAt(q);
          r.rotateY(-Math.PI / 2);
          if (rand() < dt * 40) trail.emit(p, 1, (g) => [(g() - 0.5) * 6, (g() - 0.5) * 6, (g() - 0.5) * 6], rand);
        });
        if (race >= 1) {
          race = -1;
          for (const r of riders) r.visible = false;
        }
      }
      trail.update(dt);
      if (shapeT >= 0) {
        shapeT += dt;
        const grow = clamp(shapeT / 2, 0, 1);
        geo.setDrawRange(0, Math.floor((count * grow) / 2) * 2);
        starGeo.setDrawRange(0, count);
        const fade = shapeT < 6 ? 1 : Math.max(0, 1 - (shapeT - 6) / 1.5);
        lineMat.opacity = 0.7 * fade;
        starMat.opacity = fade;
        if (shapeT > 7.5) shapeT = -1;
      }
      if (run) {
        run.t += dt / 9;
        const k = run.t;
        const cx = run.from.x + (run.to.x - run.from.x) * k;
        const cy = run.from.y + (run.to.y - run.from.y) * k + Math.abs(Math.sin(k * 40)) * 30;
        const cz = run.from.z + (run.to.z - run.from.z) * k;
        const dir = run.to.x > run.from.x ? 1 : -1;
        const fade = k > 0.85 ? Math.max(0, 1 - (k - 0.85) / 0.15) : 1;
        foxPts.forEach(([px = 0, py = 0], i) => {
          const scatter = (1 - fade) * 80;
          fp.setXYZ(i, cx + px * 60 * dir + (rand() - 0.5) * scatter, cy + py * 60 + (rand() - 0.5) * scatter, cz);
        });
        fp.needsUpdate = true;
        foxMat.opacity = fade;
        if (rand() < dt * 30)
          foxTrail.emit({ x: cx - dir * 50, y: cy + 10, z: cz }, 2, (g) => [(g() - 0.5) * 10, g() * 10, 0], rand);
        if (k >= 1) {
          run = null;
          fox.visible = false;
        }
      }
      foxTrail.update(dt);
    },
  };
}
