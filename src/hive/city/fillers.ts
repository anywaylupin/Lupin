import { rng, type Rand } from "../math";
import type { Boards } from "./billboards";
import { HUES, NEON, Parts, roof, TILES, type RGB } from "./kit";
import type { Filler } from "./plan";

function pick<T>(rand: Rand, list: readonly T[]): T {
  const v = list[Math.floor(rand() * list.length)];
  if (v === undefined) throw new Error("pick from an empty list");
  return v;
}

/** A thin strip of light up a face, the vertical LED bars the reference's towers wear. */
function ledBar(p: Parts, x: number, y: number, z: number, h: number, c: RGB) {
  p.box("lit", 1.6, h, 1.6, x, y + h / 2, z, c);
}

/** A cantilevered deck jutting from a face, with a strip of light along its underside. */
function deck(p: Parts, f: Filler, y: number, rand: Rand) {
  const out = 18 + rand() * 30;
  p.box("metal", f.w * 0.8, 3, out, f.x, y, f.z + f.d / 2 + out / 2);
  p.box("lit", f.w * 0.8, 0.8, 0.8, f.x, y - 2, f.z + f.d / 2 + out, pick(rand, HUES));
}

/** An exterior truss up one side, X-braced every storey band. */
function truss(p: Parts, f: Filler, h: number, rand: Rand) {
  const side = rand() < 0.5 ? -1 : 1;
  const x = f.x + side * (f.w / 2 + 6);
  const z0 = f.z + f.d / 2 - 4;
  const z1 = z0 - 14;
  for (const z of [z0, z1]) p.box("metal", 1.4, h, 1.4, x, h / 2, z);
  for (let y = 0; y < h - 30; y += 30) {
    p.strut("metal", { x, y, z: z0 }, { x, y: y + 30, z: z1 }, 0.6);
    p.strut("metal", { x, y, z: z1 }, { x, y: y + 30, z: z0 }, 0.6);
  }
}

/** Crowns: an antenna mast, a ring of light, a dish, or a temple roof on a glass tower. */
function crown(p: Parts, f: Filler, top: number, w: number, d: number, rand: Rand) {
  const c = pick(rand, HUES);
  const k = rand();
  if (k < 0.3) {
    const mast = 30 + rand() * 60;
    p.cyl("metal", 1.4, 0.6, mast, f.x, top, f.z, 5);
    p.box("lamp", 3, 3, 3, f.x, top + mast, f.z, undefined);
  } else if (k < 0.5) {
    p.ring(f.x, top + 10, f.z, Math.max(w, d) * 0.7, c, 24);
    p.ring(f.x, top + 16, f.z, Math.max(w, d) * 0.55, c, 24);
  } else if (k < 0.65) {
    p.cyl("metal", 2, 2, 12, f.x, top, f.z, 6);
    p.cyl("metal", w * 0.25, 2, 6, f.x, top + 12, f.z, 12);
  } else if (k < 0.82) {
    roof(p, f.x, top, f.z, w * 0.65, d * 0.65, w * 0.35, w * 0.12, pick(rand, TILES), c);
  } else p.block("metal", w * 0.5, 14, d * 0.5, f.x, top, f.z);
}

/**
 * A near filler tower, its design drawn from its seed: a stack of setbacks or a split twin with a sky bridge, panelled facades, LED bars, cantilevered decks, an exterior truss, billboards and a crown.
 * No two come out alike, which is what keeps the skyline from reading as copies.
 */
function tower(p: Parts, f: Filler, boards: Boards) {
  const rand = rng(f.seed);
  const c = pick(rand, HUES);
  const twin = rand() < 0.22;
  if (twin) {
    const gap = f.w * 0.25;
    const ww = (f.w - gap) / 2;
    const h2 = f.h * (0.75 + rand() * 0.2);
    p.block("body", ww, f.h, f.d, f.x - (ww + gap) / 2, 0, f.z, undefined, f.seed);
    p.block("body", ww, h2, f.d, f.x + (ww + gap) / 2, 0, f.z, undefined, f.seed >> 3);
    for (let y = f.h * 0.35; y < h2 - 40; y += f.h * 0.3) {
      p.box("glass", gap + 2, 10, f.d * 0.5, f.x, y, f.z);
      p.box("lit", gap + 2, 0.8, 0.8, f.x, y - 5, f.z + f.d * 0.25, c);
    }
    p.edges(ww, f.h, f.d, f.x - (ww + gap) / 2, 0, f.z, c);
    crown(p, { ...f, x: f.x - (ww + gap) / 2 }, f.h, ww, f.d, rand);
    return;
  }
  const tiers = 1 + Math.floor(rand() * 3);
  let y = 0;
  let w = f.w;
  let d = f.d;
  for (let i = 0; i < tiers; i++) {
    const h = i === tiers - 1 ? f.h - y : (f.h - y) * (0.45 + rand() * 0.25);
    const dx = i ? (rand() - 0.5) * (f.w - w) : 0;
    p.block("body", w, h, d, f.x + dx, y, f.z, undefined, f.seed + i * 17);
    p.edges(w, h, d, f.x + dx, y, f.z, c);
    if (rand() < 0.5) ledBar(p, f.x + dx + w * 0.25, y, f.z + d / 2 + 1, h, pick(rand, HUES));
    y += h;
    w *= 0.7 + rand() * 0.15;
    d *= 0.7 + rand() * 0.15;
  }
  if (rand() < 0.4) deck(p, f, f.h * (0.3 + rand() * 0.4), rand);
  if (rand() < 0.3) truss(p, f, f.h * 0.8, rand);
  if (rand() < 0.75) {
    const tall = rand() < 0.6;
    const bw = tall ? Math.min(f.w * 0.4, 34) : Math.min(f.w * 0.8, 80);
    const bh = tall ? bw * 2.5 : bw * 0.4;
    const by = 60 + rand() * Math.max(10, f.h * 0.6 - bh);
    p.screen(boards.get(tall ? "tall" : "wide"), bw, bh, f.x + (rand() - 0.5) * (f.w - bw), by, f.z + f.d / 2 + 1.5);
  }
  crown(p, f, f.h, w, d, rand);
}

/** A far block: one panelled box and sometimes a red air-warning light, enough to make a skyline through the haze. */
function far(p: Parts, f: Filler) {
  p.block("body", f.w, f.h, f.d, f.x, 0, f.z, undefined, f.seed);
  if (f.seed % 3 === 0) p.box("lit", 4, 4, 4, f.x, f.h + 2, f.z, NEON.red);
}

export function buildFillers(p: Parts, list: readonly Filler[], boards: Boards): void {
  p.at(0, 0, 0);
  for (const f of list) {
    if (f.far) far(p, f);
    else tower(p, f, boards);
  }
}
