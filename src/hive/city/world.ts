import {
  BufferGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  FogExp2,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Cam } from "../camera";
import type { Point } from "../hex";
import { lerp, rng } from "../math";
import { owlspire } from "./academy";
import { createBoards, type Ad } from "./billboards";
import { createLumen } from "./dome";
import { ascender, silverfall, threadline } from "./edge";
import { createDirector } from "./director";
import { createStage } from "./events";
import { buildFillers } from "./fillers";
import { createGround } from "./ground";
import { Parts, SLOTS } from "./kit";
import { materials, merged } from "./materials";
import type { Landmark } from "./landmark";
import { createLife } from "./life";
import { createMagic } from "./magic";
import { DOME, LEVEL, PAN, planFillers, planShafts, VIEW, type Ndc, type Vec3 } from "./plan";
import { createPost, glitchTimer } from "./post";
import { createShips } from "./ships";
import { createSky } from "./sky";
import { facadeTexture, glowTexture, skyTexture } from "./textures";
import { createTraffic } from "./traffic";
import { createTubes } from "./tubes";
import { crucible, lanternSteps, rustCove } from "./under";
import { bambooVeil } from "./bamboo";
import { bellCrown, ironbloom, kaleido } from "./upper";
import { lotusPillar, starberth, steamvault } from "./upper2";

/** What one frame of the city needs to know; flags already fold in reduced motion. */
export interface CityFrame {
  dt: number;
  life: boolean;
  weather: boolean;
  glitch: boolean;
}

export interface CityOptions {
  /** Canvas font families for signs: the CJK subset and the mono face. */
  zh: string;
  mono: string;
  /** The owner's projects, advertised on the billboards. */
  ads: Ad[];
  /** Screen points, in normalised device coordinates, where the city shows through the sheet right now. */
  open: () => Ndc[];
}

export interface City {
  /** True on software rendering, where the city suggests low graphics. */
  soft: boolean;
  /** `hole` is the screen centre of the pre-broken hole, where Lumen is framed at rest. */
  resize: (W: number, H: number, DPR: number, hole: Point) => void;
  /** Places the camera every frame; `step` advances the city's clocks, which happens every other frame. */
  frame: (f: CityFrame, cam: Cam, home: Cam, step: boolean, pointer: Ndc | null) => void;
  /** A hex just opened at this screen point; something happens there soon. */
  reveal: (at: Ndc) => void;
  setLow: (low: boolean) => void;
}

/** Frames between city renders on software rendering. */
const SOFT_EVERY = 12;
/** How far the camera dollies in at the sheet's deepest zoom, in world units. */
const DOLLY = 320;

/**
 * Builds the three.js city into `root`: the deck and cliff, filler towers, Lumen, fourteen landmarks, ships, magic, tubes, traffic and weather.
 * Static geometry merges into one mesh per material; only what moves stays separate.
 * Throws when WebGL is unavailable, so the caller can leave the flat backdrop in place.
 */
