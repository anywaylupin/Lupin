import {
  AdditiveBlending,
  BufferGeometry,
  ConeGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  Points,
  PointsMaterial,
  ShaderMaterial,
  type HemisphereLight,
  type Texture,
} from "three";
import { lerp, type Rand } from "../math";
import { claim, type Stage } from "./events";
import { DOME, LEVEL, type Vec3 } from "./plan";

const RAIN = { x: 1800, y0: LEVEL.under, y1: 1000, z0: -1300, z1: 1250 } as const;

/**
 * Rain as streaks that fall in the vertex shader, so thousands cost one draw and no per-frame uploads.
 * Each streak has its own speed; near ones are long and bright, and none fall inside Lumen.
 */
const rainShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uTop;
    uniform float uBottom;
    uniform vec4 uDome;
    attribute float aEnd;
    attribute float aSpeed;
    varying float vA;
    void main() {
      vec3 p = position;
      float span = uTop - uBottom;
      p.y = uBottom + mod(p.y - uBottom - uTime * aSpeed, span);
      float len = 8.0 + aSpeed * 0.05;
      p.y += aEnd * len;
      p.x += aEnd * len * 0.12;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float near = clamp(1.0 - (-mv.z - 60.0) / 1600.0, 0.0, 1.0);
      vA = (0.06 + 0.3 * near) * step(uDome.w, length(p - uDome.xyz));
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying float vA;
    void main() {
      gl_FragColor = vec4(0.55, 0.8, 1.0, vA);
    }`,
};

function rain(count: number) {
  const pos: number[] = [];
  const end: number[] = [];
  const speed: number[] = [];
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * RAIN.x * 2;
    const y = lerp(RAIN.y0, RAIN.y1, Math.random());
    const z = lerp(RAIN.z0, RAIN.z1, Math.random());
    const s = 240 + Math.random() * 160;
    for (const e of [0, 1]) {
      pos.push(x, y, z);
      end.push(e);
      speed.push(s);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setAttribute("aEnd", new Float32BufferAttribute(end, 1));
  geo.setAttribute("aSpeed", new Float32BufferAttribute(speed, 1));
  const time = { value: 0 };
  const lines = new LineSegments(
    geo,
    new ShaderMaterial({
      ...rainShader,
      uniforms: {
        uTime: time,
        uTop: { value: RAIN.y1 },
        uBottom: { value: RAIN.y0 },
        uDome: { value: [DOME.x, DOME.y, DOME.z, DOME.r + 4] },
      },
      transparent: true,
      depthWrite: false,
    }),
  );
  lines.frustumCulled = false;
  return { lines, time, count };
}

/** Stars on a far shell above the horizon, twinkling by size; the haze near the horizon swallows the low ones. */
function stars(glow: Texture, rand: Rand): Points {
  const pos: number[] = [];
  for (let i = 0; i < 700; i++) {
    const a = (rand() - 0.5) * Math.PI * 1.2 - Math.PI / 2;
    const b = 0.08 + rand() * 0.9;
    const r = 5200;
    pos.push(Math.cos(a) * Math.cos(b) * r, 300 + Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r);
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  const p = new Points(
    geo,
    new PointsMaterial({
      size: 2.2,
      sizeAttenuation: false,
      map: glow,
      color: 0xdde4ff,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  );
  p.frustumCulled = false;
  return p;
}

/** Searchlights on the tallest towers, sweeping slow arcs; additive cones, so they cost almost nothing. */
function searchlights(tops: readonly Vec3[]) {
  const mat = new MeshBasicMaterial({
    color: 0x9fb8ff,
    transparent: true,
    opacity: 0.05,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const geo = new ConeGeometry(90, 1400, 20, 1, true);
  geo.translate(0, -700, 0);
  geo.rotateX(Math.PI);
  const beams = tops.map((t, i) => {
    const pivot = new Group();
    pivot.position.set(t.x, t.y, t.z);
    pivot.add(new Mesh(geo, mat));
    return { pivot, phase: i * 1.7 };
  });
  return {
    meshes: beams.map((b) => b.pivot),
    update: (t: number) => {
      for (const b of beams) {
        b.pivot.rotation.z = Math.sin(t * 0.2 + b.phase) * 0.55;
        b.pivot.rotation.x = Math.cos(t * 0.15 + b.phase) * 0.3 - 0.15;
      }
    },
  };
}

export interface Sky {
  group: Group;
  update: (dt: number, t: number, lifeT: number, weather: boolean) => void;
  /** Lightning strikes the tallest top near `at` at once, if the stage is free at clock time `now`. */
  strike: (at: Vec3, now: number) => boolean;
  setLow: (low: boolean) => void;
}

/**
 * The weather half of the city: stars, rain over both levels, searchlights and lightning.
 * Lightning lights the hemisphere and a point light at the strike, so the roofs around it flash, not the whole city.
 * `onStrike` tells the rest of the city, so Lumen can look shocked.
 */
export function createSky(
  glow: Texture,
  hemi: HemisphereLight,
  stage: Stage,
  tops: readonly Vec3[],
  onStrike: () => void,
  rand: Rand,
): Sky {
  const group = new Group();
  const r = rain(4000);
  const tallest = [...tops].sort((a, b) => b.y - a.y).slice(0, 5);
  const lights = searchlights(tallest);
  const boltMat = new LineBasicMaterial({ color: 0xe8ecff, transparent: true, opacity: 0 });
  const boltGeo = new BufferGeometry();
  boltGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(160 * 3), 3));
  const bolt = new LineSegments(boltGeo, boltMat);
  bolt.frustumCulled = false;
  const flash = new PointLight(0xb4aaff, 0, 1400, 1.6);
  group.add(stars(glow, rand), r.lines, ...lights.meshes, bolt, flash);
  let cur = -1;
  let nextBolt = 6;
  const baseHemi = hemi.intensity;

  const fire = (at: Vec3) => {
    const pts: number[] = [];
    const path: Vec3[] = [];
    let x = at.x + (rand() - 0.5) * 120;
    let z = at.z;
    for (let y = 1500; y > at.y; y -= 40 + rand() * 30) {
      path.push({ x, y, z });
      x += (rand() - 0.5) * 50 + (at.x - x) * 0.2;
      z += (rand() - 0.5) * 20;
    }
    path.push(at);
    path.forEach((p, i) => {
      const n = path[i + 1];
      if (n) pts.push(p.x, p.y, p.z, n.x, n.y, n.z);
    });
    for (let b = 0; b < 3; b++) {
      let p = path[2 + Math.floor(rand() * Math.max(1, path.length - 4))];
      for (let k = 0; p && k < 5; k++) {
        const n = { x: p.x + (rand() < 0.5 ? -1 : 1) * (20 + rand() * 30), y: p.y - 25 - rand() * 20, z: p.z };
        pts.push(p.x, p.y, p.z, n.x, n.y, n.z);
        p = n;
      }
    }
    const buf = boltGeo.getAttribute("position");
    const n = Math.min(pts.length / 3, buf.count);
    for (let i = 0; i < n; i++) buf.setXYZ(i, pts[i * 3] ?? 0, pts[i * 3 + 1] ?? 0, pts[i * 3 + 2] ?? 0);
    buf.needsUpdate = true;
    boltGeo.setDrawRange(0, n);
    flash.position.set(at.x, at.y + 80, at.z);
    cur = 0;
    onStrike();
  };
  const nearestTop = (at: Vec3) =>
    tops.reduce(
      (best, c) =>
        Math.hypot(c.x - at.x, c.z - at.z) - c.y * 0.3 < Math.hypot(best.x - at.x, best.z - at.z) - best.y * 0.3
          ? c
          : best,
      tops[0] ?? at,
    );

  return {
    group,
    setLow: (low) => {
      r.lines.geometry.setDrawRange(0, (low ? r.count / 3 : r.count) * 2);
    },
    strike: (at, now) => {
      if (cur >= 0 || !claim(stage, now, 0.5)) return false;
      fire(nearestTop(at));
      return true;
    },
    update: (dt, t, lifeT, weather) => {
      lights.update(lifeT);
      r.lines.visible = weather;
      r.time.value = t;
      nextBolt -= dt;
      if (cur < 0 && weather && nextBolt <= 0) {
        nextBolt = 12 + rand() * 10;
        const any = tops[Math.floor(rand() * tops.length)];
        if (any && claim(stage, t, 0.5)) fire(any);
      }
      let a = 0;
      if (cur >= 0) {
        cur += dt * 1000;
        const bt = cur;
        a =
          bt < 70 ? 1 : bt < 140 ? 0.15 : bt < 230 ? 0.8 : bt < 320 ? 0.1 : bt < 440 ? 0.5 * (1 - (bt - 320) / 120) : 0;
        if (bt > 460) cur = -1;
      }
      boltMat.opacity = a;
      flash.intensity = a * 2e5;
      hemi.intensity = lerp(baseHemi, baseHemi * 2.5, a);
    },
  };
}
