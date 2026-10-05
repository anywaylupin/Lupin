import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  PointLight,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type Texture,
} from "three";
import { clamp, ease, type Rand } from "../math";
import { FACES } from "./cast";
import { drawFace, type FaceState, type Mood } from "./faces";
import { NEON, type Parts } from "./kit";
import { DOME, LEVEL, type Ndc } from "./plan";
import { canvas, ctx, texture } from "./textures";
import type { World } from "./diorama";
import { concert, desert, forest, reef, tundra } from "./worlds";
import { blossom, cove, library, space, volcano } from "./worlds2";

/**
 * The LED skin: a face projected flat onto the half facing the city, a dotted LED grid over everything, colour waves on the far side,
 * the dots fading to an even glow where they would shrink under a few pixels and shimmer,
 * and an opening that grows from the face's centre and shows the inner wall in the world's sky colour, with a bright rim round it.
 */
const skin = {
  vertexShader: `
    varying vec3 vN;
    void main() {
      vN = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D uFace;
    uniform vec3 uFront;
    uniform vec3 uInner;
    uniform float uOpen;
    uniform float uTime;
    uniform float uGrid;
    varying vec3 vN;
    void main() {
      vec3 n = normalize(vN);
      float ang = acos(clamp(dot(n, uFront), -1.0, 1.0));
      float hole = uOpen * 1.25;
      if (!gl_FrontFacing) {
        gl_FragColor = vec4(uInner * (0.55 + 0.45 * n.y), 1.0);
        return;
      }
      if (ang < hole) discard;
      vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), uFront));
      vec3 up = cross(uFront, right);
      vec2 uv = vec2(dot(n, right), dot(n, up)) * 0.5 + 0.5;
      vec3 face = texture2D(uFace, uv).rgb;
      float lon = atan(n.z, n.x);
      float lat = asin(clamp(n.y, -1.0, 1.0));
      vec3 waves = 0.25 * vec3(0.5 + 0.5 * sin(lon * 3.0 + uTime), 0.3 + 0.3 * sin(lat * 5.0 - uTime * 0.7), 0.6 + 0.4 * sin(lon * 2.0 - uTime * 0.5));
      float facing = smoothstep(0.1, 0.3, dot(n, uFront));
      vec3 c = mix(waves, face * 0.78, facing);
      vec2 g = vec2(lon, lat) * uGrid;
      float dots = 0.45 + 0.85 * smoothstep(0.5, 0.2, length(fract(g) - 0.5));
      float tiny = clamp(length(fwidth(g)) * 2.0 - 0.6, 0.0, 1.0);
      c *= mix(dots, 0.9, tiny);
      float rim = uOpen > 0.001 ? smoothstep(0.06, 0.0, abs(ang - hole)) : 0.0;
      c += vec3(0.5, 1.2, 1.5) * rim * 2.0;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

type Phase =
  | { kind: "face"; open: number }
  | { kind: "switch"; t: number; from: number }
  | { kind: "closing"; t: number }
  | { kind: "opening"; t: number }
  | { kind: "inside"; t: number }
  | { kind: "shutting"; t: number };

const SWITCH_S = 0.9;
const OPEN_S = 1.8;
const INSIDE_S = 30;
const SHUT_S = 1.4;
/** Worlds tip toward the viewer like a diorama in a snow globe; level, the camera saw their floors edge on. */
const TILT = 0.45;

export interface Lumen {
  group: Group;
  update: (dt: number, t: number, look: Ndc | null) => void;
  react: (mood: Mood) => void;
  /** Opens now, unless it is already open or opening; the dome's own event. */
  open: () => void;
  setLow: (low: boolean) => void;
}

/** The ring of supports and the plinth Lumen stands on, merged with the rest of the city. */
function supports(p: Parts) {
  p.at(DOME.x, LEVEL.deck, DOME.z);
  const ringY = DOME.y - DOME.r * 0.72;
  const rr = DOME.r * 0.72;
  p.cyl("stone", DOME.r * 0.8, DOME.r * 0.75, 18, 0, 0, 0, 48);
  p.ring(0, 18.5, 0, DOME.r * 0.78, NEON.cyan, 48);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    p.strut(
      "metal",
      { x: Math.cos(a) * DOME.r * 0.74, y: 18, z: Math.sin(a) * DOME.r * 0.74 },
      { x: Math.cos(a) * rr, y: ringY, z: Math.sin(a) * rr },
      4,
      6,
    );
  }
  p.ring(0, ringY, 0, rr + 2, NEON.pink, 48);
  p.at(0, 0, 0);
}

/**
 * Lumen: a full sphere wider than any tower with a face on its LED skin.
 * Faces blink, follow the gaze they are given, react to the city and change every half minute through a glitch.
 * About once a minute the face shuts its eyes and the skin opens from the centre out onto a world picked at random, never the same twice running.
 */
export function createLumen(p: Parts, eye: Vector3, glow: Texture, time: { value: number }, rand: Rand): Lumen {
  supports(p);
  let size = 512;
  let face = canvas(size, size);
  let tex = texture(face);
  const scratch = { a: canvas(size, size), b: canvas(size, size) };
  const front = eye
    .clone()
    .sub(new Vector3(DOME.x, DOME.y, DOME.z))
    .normalize();
  const u = {
    uFace: { value: tex },
    uFront: { value: front },
    uInner: { value: new Color(0.1, 0.1, 0.2) },
    uOpen: { value: 0 },
    uTime: time,
    uGrid: { value: 70 },
  };
  const sphere = new Mesh(
    new SphereGeometry(DOME.r, 96, 64),
    new ShaderMaterial({ ...skin, uniforms: u, side: DoubleSide }),
  );
  const group = new Group();
  group.position.set(DOME.x, DOME.y, DOME.z);
  const inner = new PointLight(0xfff0e0, 0, DOME.r * 2.4, 1.2);
  inner.position.set(0, DOME.r * 0.45, DOME.r * 0.35);
  group.add(sphere, inner);
  const builders: ((r: Rand) => World)[] = [
    (r) => forest(r, glow, time),
    (r) => desert(r, glow),
    (r) => concert(r),
    (r) => reef(r, glow),
    (r) => tundra(r, glow),
    (r) => cove(r, glow, time),
    (r) => library(r, glow),
    (r) => volcano(r, glow),
    (r) => blossom(r, glow),
    (r) => space(r, glow),
  ];
  const worlds = new Map<number, World>();
  let world: World | null = null;
  let lastWorld = -1;
  let who = 0;
  let phase: Phase = { kind: "face", open: 45 + rand() * 20 };
  let nextFace = 25;
  let blinkIn = 3;
  let blink = 0;
  let mood: Mood = "calm";
  let moodFor = 0;
  let low = false;
  let frame = 0;
  const look = { x: 0, y: 0 };

  const state = (t: number, extra = 0): FaceState => ({ blink: Math.max(blink, extra), look, mood, t });
  const paint = (target: HTMLCanvasElement, i: number, t: number, extra = 0) => {
    const c = FACES[i % FACES.length];
    if (c) drawFace(ctx(target), c, state(t, extra), size);
  };
  const pickWorld = () => {
    let i = Math.floor(rand() * builders.length);
    if (i === lastWorld) i = (i + 1) % builders.length;
    lastWorld = i;
    let w = worlds.get(i);
    if (!w) {
      const make = builders[i];
      if (!make) return null;
      w = make(rand);
      w.group.rotation.x = TILT;
      worlds.set(i, w);
      group.add(w.group);
    }
    for (const o of worlds.values()) o.group.visible = o === w;
    u.uInner.value.copy(w.sky);
    return w;
  };

  return {
    group,
    react: (m) => {
      if (phase.kind !== "face") return;
      mood = m;
      moodFor = 2.5;
    },
    open: () => {
      if (phase.kind === "face") phase = { kind: "closing", t: 0 };
    },
    setLow: (l) => {
      if (l === low) return;
      low = l;
      size = low ? 256 : 512;
      face = canvas(size, size);
      scratch.a = canvas(size, size);
      scratch.b = canvas(size, size);
      tex.dispose();
      tex = texture(face);
      u.uFace.value = tex;
      u.uGrid.value = low ? 40 : 70;
    },
    update: (dt, t, gaze) => {
      const k = 1 - Math.exp(-dt * 4);
      look.x += ((gaze?.x ?? Math.sin(t * 0.3) * 0.5) - look.x) * k;
      look.y += ((gaze?.y ?? Math.cos(t * 0.23) * 0.3) - look.y) * k;
      blinkIn -= dt;
      if (blinkIn <= 0) {
        blink = 1;
        blinkIn = 3 + rand() * 3;
      }
      blink = Math.max(0, blink - dt * 7);
      moodFor -= dt;
      if (moodFor <= 0) mood = "calm";
      let shut = 0;
      if (phase.kind === "face") {
        nextFace -= dt;
        phase.open -= dt;
        if (phase.open <= 0) phase = { kind: "closing", t: 0 };
        else if (nextFace <= 0) {
          phase = { kind: "switch", t: 0, from: who };
          who = (who + 1 + Math.floor(rand() * (FACES.length - 1))) % FACES.length;
          nextFace = 22 + rand() * 12;
        }
      } else if (phase.kind === "switch") {
        phase.t += dt;
        if (phase.t > SWITCH_S) phase = { kind: "face", open: Math.max(8, 50 + rand() * 20 - phase.t) };
      } else if (phase.kind === "closing") {
        phase.t += dt;
        shut = clamp(phase.t / 0.6, 0, 1);
        if (phase.t > 0.6) {
          world = pickWorld();
          phase = { kind: "opening", t: 0 };
        }
      } else if (phase.kind === "opening") {
        phase.t += dt;
        shut = 1;
        u.uOpen.value = ease(clamp(phase.t / OPEN_S, 0, 1));
        if (phase.t > OPEN_S) phase = { kind: "inside", t: 0 };
      } else if (phase.kind === "inside") {
        phase.t += dt;
        shut = 1;
        if (phase.t > INSIDE_S) phase = { kind: "shutting", t: 0 };
      } else {
        phase.t += dt;
        shut = 1 - clamp((phase.t - SHUT_S) / 0.5, 0, 1);
        u.uOpen.value = 1 - ease(clamp(phase.t / SHUT_S, 0, 1));
        if (phase.t > SHUT_S + 0.5) {
          phase = { kind: "face", open: 50 + rand() * 20 };
          if (world) world.group.visible = false;
          world = null;
        }
      }
      if (world) world.update(dt, t);
      inner.intensity = u.uOpen.value * 2.5e4;
      frame++;
      if (low && frame % 3 !== 0) return;
      const g = ctx(face);
      if (phase.kind === "switch") {
        paint(scratch.a, phase.from, t);
        paint(scratch.b, who, t);
        const mix = phase.t / SWITCH_S;
        g.drawImage(mix < 0.5 ? scratch.a : scratch.b, 0, 0);
        for (let i = 0; i < 12; i++) {
          const y = rand() * size;
          const h = 4 + rand() * size * 0.12;
          g.drawImage(rand() < mix ? scratch.b : scratch.a, 0, y, size, h, (rand() - 0.5) * size * 0.3, y, size, h);
        }
        for (let i = 0; i < 30; i++) {
          g.fillStyle = `hsl(${rand() * 360},100%,60%)`;
          g.fillRect(rand() * size, rand() * size, size * 0.04, size * 0.04);
        }
      } else paint(face, who, t, shut);
      tex.needsUpdate = true;
    },
  };
}
