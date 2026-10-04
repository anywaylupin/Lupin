import type { Rand } from "../math";
import { AMBER, CYAN, PINK, rgba } from "../theme";
import { CH, type Ctx2D, type Win } from "./board";

export interface BlockStyle {
  top: string;
  bottom: string;
  row: number;
  rim: number;
  roof: number;
  slab: number;
  strip: number;
  pad: number;
  ww: number;
  gap: number;
  lit: number;
  winA?: number;
}

/** A level the rain can splash on: roofs, terraces and eaves, collected while baking. */
export interface Ledge {
  x0: number;
  x1: number;
  y: number;
}

/** Per-layer colour and window rhythm; nearer layers are darker, with bigger windows and brighter rims. */
export const STYLE = {
  far: {
    top: "#221a5c",
    bottom: "#140f3e",
    row: 9,
    rim: 0.12,
    roof: 0.06,
    slab: 0.03,
    strip: 0.06,
    pad: 4,
    ww: 3,
    gap: 4,
    lit: 0.08,
    winA: 0.45,
  },
  farmid: {
    top: "#1f1b5e",
    bottom: "#0f0c33",
    row: 13,
    rim: 0.2,
    roof: 0.08,
    slab: 0.04,
    strip: 0.12,
    pad: 6,
    ww: 4,
    gap: 5,
    lit: 0.12,
    winA: 0.5,
  },
  mid: {
    top: "#1d1e58",
    bottom: "#0b0c2a",
    row: 22,
    rim: 0.4,
    roof: 0.12,
    slab: 0.06,
    strip: 0.1,
    pad: 10,
    ww: 9,
    gap: 6,
    lit: 0.32,
  },
  nearmid: {
    top: "#14153f",
    bottom: "#07081c",
    row: 26,
    rim: 0.5,
    roof: 0.14,
    slab: 0.06,
    strip: 0.08,
    pad: 12,
    ww: 12,
    gap: 8,
    lit: 0.28,
  },
  near: {
    top: "#0a0a22",
    bottom: "#05050f",
    row: 32,
    rim: 0.55,
    roof: 0.1,
    slab: 0.05,
    strip: 0.3,
    pad: 14,
    ww: 14,
    gap: 10,
    lit: 0.3,
    winA: 0.55,
  },
} as const satisfies Record<string, BlockStyle>;

/**
 * A building face from `top` down to the bottom of the board: gradient body, pink and cyan rims, a slab line per storey, and per storey either a lit strip or a row of windows.
 * Windows go to `wins` when the layer keeps them live, otherwise they are painted in.
 */
export function facade(
  g: Ctx2D,
  x: number,
  top: number,
  w: number,
  o: BlockStyle,
  rand: Rand,
  wins: Win[] | null,
  bottom = CH,
) {
  const gr = g.createLinearGradient(0, top, 0, CH);
  gr.addColorStop(0, o.top);
  gr.addColorStop(1, o.bottom);
  g.fillStyle = gr;
  g.fillRect(x, top, w, bottom - top);
  g.fillStyle = rgba(CYAN, o.rim);
  g.fillRect(x + w - 2, top, 2, bottom - top);
  g.fillStyle = rgba(PINK, o.rim * 0.6);
  g.fillRect(x, top, 1.5, bottom - top);
  g.fillStyle = `rgba(255,255,255,${o.roof})`;
  g.fillRect(x, top, w, 1.5);
  for (let fy = top + o.row; fy < bottom; fy += o.row) {
    g.fillStyle = "rgba(0,0,0,0.35)";
    g.fillRect(x, fy - 2, w, 2);
    g.fillStyle = `rgba(255,255,255,${o.slab})`;
    g.fillRect(x, fy, w, 1);
    if (rand() < o.strip) {
      g.fillStyle = rgba(rand() < 0.5 ? PINK : CYAN, 0.22 + rand() * 0.2);
      g.fillRect(x + 4, fy - o.row * 0.55, w - 8, 2);
      continue;
    }
    for (let wx = x + o.pad; wx < x + w - o.pad - o.ww; wx += o.ww + o.gap) {
      if (rand() < 0.12) continue;
      const c = rand() < 0.42 ? CYAN : rand() < 0.8 ? PINK : AMBER;
      const wy = fy - o.row * 0.78;
      const wh = o.row * 0.48;
      if (wins) wins.push({ x: wx, y: wy, w: o.ww, h: wh, c, on: rand() < o.lit });
      else if (rand() < o.lit) {
        g.fillStyle = rgba(c, o.winA ?? 0.5);
        g.fillRect(wx, wy, o.ww, wh);
      }
    }
  }
}

/** A filler block: a facade with an occasional roof box or antenna, used far away and on the flanks beyond the hero pieces. */
export function paintBlock(g: Ctx2D, x: number, top: number, w: number, o: BlockStyle, rand: Rand, wins: Win[] | null) {
  g.fillStyle = o.top;
  if (rand() < 0.5) g.fillRect(x + w * (0.1 + rand() * 0.4), top - o.row, w * 0.3, o.row);
  if (rand() < 0.35) g.fillRect(x + w * 0.75, top - o.row * 3, 3, o.row * 3);
  facade(g, x, top, w, o, rand, wins);
}