export function createCity(root: HTMLElement, o: CityOptions): City {
  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 5, 9000);
  const rest = new PerspectiveCamera(42, 1, 5, 9000);
  const post = createPost(scene, camera);
  const ray = new Vector3();
  const tmp = new Vector3();
  rest.position.set(VIEW.eye.x, VIEW.eye.y, VIEW.eye.z);
  rest.rotation.set(VIEW.pitch, 0, 0);
  rest.updateMatrixWorld();
  const rand = rng(Math.floor(Math.random() * 1e9));
  scene.background = skyTexture();
  scene.fog = new FogExp2(0x2a1c58, 0.00026);
  const hemi = new HemisphereLight(0x8a78e0, 0x120a24, 1.7);
  const back = new DirectionalLight(0xb8a0ff, 1);
  back.position.set(-600, 900, -1400);
  scene.add(hemi, back);

  const time = { value: 0 };
  const glow = glowTexture();
  const facade = facadeTexture(rng(5));
  const boards = createBoards(o.ads, o.mono, o.zh, rand);
  const p = new Parts();
  const fillers = planFillers(rng(7));
  buildFillers(p, fillers, boards);
  const ground = createGround(p, planShafts(rng(9)), glow, time);
  const eye = new Vector3(VIEW.eye.x, VIEW.eye.y, VIEW.eye.z);
  const lumen = createLumen(p, eye, glow, time, rand);
  const ships = createShips(glow, rand);
  const life = createLife(
    glow,
    () => at({ x: (rand() - 0.5) * 1.6, y: (rand() - 0.5) * 1.4 }, 500 + rand() * 500),
    rand,
  );
  const kit = { p, glow, boards, time, rand };
  const landmarks: Landmark[] = [
    kaleido(kit),
    bellCrown(kit),
    ironbloom(kit),
    bambooVeil(kit),
    steamvault(kit),
    starberth(kit, ships.dock),
    lotusPillar(kit),
    owlspire(kit),
    silverfall(kit),
    threadline(kit),
    ascender(kit),
    lanternSteps(kit, (a) => life.lanterns(a)),
    rustCove(kit),
    crucible(kit),
  ];
  const tops: Vec3[] = [
    ...fillers.filter((f) => !f.far).map((f) => ({ x: f.x, y: f.h, z: f.z })),
    ...landmarks.filter((l) => l.anchor.y > 200).map((l) => l.anchor),
  ];
  const stage = createStage();
  const sky = createSky(glow, hemi, stage, tops, () => lumen.react("shock"), rand);
  const magic = createMagic(glow, rand);
  const traffic = createTraffic(rand);
  const tubes = createTubes();

  const mats = materials(facade);
  for (const slot of SLOTS) {
    const list = p.geo.get(slot) ?? [];
    if (list.length) scene.add(new Mesh(merged(list, slot), mats[slot]));
  }
  const lines = new BufferGeometry();
  lines.setAttribute("position", new Float32BufferAttribute(p.lines, 3));
  lines.setAttribute("color", new Float32BufferAttribute(p.colours, 3));
  scene.add(new LineSegments(lines, new LineBasicMaterial({ vertexColors: true })));
  for (const [tex, list] of p.screens) {
    scene.add(new Mesh(mergeGeometries(list) ?? new BufferGeometry(), new MeshBasicMaterial({ map: tex })));
  }
  scene.add(
    ground.group,
    lumen.group,
    ships.group,
    life.group,
    sky.group,
    magic.group,
    traffic.group,
    tubes.group,
    ...landmarks.map((l) => l.group),
  );
  void document.fonts?.ready.then(() => boards.repaint()).catch(() => undefined);

  const scan = document.createElement("div");
  scan.className = "scan";
  root.replaceChildren(post.renderer.domElement, scan);

  let clock = 0;
  let lifeT = 0;
  let weatherT = 0;
  let placed = "";
  let calls = 0;
  let drawn = false;
  let low = false;
  const lens = { x: 0, y: 0 };
  const glitching = glitchTimer();

  /** The world point behind a screen point at a distance from the resting camera, kept above the undercity floor. */
  function at(n: Ndc, dist: number): Vec3 {
    ray.set(n.x, n.y, 0.5).unproject(rest).sub(rest.position).normalize();
    const floor = ray.y < 0 ? (rest.position.y - LEVEL.under - 40) / -ray.y : Infinity;
    ray.multiplyScalar(Math.min(dist, floor)).add(rest.position);
    return { x: ray.x, y: ray.y, z: ray.z };
  }
  const project = (v: Vec3): Ndc | null => {
    tmp.set(v.x, v.y, v.z).project(camera);
    return tmp.z < 1 && Math.abs(tmp.x) < 1.2 && Math.abs(tmp.y) < 1.2 ? { x: tmp.x, y: tmp.y } : null;
  };

  const director = createDirector({ landmarks, lumen, life, magic, sky, ships }, { at, project, open: o.open }, rand);

  const place = (cam: Cam, home: Cam): boolean => {
    const dx = (cam.x - home.x) * cam.z * PAN;
    const dy = (cam.y - home.y) * cam.z * PAN;
    const key = `${dx.toFixed(2)},${dy.toFixed(2)},${cam.z.toFixed(4)}`;
    if (key === placed) return false;
    placed = key;
    camera.position.set(VIEW.eye.x + dx, VIEW.eye.y - dy, VIEW.eye.z);
    camera.rotation.set(VIEW.pitch, 0, 0);
    camera.getWorldDirection(tmp);
    camera.position.addScaledVector(tmp, (1 - 1 / cam.z) * DOLLY);
    camera.updateMatrixWorld();
    return true;
  };

  return {
    soft: post.soft,
    setLow: (l) => {
      low = l;
      post.setLow(l);
      lumen.setLow(l);
      sky.setLow(l);
      drawn = false;
    },
    reveal: director.reveal,
    resize: (w, h, dpr, hole) => {
      post.setSize(w, h, dpr);
      for (const c of [camera, rest]) {
        c.aspect = w / h;
        c.fov = VIEW.fov(c.aspect);
        c.clearViewOffset();
        c.updateProjectionMatrix();
      }
      rest.position.set(VIEW.eye.x, VIEW.eye.y, VIEW.eye.z);
      rest.rotation.set(VIEW.pitch, 0, 0);
      rest.updateMatrixWorld();
      tmp.set(DOME.x, DOME.y, DOME.z).project(rest);
      lens.x = ((tmp.x + 1) / 2) * w - hole.x;
      lens.y = ((1 - tmp.y) / 2) * h - hole.y;
      for (const c of [camera, rest]) c.setViewOffset(w, h, lens.x, lens.y, w, h);
      placed = "";
      drawn = false;
    },
    frame: (f, cam, home, step, pointer) => {
      const moved = place(cam, home);
      if (step) {
        clock += f.dt;
        const dtL = f.life ? f.dt : 0;
        const dtW = f.weather ? f.dt : 0;
        lifeT += dtL;
        weatherT += dtW;
        time.value = lifeT;
        director.step(dtL, clock, weatherT);
        for (const l of landmarks) l.update(dtL, lifeT);
        ships.update(dtL, lifeT);
        magic.update(dtL, lifeT);
        life.update(dtL, lifeT);
        traffic.update(lifeT);
        tubes.update(lifeT);
        sky.update(dtW, weatherT, lifeT, f.weather);
        const domeAt = project({ x: DOME.x, y: DOME.y, z: DOME.z });
        const gaze =
          pointer && domeAt
            ? {
                x: Math.max(-1, Math.min(1, (pointer.x - domeAt.x) * 2)),
                y: Math.max(-1, Math.min(1, (pointer.y - domeAt.y) * 2)),
              }
            : null;
        if (!f.life) lumen.react("sleep");
        lumen.update(dtL, lifeT, gaze);
        boards.update(dtL, f.glitch);
        if (f.life && rand() < f.dt * 8) facade.toggle(1, rand);
        mats.body.emissiveIntensity = lerp(0.9, 1.05, Math.sin(lifeT * 0.2) * 0.5 + 0.5);
      }
      calls++;
      const still = !f.life && !f.weather && !f.glitch;
      if (!moved && (!step || (still && drawn))) return;
      if (post.soft && drawn && calls % SOFT_EVERY !== 0) return;
      drawn = true;
      post.render(glitching(clock, f.glitch && !low), lens);
    },
  };
}
