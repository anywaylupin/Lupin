import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  Vector3,
  type HemisphereLight,
  type Texture,
} from "three";
import { clamp, easeOut, lerp, type Rand } from "../math";
import { createDome } from "./dome";
import { claim, type Stage } from "./events";
import { CYAN, WARM } from "./palette";
import { DOME, STAR, type Vec3 } from "./plan";

/** A flare runs 1.4 s: the star blooms, a ring of light rolls out, and every window in the city brightens in step. */
const FLARE_S = 1.4;
const RAIN_TOP = 520;

/**
 * Rain as streaks that fall in the vertex shader, so thousands cost one draw and no per-frame uploads.
 * Each streak has its own speed; near ones are long and bright, and none fall inside the dome.
 */
const rainShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uTop;
    uniform float uDome;
    attribute float aEnd;
    attribute float aSpeed;
    varying float vA;
    void main() {
      vec3 p = position;
      p.y = mod(p.y - uTime * aSpeed, uTop);
      float len = 6.0 + aSpeed * 0.05;
      p.y += aEnd * len;
      p.x += aEnd * len * 0.12;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float near = clamp(1.0 - (-mv.z - 60.0) / 1200.0, 0.0, 1.0);
      vA = (0.08 + 0.3 * near) * step(uDome, length(p));
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uCyan;
    varying float vA;
    void main() {
      gl_FragColor = vec4(uCyan, vA);
    }`,
};

function sprite(map: Texture, colour: Color, scale: number, opacity = 1): Sprite {
  const s = new Sprite(
    new SpriteMaterial({
      map,
      color: colour,
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity,
    }),
  );
  s.scale.setScalar(scale);
  return s;
}

/** The power star over the dome, its tilted ring, the beam down to the dome's crown and the motes that climb it. */
function star(glowTex: Texture) {
  const g = new Group();
  g.position.set(STAR.x, STAR.y, STAR.z);
  const halo = sprite(glowTex, WARM, 90, 0.6);
  const core = sprite(glowTex, new Color(1, 1, 1), 26);
  const burst = sprite(glowTex, WARM, 1, 0);
  const ringGeo = new BufferGeometry().setFromPoints(
    Array.from(
      { length: 48 },
      (_, i) => new Vector3(Math.cos((i / 48) * Math.PI * 2) * 30, 0, Math.sin((i / 48) * Math.PI * 2) * 30),
    ),
  );
  const ring = new LineLoop(ringGeo, new LineBasicMaterial({ color: 0xa9adda }));
  ring.rotation.set(0.35, 0, -0.3);
  const shock = new LineLoop(
    ringGeo,
    new LineBasicMaterial({ color: WARM, transparent: true, opacity: 0, blending: AdditiveBlending }),
  );
  shock.rotation.x = Math.PI / 2;
  g.add(halo, burst, core, ring, shock);
  const top = new Vector3(0, DOME.r, 0);
  const tip = new Vector3(STAR.x, STAR.y, STAR.z);
  const len = top.distanceTo(tip);
  const beamMat = new MeshBasicMaterial({
    color: WARM,
    transparent: true,
    opacity: 0.35,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const beam = new Mesh(new CylinderGeometry(1.4, 1.4, len, 8, 1, true), beamMat);
  const sheathMat = beamMat.clone();
  sheathMat.opacity = 0.07;
  const sheath = new Mesh(new CylinderGeometry(6, 6, len, 12, 1, true), sheathMat);
  const mid = top.clone().lerp(tip, 0.5);
  for (const m of [beam, sheath]) {
    m.position.copy(mid);
    m.lookAt(tip);
    m.rotateX(Math.PI / 2);
  }
  const motes = Array.from({ length: 5 }, () => sprite(glowTex, WARM, 6));
  return {
    g,
    halo,
    core,
    burst,
    ring,
    shock,
    beams: [beam, sheath],
    beam: [beamMat, sheathMat] as const,
    motes,
    top,
    tip,
  };
}

function rain() {
  const pos: number[] = [];
  const end: number[] = [];
  const speed: number[] = [];
  for (let i = 0; i < 3200; i++) {
    const x = (Math.random() - 0.5) * 1800;
    const y = Math.random() * RAIN_TOP;
    const z = 340 - Math.random() * 1400;
    const s = 160 + Math.random() * 120;
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
      uniforms: { uTime: time, uTop: { value: RAIN_TOP }, uDome: { value: DOME.r + 2 }, uCyan: { value: CYAN } },
      transparent: true,
      depthWrite: false,
    }),
  );
  lines.frustumCulled = false;
  return { lines, time };
}

interface Bolt {
  t: number;
  at: Vec3;
}

/** The weather half of the city: the dome's inner snow and barrier, the star and its flare, rain and lightning. */
export interface Sky {
  group: Group;
  /** Advances on weather time; returns the flare glow, 0 at rest and 1 at its peak. */
  update: (dt: number, t: number, lifeT: number, weather: boolean) => number;
}

/**
 * Builds the sky. `strike` picks where the next bolt lands: the tallest top near a spot chosen in a screen cell that has waited longest.
 * Lightning lights the hemisphere and a point light at the strike, so the roofs around it flash, not the whole city.
 */
export function createSky(glowTex: Texture, hemi: HemisphereLight, stage: Stage, strike: () => Vec3, rand: Rand): Sky {
  const group = new Group();
  const time = { value: 0 };
  const glow = { value: 0 };
  const d = createDome(time, glow);
  const s = star(glowTex);
  const r = rain();
  const boltMat = new LineBasicMaterial({ color: 0xe1e6ff, transparent: true, opacity: 0 });
  const boltGeo = new BufferGeometry();
  boltGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(120 * 3), 3));
  const bolt = new LineSegments(boltGeo, boltMat);
  bolt.frustumCulled = false;
  const flash = new PointLight(0xb4aaff, 0, 700, 2);
  group.add(d.g, s.g, ...s.beams, ...s.motes, r.lines, bolt, flash);

  let flare: number | null = null;
  let nextFlare = 3;
  let cur: Bolt | null = null;
  let nextBolt = 5;
  const ripples = d.rippleU.value;
  const baseHemi = hemi.intensity;

  const strikeBolt = (at: Vec3) => {
    const pts: number[] = [];
    const path: Vec3[] = [];
    let x = at.x + (rand() - 0.5) * 60;
    let z = at.z;
    for (let y = 640; y > at.y; y -= 22 + rand() * 18) {
      path.push({ x, y, z });
      x += (rand() - 0.5) * 26 + (at.x - x) * 0.18;
      z += (rand() - 0.5) * 10;
    }
    path.push(at);
    path.forEach((p, i) => {
      const n = path[i + 1];
      if (n) pts.push(p.x, p.y, p.z, n.x, n.y, n.z);
    });
    for (let b = 0; b < 2; b++) {
      const from = path[2 + Math.floor(rand() * Math.max(1, path.length - 4))];
      if (!from) continue;
      let p = from;
      for (let k = 0; k < 4; k++) {
        const n = { x: p.x + (rand() < 0.5 ? -1 : 1) * (10 + rand() * 16), y: p.y - 14 - rand() * 10, z: p.z };
        pts.push(p.x, p.y, p.z, n.x, n.y, n.z);
        p = n;
      }
    }
    const buf = boltGeo.getAttribute("position");
    const n = Math.min(pts.length / 3, buf.count);
    for (let i = 0; i < n; i++) buf.setXYZ(i, pts[i * 3] ?? 0, pts[i * 3 + 1] ?? 0, pts[i * 3 + 2] ?? 0);
    buf.needsUpdate = true;
    boltGeo.setDrawRange(0, n);
    flash.position.set(at.x, at.y + 40, at.z);
    cur = { t: 0, at };
  };

  return {
    group,
    update: (dt, t, lifeT, weather) => {
      time.value = t;
      if (flare === null) {
        nextFlare -= dt;
        if (nextFlare <= 0) {
          if (claim(stage, t, FLARE_S)) flare = 0;
          else nextFlare = 1;
        }
      } else if ((flare += dt) > FLARE_S) {
        flare = null;
        nextFlare = 15 + rand() * 15;
      }
      const k = flare === null ? 0 : clamp(flare / FLARE_S, 0, 1);
      glow.value = flare === null ? 0 : Math.sin(Math.PI * k);
      const pulse = 0.85 + 0.15 * Math.sin(t * 1.7);
      s.core.scale.setScalar(26 * pulse * (1 + 0.4 * glow.value));
      s.halo.scale.setScalar(90 + 70 * glow.value);
      s.burst.material.opacity = flare === null ? 0 : 0.8 * (1 - k);
      s.burst.scale.setScalar(20 + 260 * easeOut(k));
      s.shock.material.opacity = flare === null ? 0 : 0.7 * (1 - k);
      s.shock.scale.setScalar(1 + 6 * easeOut(k));
      s.ring.rotation.y = t * 0.2;
      s.beam[0].opacity = 0.35 + 0.4 * glow.value;
      s.beam[1].opacity = 0.07 + 0.1 * glow.value;
      s.motes.forEach((m, i) => {
        m.position.copy(s.top).lerp(s.tip, ((lifeT * 0.25 + i / s.motes.length) % 1) * 0.85);
      });
      d.latticeMat.opacity = 0.18 + 0.25 * glow.value;
      r.lines.visible = weather;
      if (weather && rand() < dt * 6) {
        const slot = ripples.find((q) => q.w < 0);
        if (slot) {
          const a = rand() * Math.PI * 2;
          const up = 0.25 + rand() * 0.7;
          const h = Math.sqrt(1 - up * up);
          slot.set(Math.cos(a) * h, up, Math.sin(a) * h, 0);
        }
      }
      for (const q of ripples) if (q.w >= 0 && (q.w += dt) > 0.5) q.w = -1;
      r.time.value = t;
      nextBolt -= dt;
      if (!cur && weather && nextBolt <= 0) {
        if (claim(stage, t, 0.5)) strikeBolt(strike());
        else nextBolt = 1;
      }
      let a = 0;
      if (cur) {
        cur.t += dt * 1000;
        const bt = cur.t;
        a =
          bt < 70 ? 1 : bt < 140 ? 0.15 : bt < 230 ? 0.8 : bt < 320 ? 0.1 : bt < 440 ? 0.5 * (1 - (bt - 320) / 120) : 0;
        if (bt > 460) {
          cur = null;
          nextBolt = 7 + rand() * 8;
        }
      }
      boltMat.opacity = a;
      flash.intensity = a * 4e4;
      hemi.intensity = lerp(baseHemi, baseHemi * 3, a) * (1 + 0.25 * glow.value);
      return glow.value;
    },
  };
}
