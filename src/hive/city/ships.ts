import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  type Texture,
} from "three";
import { clamp, ease, lerp, type Rand } from "../math";
import { plot, type Vec3 } from "./plan";

/**
 * A galleon one unit long: an extruded hull with a raised bow and stern, three masts and square sails edged in neon, lanterns at the stern.
 * Scaled up it is the Night Kite in the sky and the ship moored in Rust Cove; small it sails the pirate cove inside Lumen.
 */
export function galleon(sail: number): Group {
  const g = new Group();
  const hull = new Shape();
  hull.moveTo(-0.5, 0.12);
  hull.lineTo(-0.42, -0.06);
  hull.quadraticCurveTo(0, -0.14, 0.42, -0.06);
  hull.lineTo(0.56, 0.16);
  hull.lineTo(0.3, 0.06);
  hull.lineTo(-0.32, 0.06);
  hull.lineTo(-0.44, 0.18);
  hull.closePath();
  const geo = new ExtrudeGeometry(hull, { depth: 0.16, bevelEnabled: false });
  geo.translate(0, 0, -0.08);
  g.add(new Mesh(geo, new MeshLambertMaterial({ color: 0x3a2214 })));
  const cabin = new Mesh(new BoxGeometry(0.14, 0.08, 0.14), new MeshLambertMaterial({ color: 0x2a160c }));
  cabin.position.set(-0.36, 0.14, 0);
  g.add(cabin);
  const sailMat = new MeshBasicMaterial({
    color: sail,
    transparent: true,
    opacity: 0.35,
    side: DoubleSide,
    depthWrite: false,
  });
  const edge = new LineBasicMaterial({ color: new Color(sail).multiplyScalar(2) });
  for (const [x, h] of [
    [-0.18, 0.5],
    [0.06, 0.62],
    [0.3, 0.42],
  ] as const) {
    const mast = new Mesh(new CylinderGeometry(0.008, 0.01, h, 5), new MeshLambertMaterial({ color: 0x1a0e08 }));
    mast.position.set(x, 0.06 + h / 2, 0);
    g.add(mast);
    for (const [y, w] of [
      [h * 0.45, h * 0.42],
      [h * 0.8, h * 0.3],
    ] as const) {
      const s = new Mesh(new PlaneGeometry(w * 0.7, w * 0.45), sailMat);
      s.rotation.y = Math.PI / 2;
      s.position.set(x + 0.01, 0.06 + y, 0);
      const e = new LineSegments(new EdgesGeometry(s.geometry), edge);
      e.rotation.copy(s.rotation);
      e.position.copy(s.position);
      g.add(s, e);
    }
  }
  const lamp = new Mesh(new BoxGeometry(0.03, 0.04, 0.03), new MeshBasicMaterial({ color: 0xffb040 }));
  lamp.position.set(-0.48, 0.24, 0);
  const flag = new Mesh(new PlaneGeometry(0.08, 0.05), new MeshBasicMaterial({ color: 0x101010, side: DoubleSide }));
  flag.position.set(0.1, 0.72, 0.0);
  flag.rotation.y = Math.PI / 2;
  g.add(lamp, flag);
  return g;
}

/** The cloak shimmer: a rim of light that brightens where the hull turns away from the eye, strongest mid-cloak. */
function cloakMaterial(uK: { value: number }, uTime: { value: number }): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uK, uTime },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: `
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vP;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - w.xyz);
        vP = position;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform float uK;
      uniform float uTime;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vP;
      void main() {
        float f = pow(1.0 - abs(dot(vN, vV)), 2.0);
        float bands = 0.5 + 0.5 * sin(vP.y * 0.8 + vP.x * 0.3 - uTime * 8.0);
        gl_FragColor = vec4(vec3(0.5, 0.9, 1.2) * f * bands * uK * 2.0, 1.0);
      }`,
  });
}

