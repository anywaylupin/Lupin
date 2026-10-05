import { BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, PlaneGeometry } from "three";
import { rng, type Rand } from "../math";
import { AVENUE, tiersOf, type Building } from "./plan";
import { WIN } from "./textures";

/** Material slots; every building adds its pieces to these, and each slot becomes one merged mesh. */
export type Slot = "body" | "wood" | "roof" | "gate" | "lamp";

export interface Parts {
  geo: Record<Slot, BufferGeometry[]>;
  /** Neon edges as line segment pairs, with an RGB triple per vertex. */
  lines: number[];
  colours: number[];
  /** Sign panels, by index into SIGNS. */
  signs: { sign: number; geo: BufferGeometry }[];
}

export function createParts(): Parts {
  return { geo: { body: [], wood: [], roof: [], gate: [], lamp: [] }, lines: [], colours: [], signs: [] };
}

/** Neon trim in linear RGB, brighter than the theme so the lines read as light against the night. */
export const NEON: readonly (readonly [number, number, number])[] = [
  [1, 0.2, 0.62],
  [0.25, 0.85, 1],
  [1, 0.62, 0.2],
];

const DARK_UV = 0.5 / WIN.cols;

/** Roof tiles by trim hue: dark vermilion, jade and indigo, so the old town reads as glazed temple roofs rather than one slate. */
export const TILES: readonly (readonly [number, number, number])[] = [
  [0.34, 0.08, 0.13],
  [0.09, 0.25, 0.24],
  [0.12, 0.14, 0.3],
];

/**
 * Rewrites a box's UVs to world scale so every facade shows windows of the same size, starting on a whole window so floors line up.
 * Box faces come in the order +x, -x, +y, -y, +z, -z, four vertices each; tops and bottoms are pinned to the dark cell.
 */
function facadeUv(geo: BufferGeometry, w: number, h: number, d: number, rand: Rand): void {
  const uv = geo.getAttribute("uv");
  const ou = Math.floor(rand() * WIN.cols) / WIN.cols;
  const ov = Math.floor(rand() * WIN.rows) / WIN.rows;
  const tileU = WIN.cols * WIN.w;
  const tileV = WIN.rows * WIN.h;
  for (let face = 0; face < 6; face++) {
    const span = face < 2 ? d : w;
    for (let k = 0; k < 4; k++) {
      const i = face * 4 + k;
      if (face === 2 || face === 3) uv.setXY(i, DARK_UV, DARK_UV);
      else uv.setXY(i, ou + (uv.getX(i) * span) / tileU, ov + (uv.getY(i) * h) / tileV);
    }
  }
}

function box(p: Parts, slot: Slot, w: number, h: number, d: number, x: number, y: number, z: number, rand?: Rand) {
  const geo = new BoxGeometry(w, h, d);
  if (slot === "body" && rand) facadeUv(geo, w, h, d, rand);
  geo.translate(x, y, z);
  p.geo[slot].push(geo);
}

function cylinder(p: Parts, slot: Slot, r: number, h: number, x: number, y: number, z: number, sides = 10) {
  const geo = new CylinderGeometry(r, r, h, sides, 1, slot === "body");
  if (slot === "body") {
    const uv = geo.getAttribute("uv");
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (uv.getX(i) * Math.PI * 2 * r) / (WIN.cols * WIN.w), (uv.getY(i) * h) / (WIN.rows * WIN.h));
  }
  geo.translate(x, y, z);
  p.geo[slot].push(geo);
}

function line(p: Parts, a: readonly number[], b: readonly number[], hue: number, k = 1) {
  const c = NEON[hue] ?? NEON[0];
  if (!c) return;
  p.lines.push(...a, ...b);
  for (let i = 0; i < 2; i++) p.colours.push(c[0] * k, c[1] * k, c[2] * k);
}

function loop(p: Parts, pts: readonly (readonly number[])[], hue: number, k = 1) {
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length];
    if (b) line(p, a, b, hue, k);
  });
}

