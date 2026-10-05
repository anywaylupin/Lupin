import {
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  FogExp2,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Cam } from "../camera";
import { hash2, lerp, rng } from "../math";
import { createStage } from "./events";
import { createLife } from "./life";
import { cellNdc, nextCell, planCity, SHRINE, VIEW, type Building, type Vec3 } from "./plan";
import { build, createParts, gates, TILES, type Parts, type Slot } from "./shapes";
import { glitchSlices, glitchTimer, SOFT_EVERY, softwareGl } from "./glitch";
import { createSky } from "./sky";
import { createTraffic } from "./traffic";
import { glowTexture, groundTexture, signTexture, SIGNS, skyTexture, windowTexture } from "./textures";

/** What one frame of the city needs to know; flags already fold in reduced motion. */
export interface CityFrame {
  dt: number;
  life: boolean;
  weather: boolean;
  glitch: boolean;
}

export interface City {
  resize: (W: number, H: number, DPR: number) => void;
  /** Places the camera from the sheet camera every frame; `step` advances the city's clocks, which happens every other frame. */
  frame: (f: CityFrame, cam: Cam, home: Cam, step: boolean) => void;
}

/** The ground spans whole blocks so its street lines fall exactly between the buildings. */
const GROUND = { w: 64 * 62, d: 64 * 34, z: -704 } as const;
/** World units the city camera moves per pixel of sheet pan; small, so the city reads as far behind the sheet. */
const PAN = 0.2;
const DOLLY = 160;

/** Merges one slot's pieces; `tint` gives pieces without their own colour the default, since merging needs every piece to carry the same attributes. */
function merged(list: BufferGeometry[], uv: boolean, tint?: readonly [number, number, number]): BufferGeometry {
  const flat = list.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (!uv && n.getAttribute("uv")) n.deleteAttribute("uv");
    if (tint && !n.getAttribute("color")) {
      const count = n.getAttribute("position").count;
      n.setAttribute("color", new Float32BufferAttribute(Array.from({ length: count }, () => tint).flat(), 3));
    }
    if (!n.getAttribute("normal")) n.computeVertexNormals();
    return n;
  });
  return mergeGeometries(flat) ?? new BufferGeometry();
}

function materials(windows: ReturnType<typeof windowTexture>): Record<Slot, Material> {
  return {
    body: new MeshLambertMaterial({ color: 0x1c1a3c, emissive: 0xffffff, emissiveMap: windows.tex }),
    wood: new MeshLambertMaterial({ color: 0x4a1a2e, emissive: 0x1c0812 }),
    roof: new MeshLambertMaterial({ vertexColors: true, emissive: 0x06081a, side: DoubleSide }),
    gate: new MeshBasicMaterial({ color: 0xff3a5a }),
    lamp: new MeshBasicMaterial({ color: 0xffb24a }),
  };
}

function neon(p: Parts): LineSegments {
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(p.lines, 3));
  geo.setAttribute("color", new Float32BufferAttribute(p.colours, 3));
  return new LineSegments(geo, new LineBasicMaterial({ vertexColors: true }));
}

function ground(): Mesh {
  const tex = groundTexture();
  tex.repeat.set(GROUND.w / 64, GROUND.d / 64);
  const m = new Mesh(new PlaneGeometry(GROUND.w, GROUND.d), new MeshBasicMaterial({ map: tex }));
  m.rotation.x = -Math.PI / 2;
  m.position.z = GROUND.z;
  return m;
}

/**
 * Builds the three.js city into `root`: one WebGL canvas with every building merged into a handful of meshes by material.
 * Throws when WebGL is unavailable, so the caller can leave the flat backdrop in place.
 */
