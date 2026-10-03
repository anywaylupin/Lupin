import { rng } from "../math";
import { CYAN, PINK, rgba } from "../theme";
import { paintBlock, type BlockStyle } from "./block";
import { CH, CW, HZ, type Ctx2D, type Win } from "./board";

export const LAYER_IDS = ["sky", "far", "farmid", "mid", "nearmid", "near"] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export interface Baked<I> {
  layers: { id: LayerId; image: I }[];
  wins: { mid: Win[]; nearmid: Win[] };
}

type Canvas2D = HTMLCanvasElement | OffscreenCanvas;

export interface CanvasFactory<C extends Canvas2D> {
  make(w: number, h: number): C;
  ctx(c: C): Ctx2D;
}

/**
 * The city is six depth layers baked once, far ones softened like a shallow depth of field; only lights, traffic and weather are drawn live.
 * Works on any canvas type so the same code bakes in a worker on OffscreenCanvas or on the main thread as a fallback.
 */
export function bakeCity<C extends Canvas2D>(f: CanvasFactory<C>): Baked<C> {
  const rand = rng(7);
  const layer = (blur: number) => {
    const c = f.make(CW, CH);
    return { c, g: f.ctx(c), blur };
  };
  type Layer = ReturnType<typeof layer>;
  const blockRow = (
    L: Layer,
    o: BlockStyle,
    from: number,
    to: number,
    w: [number, number],
    top: [number, number],
    gap: [number, number],
    wins: Win[] | null,
  ) => {
    let x = from;
    while (x < to) {
      const bw = w[0] + rand() * (w[1] - w[0]);
      paintBlock(L.g, x, top[0] + rand() * (top[1] - top[0]), bw, o, rand, wins);
      x += bw + gap[0] + rand() * (gap[1] - gap[0]);
    }
  };
  const finish = (L: Layer, haze: number): C => {
    let c = L.c;
    if (L.blur) {
      const b = f.make(CW, CH);
      const bg = f.ctx(b);
      bg.filter = `blur(${L.blur}px)`;
      bg.drawImage(c, 0, 0);
      bg.filter = "none";
      c = b;
    }
    if (haze) {
      const g = f.ctx(c);
      const hz = g.createLinearGradient(0, HZ - 120, 0, CH);
      hz.addColorStop(0, "rgba(70,24,100,0)");
      hz.addColorStop(0.35, `rgba(70,24,100,${haze})`);
      hz.addColorStop(1, `rgba(16,10,40,${haze + 0.2})`);
      g.fillStyle = hz;
      g.fillRect(0, HZ - 120, CW, CH);
    }
    return c;
  };

  const sky = layer(0);
  const g = sky.g;
  const gr = g.createLinearGradient(0, 0, 0, CH);
  gr.addColorStop(0, "#04061a");
  gr.addColorStop(0.3, "#0f0d3a");
  gr.addColorStop(0.48, "#2a1257");
  gr.addColorStop(0.56, "#5a1d66");
  gr.addColorStop(0.62, "#2a1052");
  gr.addColorStop(1, "#08071c");
  g.fillStyle = gr;
  g.fillRect(0, 0, CW, CH);
  for (let i = 0; i < 120; i++) {
    g.fillStyle = `rgba(220,220,255,${0.15 + rand() * 0.45})`;
    g.fillRect(rand() * CW, rand() * HZ * 0.6, 1.5, 1.5);
  }
  g.lineWidth = 14;
  g.strokeStyle = rgba(CYAN, 0.06);
  g.beginPath();
  g.ellipse(1100, 190, 480, 100, -0.14, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 2;
  g.strokeStyle = rgba(CYAN, 0.16);
  g.beginPath();
  g.ellipse(1100, 190, 480, 100, -0.14, 0, Math.PI * 2);
  g.stroke();
  const glow = g.createRadialGradient(800, HZ, 0, 800, HZ, 760);
  glow.addColorStop(0, "rgba(217,71,159,0.3)");
  glow.addColorStop(1, "rgba(217,71,159,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, CW, CH);

  const far = layer(2.4);
  blockRow(
    far,
    {
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
      spires: true,
    },
    -40,
    CW + 40,
    [70, 160],
    [HZ - 150, HZ - 40],
    [0, 10],
    null,
  );
  const farmid = layer(1.2);
  blockRow(
    farmid,
    {
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
    -60,
    CW + 60,
    [140, 260],
    [HZ - 220, HZ - 90],
    [6, 40],
    null,
  );
  const winsMid: Win[] = [];
  const mid = layer(0);
  const midO: BlockStyle = {
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
  };
  blockRow(mid, midO, -40, 520, [180, 300], [340, 470], [20, 80], winsMid);
  paintBlock(mid.g, 560, 330, 230, midO, rand, winsMid);
  paintBlock(mid.g, 820, 390, 260, midO, rand, winsMid);
  blockRow(mid, midO, 1120, CW + 40, [180, 300], [340, 470], [20, 80], winsMid);
  const winsNearmid: Win[] = [];
  const nearmid = layer(0);
  blockRow(
    nearmid,
    {
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
    -80,
    CW + 80,
    [240, 420],
    [600, 720],
    [30, 140],
    winsNearmid,
  );
  const near = layer(1.4);
  const ng = near.g;
  const nearO: BlockStyle = {
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
  };
  paintBlock(ng, -40, 740, 320, nearO, rand, null);
  paintBlock(ng, 1330, 720, 320, nearO, rand, null);
  ng.fillStyle = "#0b0b26";
  ng.fillRect(-40, 900, CW + 80, 30);
  ng.fillStyle = rgba(CYAN, 0.35);
  ng.fillRect(-40, 900, CW + 80, 2);
  ng.fillStyle = rgba(PINK, 0.3);
  ng.fillRect(-40, 928, CW + 80, 2);
  for (let px = 0; px < CW; px += 120) {
    ng.fillStyle = "#0b0b26";
    ng.fillRect(px, 930, 16, CH - 930);
  }

  return {
    layers: [
      { id: "sky", image: finish(sky, 0) },
      { id: "far", image: finish(far, 0.25) },
      { id: "farmid", image: finish(farmid, 0.18) },
      { id: "mid", image: finish(mid, 0) },
      { id: "nearmid", image: finish(nearmid, 0) },
      { id: "near", image: finish(near, 0) },
    ],
    wins: { mid: winsMid, nearmid: winsNearmid },
  };
}