function ring(p: Parts, x: number, y: number, z: number, r: number, hue: number, n = 16) {
  loop(
    p,
    Array.from({ length: n }, (_, i) => [
      x + Math.cos((i / n) * Math.PI * 2) * r,
      y,
      z + Math.sin((i / n) * Math.PI * 2) * r,
    ]),
    hue,
  );
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
 * A flared hip roof as one geometry: the eave ring, a smaller ring pulled low to make the slope concave, and the peak.
 * Built as loose triangles so it merges with the boxes; the roof material is double sided, so no underside is needed.
 */
function roof(
  p: Parts,
  x: number,
  y: number,
  z: number,
  sx: number,
  sz: number,
  rise: number,
  flare: number,
  hue: number,
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
  const tile = TILES[hue] ?? TILES[2];
  if (tile)
    geo.setAttribute(
      "color",
      new Float32BufferAttribute(
        pos.flatMap((_, i) => (i % 3 ? [] : tile)),
        3,
      ),
    );
  geo.computeVertexNormals();
  geo.translate(x, y, z);
  p.geo.roof.push(geo);
  loop(
    p,
    outer.map(([a, b, c]) => [x + a, y + b, z + c]),
    hue,
  );
}

/** Lanterns hang under the four upswept corners of an eave. */
function cornerLamps(p: Parts, x: number, y: number, z: number, sx: number, sz: number, size: number) {
  for (const [a, b] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    box(p, "lamp", size, size * 1.4, size, x + a * sx * 1.3, y - size, z + b * sz * 1.3);
  }
}

function spire(p: Parts, x: number, y: number, z: number, h: number, hue: number) {
  cylinder(p, "roof", 0.8, h, x, y + h / 2, z, 6);
  for (let i = 1; i <= 3; i++) ring(p, x, y + (h * i) / 4, z, 3.2 - i * 0.6, hue, 8);
  box(p, "lamp", 2, 2, 2, x, y + h + 1, z);
}

function pagoda(p: Parts, b: Building) {
  const tiers = tiersOf(b);
  const unit = (b.h - 4) / (tiers + 0.8);
  const ratio = b.d / b.w;
  box(p, "wood", b.w * 1.25, 4, b.d * 1.25, b.x, 2, b.z);
  for (let i = 0; i < tiers; i++) {
    const tw = b.w * (1 - i * 0.09);
    const bh = unit * 0.62;
    const y0 = 4 + i * unit;
    box(p, "wood", tw, bh, tw * ratio, b.x, y0 + bh / 2, b.z);
    const s = tw * 0.5 * 1.42;
    roof(p, b.x, y0 + bh, b.z, s, s * ratio, unit * 0.55, unit * 0.22, b.hue);
    if (i % 2 === 0)
      cornerLamps(p, b.x, y0 + bh + unit * 0.22, b.z, s * 0.72, s * 0.72 * ratio, Math.max(1.2, unit * 0.09));
  }
  spire(p, b.x, 4 + tiers * unit - unit * 0.3, b.z, unit * 1.3, b.hue);
}

function hall(p: Parts, b: Building) {
  box(p, "wood", b.w * 1.1, 4, b.d * 1.15, b.x, 2, b.z);
  const bh = b.h * 0.5;
  box(p, "wood", b.w * 0.86, bh, b.d * 0.8, b.x, 4 + bh / 2, b.z);
  const sx = b.w * 0.5 * 1.1;
  const sz = b.d * 0.5 * 1.15;
  roof(p, b.x, 4 + bh, b.z, sx, sz, b.h * 0.42, b.h * 0.14, b.hue);
  if (b.h > 26) roof(p, b.x, 4 + bh + b.h * 0.3, b.z, sx * 0.6, sz * 0.6, b.h * 0.3, b.h * 0.1, b.hue);
  for (const side of [-1, 1]) box(p, "lamp", 2.2, 3, 2.2, b.x + side * b.w * 0.28, 4 + bh * 0.55, b.z + b.d * 0.42);
}

/** A neon strip down each front corner and a ring at every setback, in the building's hue. */
function corners(p: Parts, x: number, y0: number, y1: number, z: number, w: number, d: number, hue: number) {
  for (const s of [-1, 1]) line(p, [x + (s * w) / 2, y0, z + d / 2], [x + (s * w) / 2, y1, z + d / 2], hue);
  loop(
    p,
    [
      [x - w / 2, y1, z - d / 2],
      [x + w / 2, y1, z - d / 2],
      [x + w / 2, y1, z + d / 2],
      [x - w / 2, y1, z + d / 2],
    ],
    hue,
  );
}

function sign(p: Parts, b: Building, rand: Rand, top: number) {
  if (b.z < -1000 || rand() > 0.3) return;
  const which = Math.floor(rand() * 8);
  const chars = which === 0 || which === 2 || which === 3 ? 2 : 1;
  const h = chars * 9 + 4;
  const w = 8;
  const y = Math.min(top - h / 2 - 4, 20 + rand() * Math.max(0, top - 40));
  if (y < h / 2 + 4) return;
  const geo = new PlaneGeometry(w, h);
  geo.translate(b.x + (rand() < 0.5 ? -1 : 1) * (b.w / 2 - w / 2 - 1), y, b.z + b.d / 2 + 1.2);
  p.signs.push({ sign: which, geo });
}

function tower(p: Parts, b: Building, rand: Rand) {
  const setback = rand() < 0.5;
  const h1 = setback ? b.h * 0.7 : b.h;
  box(p, "body", b.w, h1, b.d, b.x, h1 / 2, b.z, rand);
  corners(p, b.x, 0, h1, b.z, b.w, b.d, b.hue);
  let top = h1;
  if (setback) {
    const h2 = b.h - h1;
    box(p, "body", b.w * 0.7, h2, b.d * 0.7, b.x, h1 + h2 / 2, b.z, rand);
    corners(p, b.x, h1, b.h, b.z, b.w * 0.7, b.d * 0.7, b.hue);
    top = b.h;
  }
  if (rand() < 0.3) ring(p, b.x, top + 6, b.z, b.w * 0.6, (b.hue + 1) % 3, 20);
  line(p, [b.x, top, b.z], [b.x, top + 18, b.z], 0, 0.7);
  box(p, "lamp", 1.6, 1.6, 1.6, b.x, top + 18, b.z);
  sign(p, b, rand, h1);
}

function hybrid(p: Parts, b: Building, rand: Rand) {
  const h1 = b.h * 0.78;
  box(p, "body", b.w * 0.8, h1, b.d * 0.8, b.x, h1 / 2, b.z, rand);
  corners(p, b.x, 0, h1, b.z, b.w * 0.8, b.d * 0.8, b.hue);
  const crown = b.h - h1;
  const s = b.w * 0.5 * 1.25;
  roof(p, b.x, h1, b.z, s, s * (b.d / b.w), crown * 0.45, crown * 0.16, b.hue);
  box(p, "wood", b.w * 0.5, crown * 0.35, b.d * 0.5, b.x, h1 + crown * 0.4, b.z);
  roof(p, b.x, h1 + crown * 0.55, b.z, s * 0.6, s * 0.6 * (b.d / b.w), crown * 0.4, crown * 0.12, b.hue);
  cornerLamps(p, b.x, h1 + crown * 0.16, b.z, s * 0.72, s * 0.72 * (b.d / b.w), 1.6);
  spire(p, b.x, h1 + crown * 0.8, b.z, crown * 0.6, b.hue);
  sign(p, b, rand, h1);
}

function round(p: Parts, b: Building, rand: Rand) {
  const r = b.w * 0.45;
  cylinder(p, "body", r, b.h, b.x, b.h / 2, b.z, 14);
  cylinder(p, "roof", r, 1, b.x, b.h + 0.5, b.z, 14);
  for (let y = 30 + rand() * 20; y < b.h; y += 36 + rand() * 20) ring(p, b.x, y, b.z, r + 0.8, b.hue, 18);
  ring(p, b.x, b.h + 1, b.z, r + 0.8, b.hue, 18);
  line(p, [b.x, b.h, b.z], [b.x, b.h + 30, b.z], 0, 0.7);
  box(p, "lamp", 2, 2, 2, b.x, b.h + 30, b.z);
}

function mega(p: Parts, b: Building, rand: Rand) {
  box(p, "body", b.w, b.h, b.d, b.x, b.h / 2, b.z, rand);
  box(p, "body", b.w * 0.5, b.h * 0.6, b.d * 1.3, b.x + b.w * 0.6, b.h * 0.3, b.z, rand);
  corners(p, b.x, 0, b.h, b.z, b.w, b.d, b.hue);
  for (let y = 60; y < b.h; y += 70) corners(p, b.x, y, y, b.z, b.w + 2, b.d + 2, (b.hue + 1) % 3);
  const s = b.w * 0.5 * 1.35;
  roof(p, b.x, b.h, b.z, s, s, 40, 14, b.hue);
  spire(p, b.x, b.h + 30, b.z, 60, b.hue);
}

/** Torii gates span the avenue in front of the dome, pillars and both beams in vermilion neon. */
export function gates(p: Parts) {
  const half = AVENUE.half - 8;
  for (const z of AVENUE.gates) {
    for (const s of [-1, 1]) cylinder(p, "gate", 1.4, 24, s * half, 12, z, 8);
    box(p, "gate", half * 2 + 14, 2, 2.6, 0, 25, z);
    box(p, "gate", half * 2 + 4, 1.2, 1.8, 0, 20, z);
    line(p, [-half - 7, 26.1, z + 1.4], [half + 7, 26.1, z + 1.4], 0);
  }
}

/** Adds one building's geometry to the slots; its own seed keeps the details the same on every load. */
export function build(p: Parts, b: Building): void {
  const rand = rng(b.seed);
  if (b.kind === "pagoda") pagoda(p, b);
  else if (b.kind === "hall") hall(p, b);
  else if (b.kind === "tower") tower(p, b, rand);
  else if (b.kind === "hybrid") hybrid(p, b, rand);
  else if (b.kind === "cylinder") round(p, b, rand);
  else mega(p, b, rand);
}
