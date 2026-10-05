import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  PlaneGeometry,
  Vector3,
  type Object3D,
  type Texture,
} from "three";
import { WIN } from "./textures";
import type { Vec3 } from "./plan";

/**
 * Material slots; every static piece of every building goes into one of these, and each slot becomes one merged mesh.
 * `body` carries the facade texture, `lit` and `plant` and `roof` carry a colour per piece, `glass` is see-through.
 */
export type Slot = "body" | "metal" | "stone" | "wood" | "roof" | "plant" | "lit" | "lamp" | "glass";

export const SLOTS: readonly Slot[] = ["body", "metal", "stone", "wood", "roof", "plant", "lit", "lamp", "glass"];

/** Slots whose pieces each carry a colour attribute. */
export const TINTED: ReadonlySet<Slot> = new Set(["roof", "plant", "lit"]);

export type RGB = readonly [number, number, number];

const ORIGIN = new Vector3();
const UP = new Vector3(0, 1, 0);

/** Neon in linear RGB, brighter than the theme so bloom picks it up. */
export const NEON = {
  pink: [1.4, 0.3, 0.85],
  cyan: [0.35, 1.2, 1.5],
  amber: [1.5, 0.85, 0.3],
  red: [1.6, 0.25, 0.25],
  white: [1.3, 1.3, 1.4],
  green: [0.4, 1.4, 0.6],
} as const satisfies Record<string, RGB>;

export const HUES: readonly RGB[] = [NEON.pink, NEON.cyan, NEON.amber];

/** Roof tiles: dark vermilion, jade and indigo, so temple roofs read as glazed. */
export const TILES: readonly RGB[] = [
  [0.36, 0.08, 0.12],
  [0.08, 0.26, 0.24],
  [0.12, 0.14, 0.32],
];

/**
 * Collects static geometry by slot, plus neon lines; `at` moves and turns everything added after it, so a landmark can be built around its own origin.
 */
export class Parts {
  geo = new Map<Slot, BufferGeometry[]>(SLOTS.map((s) => [s, []]));
  lines: number[] = [];
  colours: number[] = [];
  /** Billboard panels by the texture they show, merged per texture. */
  screens = new Map<Texture, BufferGeometry[]>();
  private m = new Matrix4();

  at(x: number, y: number, z: number, yaw = 0): this {
    this.m.makeRotationY(yaw).setPosition(x, y, z);
    return this;
  }

  add(slot: Slot, geo: BufferGeometry, tint?: RGB): BufferGeometry {
    geo.applyMatrix4(this.m);
    if (tint) {
      const n = geo.getAttribute("position").count;
      geo.setAttribute("color", new Float32BufferAttribute(Array.from({ length: n }, () => tint).flat(), 3));
    }
    this.geo.get(slot)?.push(geo);
    return geo;
  }

  /** A box centred at (x, y, z); body boxes get facade UVs at world scale so every window is the same size. */
  box(slot: Slot, w: number, h: number, d: number, x: number, y: number, z: number, tint?: RGB, seed = 0) {
    const geo = new BoxGeometry(w, h, d);
    if (slot === "body") facadeUv(geo, w, h, d, seed);
    geo.translate(x, y, z);
    return this.add(slot, geo, tint);
  }

  /** A box standing on y, which is how most of the city is built. */
  block(slot: Slot, w: number, h: number, d: number, x: number, y: number, z: number, tint?: RGB, seed = 0) {
    return this.box(slot, w, h, d, x, y + h / 2, z, tint, seed);
  }

  cyl(slot: Slot, r0: number, r1: number, h: number, x: number, y: number, z: number, sides = 10, tint?: RGB) {
    const geo = new CylinderGeometry(r1, r0, h, sides, 1, slot === "body");
    if (slot === "body") {
      const uv = geo.getAttribute("uv");
      const c = Math.PI * (r0 + r1);
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, (uv.getX(i) * c) / (WIN.cols * WIN.w), (uv.getY(i) * h) / (WIN.rows * WIN.h));
    }
    geo.translate(x, y + h / 2, z);
    return this.add(slot, geo, tint);
  }

  /** A strut between two points, for trusses, cables and pipes. */
  strut(slot: Slot, a: Vec3, b: Vec3, r: number, sides = 4, tint?: RGB) {
    const len = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    const geo = new CylinderGeometry(r, r, len, sides, 1, true);
    const dir = new Matrix4().lookAt(new Vector3(b.x - a.x, b.y - a.y, b.z - a.z), ORIGIN, UP);
    geo.rotateX(Math.PI / 2);
    geo.applyMatrix4(dir);
    geo.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    return this.add(slot, geo, tint);
  }

  /** A billboard facing +z (turned by `yaw`), centred at (x, y, z). */
  screen(tex: Texture, w: number, h: number, x: number, y: number, z: number, yaw = 0) {
    const geo = new PlaneGeometry(w, h);
    geo.rotateY(yaw);
    geo.translate(x, y, z);
    geo.applyMatrix4(this.m);
    const list = this.screens.get(tex) ?? [];
    list.push(geo);
    this.screens.set(tex, list);
  }

  line(a: readonly number[], b: readonly number[], c: RGB, k = 1) {
    const pa = this.point(a);
    const pb = this.point(b);
    this.lines.push(...pa, ...pb);
    for (let i = 0; i < 2; i++) this.colours.push(c[0] * k, c[1] * k, c[2] * k);
  }

  loop(pts: readonly (readonly number[])[], c: RGB, k = 1) {
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length];
      if (b) this.line(a, b, c, k);
    });
  }

  ring(x: number, y: number, z: number, r: number, c: RGB, n = 20) {
    this.loop(
      Array.from({ length: n }, (_, i) => [
        x + Math.cos((i / n) * Math.PI * 2) * r,
        y,
        z + Math.sin((i / n) * Math.PI * 2) * r,
      ]),
      c,
    );
  }

  /** Neon edges up the four corners of a box and round its top. */
  edges(w: number, h: number, d: number, x: number, y: number, z: number, c: RGB) {
    const xs = [x - w / 2, x + w / 2];
    const zs = [z - d / 2, z + d / 2];
    for (const px of xs) for (const pz of zs) this.line([px, y, pz], [px, y + h, pz], c, 0.8);
    this.loop(
      [
        [xs[0] ?? x, y + h, zs[0] ?? z],
        [xs[1] ?? x, y + h, zs[0] ?? z],
        [xs[1] ?? x, y + h, zs[1] ?? z],
        [xs[0] ?? x, y + h, zs[1] ?? z],
      ],
      c,
    );
  }

  private point(p: readonly number[]): number[] {
    const e = this.m.elements;
    const [x = 0, y = 0, z = 0] = p;
    return [
      (e[0] ?? 1) * x + (e[4] ?? 0) * y + (e[8] ?? 0) * z + (e[12] ?? 0),
      (e[1] ?? 0) * x + (e[5] ?? 1) * y + (e[9] ?? 0) * z + (e[13] ?? 0),
      (e[2] ?? 0) * x + (e[6] ?? 0) * y + (e[10] ?? 1) * z + (e[14] ?? 0),
    ];
  }
}