export function createCity(root: HTMLElement, zh: string): City {
  const renderer = new WebGLRenderer({ antialias: devicePixelRatio < 2, powerPreference: "high-performance" });
  const scene = new Scene();
  scene.background = skyTexture();
  scene.fog = new FogExp2(0x1d1244, 0.0011);
  const camera = new PerspectiveCamera(55, 1, 1, 4200);
  const rest = new PerspectiveCamera(55, 1, 1, 4200);
  const rand = rng(Math.floor(Math.random() * 1e9));

  const hemi = new HemisphereLight(0x6a58c0, 0x07061a, 1.5);
  const back = new DirectionalLight(0x9a86e8, 0.8);
  back.position.set(-300, 400, -700);
  const pink = new PointLight(0xd9479f, 1.4e4, 520, 2);
  pink.position.set(-170, 70, 90);
  const cyan = new PointLight(0x5cc4dc, 1.4e4, 520, 2);
  cyan.position.set(170, 70, 90);
  scene.add(hemi, back, pink, cyan, ground());

  const buildings: Building[] = planCity(rng(7));
  const parts = createParts();
  for (const b of buildings) build(parts, b);
  build(parts, SHRINE);
  gates(parts);
  const windows = windowTexture(rng(5));
  const mats = materials(windows);
  for (const slot of Object.keys(parts.geo) as Slot[]) {
    scene.add(new Mesh(merged(parts.geo[slot], slot === "body", slot === "roof" ? TILES[2] : undefined), mats[slot]));
  }
  scene.add(neon(parts));
  const signs = SIGNS.map((s) => signTexture(s.text, s.colour, zh));
  const signMats = signs.map((s) => new MeshBasicMaterial({ map: s.tex }));
  signMats.forEach((m, i) => {
    const list = parts.signs.filter((s) => s.sign === i).map((s) => s.geo);
    if (list.length) scene.add(new Mesh(merged(list, true), m));
  });
  void document.fonts
    ?.load(`900 46px ${zh}`)
    .then(() => signs.forEach((s) => s.redraw()))
    .catch(() => undefined);

  const last = Array.from({ length: 9 }, () => -rand() * 10);
  let clock = 0;
  const ray = new Vector3();
  const at = (x: number, y: number, dist: number): Vec3 => {
    ray.set(x, y, 0.5).unproject(rest).sub(rest.position).normalize();
    const floor = ray.y < 0 ? (rest.position.y - 30) / -ray.y : Infinity;
    ray.multiplyScalar(Math.min(dist, floor)).add(rest.position);
    return { x: ray.x, y: ray.y, z: ray.z };
  };
  const spot = (near: number, far: number) => {
    const c = cellNdc(nextCell(last, clock, rand), rand);
    return at(c.x, c.y, lerp(near, far, rand()));
  };
  const tall = buildings.filter((b) => b.h > 60);
  const strike = (): Vec3 => {
    const s = spot(400, 1200);
    const b = tall.reduce<Building | null>((best, c) => {
      const d = Math.hypot(c.x - s.x, c.z - s.z);
      return !best || d < Math.hypot(best.x - s.x, best.z - s.z) ? c : best;
    }, null);
    return b ? { x: b.x, y: b.h + 16, z: b.z } : s;
  };

  const glow = glowTexture();
  const stage = createStage();
  const sky = createSky(glow, hemi, stage, strike, rand);
  const traffic = createTraffic(buildings, rand);
  const life = createLife(glow, spot, at, rand);
  scene.add(sky.group, traffic.group, life.group);

  const scan = document.createElement("div");
  scan.className = "scan";
  root.replaceChildren(renderer.domElement, scan);

  let W = 1;
  let H = 1;
  let lifeT = 0;
  let weatherT = 0;
  let placed = "";
  let calls = 0;
  let drawn = false;
  const soft = softwareGl(renderer);
  const glitching = glitchTimer();
  const eye = new Vector3();
  const target = new Vector3();
  const look = new Vector3();

  const place = (cam: Cam, home: Cam): boolean => {
    const dx = (cam.x - home.x) * cam.z * PAN;
    const dy = (cam.y - home.y) * cam.z * PAN * 0.6;
    const key = `${dx.toFixed(2)},${dy.toFixed(2)},${cam.z.toFixed(4)}`;
    if (key === placed) return false;
    placed = key;
    eye.set(VIEW.eye.x + dx, VIEW.eye.y - dy, VIEW.eye.z);
    target.set(VIEW.target.x + dx, VIEW.target.y - dy, VIEW.target.z);
    look.subVectors(target, eye).normalize();
    eye.addScaledVector(look, (1 - 1 / cam.z) * DOLLY);
    camera.position.copy(eye);
    camera.lookAt(target);
    return true;
  };

  return {
    resize: (w, h, dpr) => {
      W = w;
      H = h;
      renderer.setPixelRatio(soft ? 0.5 : Math.min(dpr, 1.5));
      renderer.setSize(w, h);
      for (const c of [camera, rest]) {
        c.aspect = w / h;
        c.fov = VIEW.fov(c.aspect);
        c.updateProjectionMatrix();
      }
      rest.position.set(VIEW.eye.x, VIEW.eye.y, VIEW.eye.z);
      rest.lookAt(VIEW.target.x, VIEW.target.y, VIEW.target.z);
      rest.updateMatrixWorld();
      placed = "";
    },
    frame: (f, cam, home, step) => {
      const moved = place(cam, home);
      if (step) {
        clock += f.dt;
        const dtL = f.life ? f.dt : 0;
        const dtW = f.weather ? f.dt : 0;
        lifeT += dtL;
        weatherT += dtW;
        traffic.update(lifeT);
        life.update(dtL, lifeT);
        const g = sky.update(dtW, weatherT, lifeT, f.weather);
        (mats.body as MeshLambertMaterial).emissiveIntensity = 0.85 + 0.6 * g;
        if (f.life && rand() < f.dt * 12) windows.toggle(1, rand);
        signMats.forEach((m, i) => m.color.copy(f.glitch && hash2(Math.floor(clock * 8), i) < 0.04 ? DIM : FULL));
      }
      calls++;
      const still = !f.life && !f.weather && !f.glitch;
      if (!moved && (!step || (still && drawn))) return;
      if (soft && drawn && calls % SOFT_EVERY !== 0) return;
      drawn = true;
      renderer.render(scene, camera);
      const seed = glitching(clock, f.glitch);
      if (seed !== null) glitchSlices(renderer, scene, camera, W, H, seed + Math.floor(clock * 22));
    },
  };
}

const DIM = new Color(0.25, 0.25, 0.25);
const FULL = new Color(1, 1, 1);
