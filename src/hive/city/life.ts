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
const BEE_SIZE = 1.8;

/** Where a set piece should happen: a world point that projects into the screen cell that has waited longest, at a depth in the given range. */
export type Spot = (near: number, far: number) => Vec3;

/**
 * Three swarms of cyber bees roaming the screen: amber bodies with a dark band, wings beating fast and glowing faintly.
 */
function bees(spot: Spot, rand: Rand) {
  const swarms: Swarm[] = [0, 1, 2].map(() => ({ target: spot(120, 330), next: 3 + rand() * 4 }));
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
      stepBees(list, swarms, dt, () => spot(120, 330), rand);
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
  const mesh = new InstancedMesh(new BoxGeometry(5, 6.5, 5), new MeshBasicMaterial({ color: AMBER }), max);
  mesh.frustumCulled = false;
  const haloGeo = new BufferGeometry();
  haloGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(max * 3), 3));
  const halo = new Points(
    haloGeo,
    new PointsMaterial({
      size: 34,
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
          x: at.x + (rand() - 0.5) * 90,
          y: at.y - 50 + rand() * 30,
          z: at.z + (rand() - 0.5) * 90,
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
            l.x + Math.sin(l.t * 0.7 + l.drift) * 6,
            l.y + l.t * 11,
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
}

/**
 * Builds the living city: bees always roaming, and every one and a half to three seconds a set piece in the screen cell that has waited longest.
 * Fireworks, lantern releases and the dragon take turns, so a single torn hex anywhere on the screen sees one within a minute or so.
 * `at` gives the world point behind a screen point, in normalised device coordinates, at a depth; the dragon flies between two of them off either edge.
 */
export function createLife(
  glow: Texture,
  spot: Spot,
  at: (x: number, y: number, dist: number) => Vec3,
  rand: Rand,
): Life {
  const b = bees(spot, rand);
  const l = lanterns(glow);
  const f = fireworks(glow);
  const d = dragon();
  const group = new Group();
  group.add(...b.meshes, ...l.meshes, ...f.meshes, ...d.meshes);
  let next = 1.5;
  let turn = 0;
  return {
    group,
    update: (dt, t) => {
      next -= dt;
      if (next <= 0) {
        next = 1.5 + rand() * 1.5;
        const kind = turn++ % 5;
        if (kind === 4 && !d.busy()) {
          const side = rand() < 0.5 ? -1 : 1;
          const dist = 260 + rand() * 400;
          const y = (rand() - 0.5) * 1.3;
          d.fly(at(-1.3 * side, y, dist), at(1.3 * side, y + (rand() - 0.5) * 0.6, dist), rand);
        } else if (kind % 2 === 0) f.launch(spot(350, 900), rand);
        else l.release(spot(200, 600), rand);
      }
      b.update(dt, t);
      l.update(dt);
      f.update(dt);
      d.update(dt);
    },
  };
}
