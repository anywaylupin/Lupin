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
  spires?: boolean;
}

/**
 * Short, wide blocks with every floor visible: a slab line per storey, and either a lit strip or a row of windows that can switch on and off.
 * Spire blocks draw one extra random number, which the prototype spent on a spire list it never drew; it is kept so the seeded skyline stays identical.
 */
export function paintBlock(g: Ctx2D, x: number, top: number, w: number, o: BlockStyle, rand: Rand, wins: Win[] | null) {
  const gr = g.createLinearGradient(0, top, 0, CH);
  gr.addColorStop(0, o.top);
  gr.addColorStop(1, o.bottom);
  g.fillStyle = gr;
  g.fillRect(x, top, w, CH - top);
  if (rand() < 0.5) g.fillRect(x + w * (0.1 + rand() * 0.4), top - o.row, w * 0.3, o.row);
  if (rand() < 0.35) {
    g.fillRect(x + w * 0.75, top - o.row * 3, 3, o.row * 3);
    if (o.spires) rand();
  }
  g.fillStyle = rgba(CYAN, o.rim);
  g.fillRect(x + w - 2, top, 2, CH - top);
  g.fillStyle = rgba(PINK, o.rim * 0.6);
  g.fillRect(x, top, 1.5, CH - top);
  g.fillStyle = `rgba(255,255,255,${o.roof})`;
  g.fillRect(x, top, w, 1.5);
  for (let fy = top + o.row; fy < CH; fy += o.row) {
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
