import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
} from "three";
import { Emitter } from "./emitter";
import type { Kit, Landmark } from "./landmark";
import { plot } from "./plan";

const dummy = new Object3D();

/**
 * Owlspire Academy: a crooked stone tower on a floating rock, its turrets capped with slate cones and its windows lit gold, ringed by orbiting books.
 * The whole island bobs slowly; its event casts a spell that lights every window and throws sparks up into the sky.
 */
export function owlspire(k: Kit): Landmark {
  const { x, y, z } = plot("owlspire").at;
  const { glow, rand } = k;
  const stone = new MeshLambertMaterial({ color: 0x6a6478, emissive: 0x0c0a18 });
  const slate = new MeshLambertMaterial({ color: 0x2a2858, emissive: 0x080820 });
  const windows = new MeshBasicMaterial({ color: 0xffb040 });
  const island = new Group();
  const rock = new Mesh(
    new DodecahedronGeometry(1, 1),
    new MeshLambertMaterial({ color: 0x3a3040, flatShading: true }),
  );
  rock.scale.set(150, 120, 130);
  rock.position.y = -70;
  rock.rotation.set(0.3, 0.5, 0.1);
  const cap = new Mesh(new CylinderGeometry(145, 120, 30, 12), new MeshLambertMaterial({ color: 0x2a4a30 }));
  cap.position.y = 0;
  island.add(rock, cap);
  let ty = 15;
  let lean = 0;
  for (let i = 0; i < 5; i++) {
    const r = 34 - i * 4;
    const h = 60 + (i % 2) * 20;
    const seg = new Mesh(new CylinderGeometry(r * 0.92, r, h, 10), stone);
    lean += (rand() - 0.5) * 6;
    seg.position.set(lean, ty + h / 2, 0);
    seg.rotation.z = (rand() - 0.5) * 0.06;
    island.add(seg);
    for (let w = 0; w < 4; w++) {
      const win = new Mesh(new BoxGeometry(5, 10, 2), windows);
      const a = (w / 4) * Math.PI * 2 + i;
      win.position.set(lean + Math.cos(a) * (r - 1), ty + h / 2, Math.sin(a) * (r - 1));
      win.rotation.y = -a + Math.PI / 2;
      island.add(win);
    }
    ty += h;
  }
  const spire = new Mesh(new ConeGeometry(26, 90, 10), slate);
  spire.position.set(lean, ty + 45, 0);
  island.add(spire);
  for (const [tx, tz, h] of [
    [70, 30, 120],
    [-80, 10, 90],
    [20, -70, 100],
  ] as const) {
    const t = new Mesh(new CylinderGeometry(16, 18, h, 8), stone);
    t.position.set(tx, 15 + h / 2, tz);
    const c = new Mesh(new ConeGeometry(20, 50, 8), slate);
    c.position.set(tx, 15 + h + 25, tz);
    const win = new Mesh(new BoxGeometry(4, 8, 2), windows);
    win.position.set(tx, 15 + h * 0.7, tz + 16);
    island.add(t, c, win);
  }
  const n = 18;
  const books = new InstancedMesh(
    new BoxGeometry(12, 3, 9),
    new MeshLambertMaterial({ color: 0xffffff, emissive: 0x201010 }),
    n,
  );
  const hues = [0x8a2020, 0x204a8a, 0x2a6a30, 0x8a6a20, 0x5a2a7a];
  for (let i = 0; i < n; i++) books.setColorAt(i, new Color(hues[i % hues.length] ?? 0x8a2020));
  books.frustumCulled = false;
  island.add(books);
  const sparks = new Emitter(220, glow, {
    size: 10,
    colour: new Color(1.2, 1, 1.6),
    gravity: -20,
    drag: 0.6,
    life: 2.5,
  });
  const group = new Group();
  group.position.set(x, y, z);
  group.add(island, sparks.points);
  let spell = -1;
  return {
    id: "owlspire",
    name: "Owlspire Academy",
    anchor: { x, y: y + 200, z },
    group,
    update: (dt, t) => {
      island.position.y = Math.sin(t * 0.4) * 12;
      island.rotation.y = Math.sin(t * 0.1) * 0.15;
      for (let i = 0; i < n; i++) {
        const a = t * 0.35 + (i / n) * Math.PI * 2;
        const r = 170 + (i % 3) * 20;
        dummy.position.set(Math.cos(a) * r, 120 + Math.sin(a * 2 + i) * 30, Math.sin(a) * r);
        dummy.rotation.set(Math.sin(t * 3 + i) * 0.4, -a, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        books.setMatrixAt(i, dummy.matrix);
      }
      books.instanceMatrix.needsUpdate = true;
      let bright = 0.8 + 0.2 * Math.sin(t * 2);
      if (spell >= 0) {
        spell += dt;
        bright = 1.8 + Math.sin(spell * 20) * 0.4;
        if (spell < 1.5)
          sparks.emit(
            { x: (rand() - 0.5) * 30, y: 15 + ty + 80 + island.position.y, z: 0 },
            6,
            (r) => [(r() - 0.5) * 120, 60 + r() * 120, (r() - 0.5) * 120],
            rand,
          );
        if (spell > 3) spell = -1;
      }
      windows.color.setRGB(bright, bright * 0.65, bright * 0.25);
      sparks.update(dt);
    },
    trigger: () => {
      spell = 0;
    },
  };
}