/** The Wanderer: a flat saucer with a glass canopy, a ring of running lights and a glow beneath. */
function wanderer(glow: Texture) {
  const g = new Group();
  const profile = [
    [0, -6],
    [26, -2],
    [40, 0],
    [30, 4],
    [12, 7],
    [0, 8],
  ].map(([x, y]) => new Vector2(x, y));
  const body = new MeshLambertMaterial({ color: 0x8a90b8, transparent: true, emissive: 0x101530 });
  const hull = new Mesh(new LatheGeometry(profile, 32), body);
  const canopy = new Mesh(
    new SphereGeometry(12, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new MeshBasicMaterial({ color: 0x60d0ff, transparent: true, opacity: 0.6 }),
  );
  canopy.position.y = 6;
  const lights = new MeshBasicMaterial({ color: 0xff60c0, transparent: true });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const l = new Mesh(new BoxGeometry(2, 1.4, 2), lights);
    l.position.set(Math.cos(a) * 38, 0.5, Math.sin(a) * 38);
    g.add(l);
  }
  const under = new Sprite(
    new SpriteMaterial({
      map: glow,
      color: 0x60d0ff,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  under.scale.set(90, 40, 1);
  under.position.y = -10;
  const uK = { value: 0 };
  const uTime = { value: 0 };
  const shell = new Mesh(
    new LatheGeometry(
      profile.map((v) => v.clone().multiplyScalar(1.06)),
      32,
    ),
    cloakMaterial(uK, uTime),
  );
  g.add(hull, canopy, under, shell);
  const fade = (k: number) => {
    body.opacity = 1 - k;
    (canopy.material as MeshBasicMaterial).opacity = 0.6 * (1 - k);
    lights.opacity = 1 - k;
    under.material.opacity = 1 - k;
  };
  return { g, uK, uTime, fade };
}

type Mode = { kind: "roam" } | { kind: "dock"; t: number; from: Vec3 } | { kind: "chase"; t: number };

export interface Ships {
  group: Group;
  update: (dt: number, t: number) => void;
  /** The Wanderer flies to Starberth, lands, waits and lifts off. */
  dock: () => void;
  /** The Night Kite crosses the upper city and the Wanderer chases it off. */
  raid: () => void;
  wandererAt: () => Vec3;
}

const DOCK_S = 14;
const RAID_S = 16;

/**
 * The Wanderer roams over the upper city and now and then cloaks, slips somewhere else while unseen and decloaks there.
 * The Night Kite only appears for a raid, sailing in from off screen with the Wanderer on its tail.
 */
export function createShips(glow: Texture, rand: Rand): Ships {
  const group = new Group();
  const w = wanderer(glow);
  const kite = galleon(0xff40a0);
  kite.scale.setScalar(160);
  kite.visible = false;
  group.add(w.g, kite);
  const berth = plot("starberth").at;
  const pad: Vec3 = { x: berth.x, y: 540 + 24, z: berth.z };
  let mode: Mode = { kind: "roam" };
  let home = { x: 0, z: 0 };
  let cloak = -1;
  let nextCloak = 12;
  let raid = -1;
  let side = 1;
  const aim = new Vector3();
  const roamAt = (t: number): Vec3 => ({
    x: home.x + Math.sin(t * 0.11) * 500,
    y: 640 + Math.sin(t * 0.37) * 40,
    z: home.z - 400 + Math.cos(t * 0.07) * 300,
  });
  const kiteAt = (k: number): Vec3 => ({ x: side * lerp(-2200, 2200, k), y: 520 + Math.sin(k * 9) * 20, z: -300 });
  return {
    group,
    wandererAt: () => ({ x: w.g.position.x, y: w.g.position.y, z: w.g.position.z }),
    dock: () => {
      if (mode.kind === "roam")
        mode = { kind: "dock", t: 0, from: { x: w.g.position.x, y: w.g.position.y, z: w.g.position.z } };
    },
    raid: () => {
      if (raid >= 0) return;
      raid = 0;
      side = rand() < 0.5 ? 1 : -1;
      kite.visible = true;
      mode = { kind: "chase", t: 0 };
    },
    update: (dt, t) => {
      w.uTime.value = t;
      if (raid >= 0) {
        raid += dt / RAID_S;
        const p = kiteAt(raid);
        kite.position.set(p.x, p.y, p.z);
        kite.rotation.set(Math.sin(t * 1.3) * 0.06, side > 0 ? 0 : Math.PI, Math.sin(t * 0.9) * 0.05);
        if (raid >= 1) {
          raid = -1;
          kite.visible = false;
          mode = { kind: "roam" };
        }
      }
      let k = 0;
      if (mode.kind === "dock") {
        mode.t += dt / DOCK_S;
        const u = mode.t;
        const land = ease(clamp(u / 0.35, 0, 1));
        const lift = ease(clamp((u - 0.7) / 0.3, 0, 1));
        const p =
          u < 0.35
            ? {
                x: lerp(mode.from.x, pad.x, land),
                y: lerp(mode.from.y, pad.y, land),
                z: lerp(mode.from.z, pad.z, land),
              }
            : { x: pad.x, y: pad.y + lift * 160, z: pad.z };
        w.g.position.set(p.x, p.y, p.z);
        if (u >= 1) {
          home = { x: w.g.position.x, z: w.g.position.z + 400 };
          mode = { kind: "roam" };
        }
      } else if (mode.kind === "chase") {
        mode.t += dt;
        const p = kiteAt(Math.max(0, raid - 0.12));
        w.g.position.set(p.x, p.y + 60, p.z + 40);
      } else {
        const p = roamAt(t);
        w.g.position.lerp(aim.set(p.x, p.y, p.z), 1 - Math.exp(-dt * 0.8));
        nextCloak -= dt;
        if (cloak < 0 && nextCloak <= 0) cloak = 0;
      }
      if (cloak >= 0) {
        cloak += dt;
        k = cloak < 1 ? cloak : cloak < 4 ? 1 : Math.max(0, 5 - cloak);
        if (cloak > 2 && cloak - dt <= 2) home = { x: (rand() - 0.5) * 1600, z: (rand() - 0.5) * 600 };
        if (cloak > 5) {
          cloak = -1;
          nextCloak = 15 + rand() * 15;
        }
      }
      w.fade(k);
      w.uK.value = Math.sin(Math.PI * clamp(k, 0, 1));
      w.g.rotation.y = t * 0.3;
    },
  };
}
