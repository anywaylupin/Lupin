import { rng } from "../math";
import { CYAN, PINK, rgba } from "../theme";
import { antennaFarm, arcology, cantilever, cylinder, dome, megastructure, pagoda, twinTowers } from "./archetypes";
import { facade, paintBlock, STYLE, type BlockStyle, type Ledge } from "./block";
import { PLAN } from "./plan";

/** The sky glows behind the dome, which stands at the board point the hole is centred on. */
const FOCUS_X = PLAN.dome.x;
import { coasterTrack, tube } from "./tracks";
import { CH, CW, HZ, type Ctx2D, type Win } from "./board";

export const LAYER_IDS = ["sky", "far", "farmid", "mid", "nearmid", "near"] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export interface Baked<I> {
  layers: { id: LayerId; image: I }[];
  wins: { mid: Win[]; nearmid: Win[] };
  ledges: { mid: Ledge[]; nearmid: Ledge[] };
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
    return { c, g: f.ctx(c), blur, out: { wins: [] as Win[], ledges: [] as Ledge[] } };
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
  g.ellipse(FOCUS_X + 300, 180, 480, 100, -0.14, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 2;
  g.strokeStyle = rgba(CYAN, 0.16);
  g.beginPath();
  g.ellipse(FOCUS_X + 300, 180, 480, 100, -0.14, 0, Math.PI * 2);
  g.stroke();
  const glow = g.createRadialGradient(FOCUS_X, HZ, 0, FOCUS_X, HZ, 760);
  glow.addColorStop(0, "rgba(217,71,159,0.3)");
  glow.addColorStop(1, "rgba(217,71,159,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, CW, CH);

  const far = layer(2.4);
  blockRow(far, STYLE.far, -40, CW + 40, [70, 160], [HZ - 150, HZ - 40], [0, 10], null);
  const farmid = layer(1.2);
  blockRow(farmid, STYLE.farmid, -60, CW + 60, [140, 260], [HZ - 220, HZ - 90], [6, 40], null);

  const mid = layer(0);
  blockRow(mid, STYLE.mid, -40, PLAN.twin.x - 20, [150, 260], [340, 470], [20, 70], mid.out.wins);
  twinTowers(mid.g, rand, mid.out);
  dome(mid.g, rand, mid.out);
  coasterTrack(mid.g, "behind");
  cylinder(mid.g, mid.out);
  coasterTrack(mid.g, "front");
  blockRow(mid, STYLE.mid, PLAN.coaster.loopX + 70, CW + 40, [150, 260], [340, 470], [20, 70], mid.out.wins);

  const nearmid = layer(0);
  blockRow(nearmid, STYLE.nearmid, -80, PLAN.mega.x - 10, [120, 200], [620, 720], [10, 40], nearmid.out.wins);
  megastructure(nearmid.g, rand);
  arcology(nearmid.g, rand, nearmid.out);
  const k = PLAN.connector;
  facade(nearmid.g, k.x, k.top, k.w, STYLE.nearmid, rand, nearmid.out.wins);
  antennaFarm(nearmid.g, rand, nearmid.out);
  pagoda(nearmid.g, rand, nearmid.out);
  cantilever(nearmid.g, rand, nearmid.out);
  blockRow(
    nearmid,
    STYLE.nearmid,
    PLAN.cantilever.x + PLAN.cantilever.w + 12,
    CW + 80,
    [160, 260],
    [600, 720],
    [30, 100],
    nearmid.out.wins,
  );
  tube(nearmid.g);

  const near = layer(1.4);
  const ng = near.g;
  paintBlock(ng, -40, 740, 320, STYLE.near, rand, null);
  paintBlock(ng, 1330, 720, 320, STYLE.near, rand, null);
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
    wins: { mid: mid.out.wins, nearmid: nearmid.out.wins },
    ledges: { mid: mid.out.ledges, nearmid: nearmid.out.ledges },
  };
}
