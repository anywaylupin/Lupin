import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshLambertMaterial,
  Path,
  PlaneGeometry,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  Sprite,
  SpriteMaterial,
  type Texture,
} from "three";
import { rng, type Rand } from "../math";
import { HUES, NEON, Parts, TILES, type RGB } from "./kit";
import { LEVEL, PLOTS, type Vec3 } from "./plan";
import { deckTexture } from "./textures";

const SHAFT = 90;
const SPAN = 3600;

/**
 * Water for the canals: dark, with bands of pink and cyan neon rippling across it as if the signs above were reflected.
 * One shader for every canal, driven by the shared clock.
 */
export function waterMaterial(time: { value: number }): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uTime: time },
    vertexShader: `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vW;
      void main() {
        float a = sin(vW.x * 0.05 + sin(vW.z * 0.08 + uTime) * 1.5 + uTime * 0.6);
        float b = sin(vW.x * 0.013 - uTime * 0.3 + vW.z * 0.02);
        vec3 c = vec3(0.02, 0.03, 0.08);
        c += vec3(0.9, 0.2, 0.6) * smoothstep(0.92, 1.0, a) * 0.5;
        c += vec3(0.2, 0.8, 1.0) * smoothstep(0.9, 1.0, b * a) * 0.5;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

/** A waterfall sheet: streaks scrolling down, brighter at the lip and fading into mist at the foot. */
export function fallMaterial(time: { value: number }, surge = { value: 0 }): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uTime: time, uSurge: surge },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float uTime;
      uniform float uSurge;
      varying vec2 vUv;
      float h(float n) { return fract(sin(n) * 43758.5453); }
      void main() {
        float col = floor(vUv.x * 40.0);
        float speed = 0.6 + h(col) * 0.6 + uSurge;
        float s = fract(vUv.y * 3.0 + uTime * speed + h(col + 7.0));
        float streak = smoothstep(0.0, 0.25, s) * (1.0 - smoothstep(0.25, 1.0, s));
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        float a = (0.35 + 0.65 * streak) * edge * (0.55 + 0.45 * uSurge);
        vec3 c = mix(vec3(0.55, 0.85, 1.0), vec3(1.0), streak * 0.6);
        gl_FragColor = vec4(c * (1.0 + uSurge), a);
      }`,
  });
}

/** The deck as one sheet with holes cut where the shafts go down, paved in large dark slabs. */
function deck(shafts: readonly Vec3[]): Mesh {
  const back = -3600;
  const s = new Shape();
  s.moveTo(-SPAN, -LEVEL.edge);
  s.lineTo(SPAN, -LEVEL.edge);
  s.lineTo(SPAN, -back);
  s.lineTo(-SPAN, -back);
  s.closePath();
  for (const sh of shafts) {
    const h = new Path();
    const x0 = sh.x - SHAFT / 2;
    const y0 = -sh.z - SHAFT / 2;
    h.moveTo(x0, y0);
    h.lineTo(x0, y0 + SHAFT);
    h.lineTo(x0 + SHAFT, y0 + SHAFT);
    h.lineTo(x0 + SHAFT, y0);
    h.closePath();
    s.holes.push(h);
  }
  const geo = new ShapeGeometry(s);
  geo.rotateX(-Math.PI / 2);
  const tex = deckTexture();
  tex.repeat.set(1 / 128, 1 / 128);
  return new Mesh(geo, new MeshLambertMaterial({ map: tex }));
}

/** A shaft: lit walls dropping to the undercity and a glowing floor far below, so the deck looks hollow and inhabited. */
function shaft(p: Parts, s: Vec3, c: RGB) {
  const d = LEVEL.deck - LEVEL.under;
  for (const [x, z, w, dd] of [
    [s.x, s.z - SHAFT / 2, SHAFT, 4],
    [s.x, s.z + SHAFT / 2, SHAFT, 4],
    [s.x - SHAFT / 2, s.z, 4, SHAFT],
    [s.x + SHAFT / 2, s.z, 4, SHAFT],
  ] as const)
    p.block("body", w, d, dd, x, LEVEL.under, z, undefined, Math.round(s.x));
  p.box("lit", SHAFT, 1, SHAFT, s.x, LEVEL.under + 2, s.z, [c[0] * 0.5, c[1] * 0.5, c[2] * 0.5]);
  p.loop(
    [
      [s.x - SHAFT / 2, 0.5, s.z - SHAFT / 2],
      [s.x + SHAFT / 2, 0.5, s.z - SHAFT / 2],
      [s.x + SHAFT / 2, 0.5, s.z + SHAFT / 2],
      [s.x - SHAFT / 2, 0.5, s.z + SHAFT / 2],
    ],
    NEON.amber,
  );
}

/** True where an edge or undercity landmark needs the cliff face clear for its own structure. */
function busy(x: number): boolean {
  return PLOTS.some((p) => (p.level === "edge" || p.id === "lantern") && Math.abs(p.at.x - x) < p.room);
}

/**
 * The cliff face: the deck's front wall, lived in from top to bottom with stacked habitats, balconies, signs and pipes, like a city built down a cliff.
 * A neon lip runs along the top edge so the boundary between the levels always reads.
 */