/**
 * Rewrites a box's UVs to world scale, starting on a whole window so floors line up.
 * Box faces come in the order +x, -x, +y, -y, +z, -z, four vertices each; tops and bottoms are pinned to the dark cell.
 */
function facadeUv(geo: BufferGeometry, w: number, h: number, d: number, seed: number): void {
  const uv = geo.getAttribute("uv");
  const ou = (seed % WIN.cols) / WIN.cols;
  const ov = (Math.floor(seed / WIN.cols) % WIN.rows) / WIN.rows;
  const tileU = WIN.cols * WIN.w;
  const tileV = WIN.rows * WIN.h;
  const dark = 0.5 / WIN.cols;
  for (let face = 0; face < 6; face++) {
    const span = face < 2 ? d : w;
    for (let k = 0; k < 4; k++) {
      const i = face * 4 + k;
      if (face === 2 || face === 3) uv.setXY(i, dark, dark);
      else uv.setXY(i, ou + (uv.getX(i) * span) / tileU, ov + (uv.getY(i) * h) / tileV);
    }
  }
}

/**
 * The eave line of a hip roof: eight points round the base, corners lifted by `flare` and edge midpoints left low.
 * The straight runs from a low midpoint to a high corner read as the upswept eaves of a temple roof.
 */
function eave(sx: number, sz: number, flare: number): [number, number, number][] {
  return Array.from({ length: 8 }, (_, k) => {
    const a = (k * Math.PI) / 4;
    const corner = k % 2 === 1;
    const r = corner ? Math.SQRT2 : 1;
    return [Math.cos(a) * r * sx, corner ? flare : 0, Math.sin(a) * r * sz];
  });
}

/**
 * A flared hip roof: the eave ring, a smaller ring pulled low to make the slope concave, and the peak, with a neon line along the eave.
 * Built as loose triangles so it merges with the boxes; the roof material is double sided, so no underside is needed.
 */
export function roof(
  p: Parts,
  x: number,
  y: number,
  z: number,
  sx: number,
  sz: number,
  rise: number,
  flare: number,
  tile: RGB,
  trim: RGB,
) {
  const outer = eave(sx, sz, flare);
  const inner = eave(sx * 0.5, sz * 0.5, flare * 0.4).map(([a, b, c]) => [a, b + rise * 0.3, c] as const);
  const peak = [0, rise, 0] as const;
  const pos: number[] = [];
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    const [o0, o1, i0, i1] = [outer[i], outer[j], inner[i], inner[j]];
    if (!o0 || !o1 || !i0 || !i1) continue;
    pos.push(...peak, ...i1, ...i0, ...i0, ...i1, ...o0, ...o0, ...i1, ...o1);
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  geo.translate(x, y, z);
  p.add("roof", geo, tile);
  p.loop(
    outer.map(([a, b, c]) => [x + a, y + b, z + c]),
    trim,
  );
}

/** A tiered pagoda of `tiers` storeys with lanterns under alternate eaves and a ringed spire. */
export function pagoda(
  p: Parts,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  tiers: number,
  tile: RGB,
  trim: RGB,
) {
  const unit = h / (tiers + 0.8);
  for (let i = 0; i < tiers; i++) {
    const tw = w * (1 - i * 0.09);
    const bh = unit * 0.62;
    const y0 = y + i * unit;
    p.block("wood", tw, bh, tw, x, y0, z);
    const s = tw * 0.71;
    roof(p, x, y0 + bh, z, s, s, unit * 0.55, unit * 0.22, tile, trim);
    if (i % 2 === 0)
      for (const [a, b] of [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ] as const)
        p.box("lamp", unit * 0.1, unit * 0.14, unit * 0.1, x + a * s * 0.95, y0 + bh + unit * 0.08, z + b * s * 0.95);
  }
  const top = y + tiers * unit - unit * 0.3;
  p.cyl("metal", 1.5, 1, unit * 1.3, x, top, z, 6);
  for (let i = 1; i <= 3; i++) p.ring(x, top + (unit * 1.3 * i) / 4, z, 6 - i, trim, 8);
}

/** A group whose children are animated by a landmark; kept as a type so landmarks read the same. */
export function holder(...kids: Object3D[]): Group {
  const g = new Group();
  if (kids.length) g.add(...kids);
  return g;
}
