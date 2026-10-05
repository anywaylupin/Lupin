import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  PointsMaterial,
  DoubleSide,
  type Texture,
} from "three";
import { clamp, type Rand } from "../math";
import type { Vec3 } from "./plan";
import { dragon, fireworks } from "./festival";
import { AMBER } from "./palette";
import { createBees, stepBees, type Swarm } from "./swarm";

const dummy = new Object3D();
/** Bees are drawn about twice the size of a street car, so a swarm still reads as bees through a single hex. */
const BEE_SIZE = 4;

/**
 * Three swarms of cyber bees roaming the screen: amber bodies with a dark band, wings beating fast and glowing faintly.
 */
function bees(roam: () => Vec3, rand: Rand) {
  const swarms: Swarm[] = [0, 1, 2].map(() => ({ target: roam(), next: 3 + rand() * 4 }));
  const list = createBees(
    swarms.map((s) => s.target),
    rand,
  );
  const body = new InstancedMesh(
    new CylinderGeometry(1.1, 1.1, 3.4, 6).rotateZ(Math.PI / 2),
    new MeshBasicMaterial({ color: AMBER }),
    list.length,
  );
  const band = new InstancedMesh(
    new CylinderGeometry(1.2, 1.2, 0.9, 6).rotateZ(Math.PI / 2),
    new MeshBasicMaterial({ color: 0x1b1644 }),
    list.length,
  );
  const wings = new InstancedMesh(
    new PlaneGeometry(2.6, 1.4).translate(0, 0.7, 0),
    new MeshBasicMaterial({ color: 0xbee6ff, transparent: true, opacity: 0.55, side: DoubleSide, depthWrite: false }),
    list.length * 2,
  );
  const meshes = [body, band, wings];
  for (const m of meshes) m.frustumCulled = false;
  const pose = (t: number) => {
    list.forEach((b, i) => {
      const yaw = Math.atan2(-b.vz, b.vx);
      const y = b.y + Math.sin(t * 3 + b.phase) * 0.8;
      dummy.position.set(b.x, y, b.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(BEE_SIZE);
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      band.setMatrixAt(i, dummy.matrix);
      const flap = Math.sin(t * 38 + b.phase);
      for (const side of [0, 1]) {
        dummy.rotation.set(side ? 0.4 + flap * 0.6 : -0.4 - flap * 0.6, yaw, 0, "YXZ");
        dummy.position.set(b.x, y + 0.8 * BEE_SIZE, b.z);
        dummy.updateMatrix();
        wings.setMatrixAt(i * 2 + side, dummy.matrix);
      }
    });
    for (const m of meshes) m.instanceMatrix.needsUpdate = true;
  };
  pose(0);
  return {
    meshes,
    update: (dt: number, t: number) => {
      stepBees(list, swarms, dt, roam, rand);
      pose(t);
    },
  };
}

interface Lantern extends Vec3 {
  t: number;
  life: number;
  drift: number;
}

/** Sky lanterns released in a batch from a rooftop, climbing and swaying for about nine seconds before they burn out, each in its own warm halo. */
function lanterns(glow: Texture) {
  const max = 48;
  const mesh = new InstancedMesh(new BoxGeometry(10, 13, 10), new MeshBasicMaterial({ color: AMBER }), max);
  mesh.frustumCulled = false;
  const haloGeo = new BufferGeometry();
  haloGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(max * 3), 3));
  const halo = new Points(
    haloGeo,
    new PointsMaterial({
      size: 70,
      map: glow,
      color: AMBER,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  halo.frustumCulled = false;
  const live: Lantern[] = [];
  return {
    meshes: [mesh, halo],
    release: (at: Vec3, rand: Rand) => {
      for (let i = 0; i < 14 && live.length < max; i++) {
        live.push({
          x: at.x + (rand() - 0.5) * 180,
          y: at.y - 60 + rand() * 60,
          z: at.z + (rand() - 0.5) * 180,
          t: -rand() * 2,
          life: 8 + rand() * 3,
          drift: rand() * 6,
        });
      }
    },
    update: (dt: number) => {
      for (let i = live.length - 1; i >= 0; i--) {
        const l = live[i];
        if (l && (l.t += dt) > l.life) live.splice(i, 1);
      }
      const hp = haloGeo.getAttribute("position");
      for (let i = 0; i < max; i++) {
        const l = live[i];
        if (!l || l.t < 0) {
          dummy.scale.setScalar(0);
          dummy.position.set(0, -1e4, 0);
        } else {
          const fade = clamp((l.life - l.t) / 1.5, 0, 1) * clamp(l.t / 0.5, 0, 1);
          dummy.position.set(
            l.x + Math.sin(l.t * 0.7 + l.drift) * 14,
            l.y + l.t * 26,
            l.z + Math.cos(l.t * 0.5 + l.drift) * 4,
          );
          dummy.scale.setScalar(fade);
        }
        dummy.rotation.set(0, l ? l.t * 0.3 : 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        hp.setXYZ(i, dummy.position.x, dummy.position.y, dummy.position.z);
      }
      mesh.instanceMatrix.needsUpdate = true;
      hp.needsUpdate = true;
    },
  };
}

export interface Life {
  group: Group;
  update: (dt: number, t: number) => void;
  lanterns: (at: Vec3) => void;
  fireworks: (at: Vec3) => void;
  /** The neon dragon swims from `a` to `b`; false while it is still on an earlier flight. */
  dragon: (a: Vec3, b: Vec3) => boolean;
}

/**
 * The shows that can happen anywhere: bees always roaming, and lantern releases, fireworks and the dragon whenever the city stages them.
 * `roam` picks where a bee swarm heads next.
 */
export function createLife(glow: Texture, roam: () => Vec3, rand: Rand): Life {
  const b = bees(roam, rand);
  const l = lanterns(glow);
  const f = fireworks(glow);
  const d = dragon();
  const group = new Group();
  group.add(...b.meshes, ...l.meshes, ...f.meshes, ...d.meshes);
  return {
    group,
    lanterns: (at) => l.release(at, rand),
    fireworks: (at) => f.launch(at, rand),
    dragon: (a, z) => {
      if (d.busy()) return false;
      d.fly(a, z, rand);
      return true;
    },
    update: (dt, t) => {
      b.update(dt, t);
      l.update(dt);
      f.update(dt);
      d.update(dt);
    },
  };
}