function cliff(p: Parts, rand: Rand) {
  const e = LEVEL.edge;
  const d = LEVEL.deck - LEVEL.under;
  p.block("body", SPAN * 2, d, 24, 0, LEVEL.under, e - 12, undefined, 99);
  p.box("lit", SPAN * 2, 1.2, 1.2, 0, 0.6, e + 1, NEON.cyan);
  for (let x = -SPAN + 40; x < SPAN; x += 30 + rand() * 60) {
    if (busy(x)) continue;
    let y = LEVEL.under;
    while (y < -30) {
      const h = 18 + rand() * 26;
      const w = 26 + rand() * 50;
      const dd = 12 + rand() * 34;
      if (rand() < 0.75) {
        p.block("body", w, h, dd, x, y, e + dd / 2, undefined, Math.floor(rand() * 999));
        if (rand() < 0.3) p.box("lit", w, 0.8, 0.8, x, y + h, e + dd, HUES[Math.floor(rand() * 3)] ?? NEON.pink);
        if (rand() < 0.2) p.block("roof", w + 6, 1.5, dd + 6, x, y + h, e + dd / 2, TILES[Math.floor(rand() * 3)]);
        if (rand() < 0.12) p.box("lamp", 2.4, 3.2, 2.4, x + w / 2, y + h - 4, e + dd + 2);
      }
      y += h + rand() * 6;
    }
  }
  for (const y of [-60, -140, -190]) {
    p.at(0, 0, 0);
    p.strut("metal", { x: -SPAN, y, z: e + 40 }, { x: SPAN, y, z: e + 40 }, 2.4, 6);
    p.strut("metal", { x: -SPAN, y: y - 6, z: e + 44 }, { x: SPAN, y: y - 6, z: e + 44 }, 1.4, 6);
  }
  for (let x = -SPAN; x < SPAN; x += 140 + rand() * 200) {
    if (busy(x)) continue;
    p.strut("metal", { x, y: LEVEL.under, z: e + 30 }, { x, y: -4, z: e + 30 }, 1.8, 6);
  }
}

/** Shacks, stalls and stilt houses spread across the undercity floor, with tarps for roofs and lamps at their doors. */
function shacks(p: Parts, rand: Rand) {
  for (let i = 0; i < 160; i++) {
    const x = (rand() - 0.5) * SPAN * 1.6;
    const z = LEVEL.edge + 60 + rand() * 900;
    if (PLOTS.some((q) => q.level !== "upper" && q.level !== "sky" && Math.hypot(q.at.x - x, q.at.z - z) < q.room))
      continue;
    if (Math.abs(z - (LEVEL.edge + 150)) < 30) continue;
    const w = 14 + rand() * 30;
    const h = 10 + rand() * 30;
    p.block("body", w, h, w * 0.8, x, LEVEL.under, z, undefined, Math.floor(rand() * 999));
    p.block("roof", w + 4, 1.2, w * 0.8 + 4, x, LEVEL.under + h, z, TILES[Math.floor(rand() * 3)]);
    if (rand() < 0.4) p.box("lamp", 1.8, 2.4, 1.8, x + w / 2 + 1, LEVEL.under + 8, z + w * 0.4);
  }
}

export interface Ground {
  group: Group;
  water: ShaderMaterial;
}

/**
 * Builds both levels' ground: the deck with its shafts, the cliff, the undercity floor and its canals, and haze pooled in the undercity.
 * Static pieces go into `p` to merge with the rest of the city; the deck, water and haze are their own meshes.
 */
export function createGround(p: Parts, shafts: readonly Vec3[], glow: Texture, time: { value: number }): Ground {
  const rand = rng(31);
  const group = new Group();
  group.add(deck(shafts));
  p.at(0, 0, 0);
  shafts.forEach((s, i) => shaft(p, s, HUES[i % 3] ?? NEON.cyan));
  cliff(p, rand);
  shacks(p, rand);
  const floor = new Mesh(new PlaneGeometry(SPAN * 2, 1600), new MeshLambertMaterial({ color: 0x0a0918 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, LEVEL.under, LEVEL.edge + 800);
  const water = waterMaterial(time);
  const canal = new Mesh(new PlaneGeometry(SPAN * 2, 60), water);
  canal.rotation.x = -Math.PI / 2;
  canal.position.set(0, LEVEL.water, LEVEL.edge + 150);
  const cove = new Mesh(new PlaneGeometry(240, 380), water);
  cove.rotation.x = -Math.PI / 2;
  cove.position.set(280, LEVEL.water, LEVEL.edge + 340);
  group.add(floor, canal, cove);
  const hazeMat = new SpriteMaterial({
    map: glow,
    color: new Color(0.35, 0.2, 0.6),
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  for (let i = 0; i < 14; i++) {
    const s = new Sprite(hazeMat);
    s.scale.set(700, 160, 1);
    s.position.set(-2400 + i * 360 + rand() * 100, LEVEL.under + 50, LEVEL.edge + 200 + rand() * 500);
    group.add(s);
  }
  const shaftGlow = new SpriteMaterial({
    map: glow,
    color: new Color(1, 0.75, 0.4),
    blending: AdditiveBlending,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  for (const s of shafts) {
    const g = new Sprite(shaftGlow);
    g.scale.set(160, 220, 1);
    g.position.set(s.x, 30, s.z);
    group.add(g);
  }
  return { group, water };
}
