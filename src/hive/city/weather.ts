import type { Point } from "../hex";
import { easeOut, hash2 } from "../math";
import { AMBER, CYAN, PINK, rgba } from "../theme";
import type { Ledge } from "./block";
import { CH, CW, HZ } from "./board";
import { claim } from "./events";
import type { Scene } from "./scene";

type Ctx = CanvasRenderingContext2D;

/** Lightning stays low over the far skyline and lights only a small patch of cloud around it, so the city never flashes. */
export function drawBolt(g: Ctx, s: Scene, dt: number, DPR: number): void {
  s.nextBolt -= dt;
  if (!s.bolt && s.nextBolt <= 0) {
    if (!claim(s.stage, s.weather, 0.5)) s.nextBolt = 1;
    else {
      const bx = 360 + Math.random() * 1200;
      const main: Point[] = [];
      let x = bx;
      let y = 280;
      while (y < HZ - 30) {
        main.push({ x, y });
        x += (Math.random() - 0.5) * 36;
        y += 16 + Math.random() * 14;
      }
      const branches = [1, 2].map(() => {
        const s0 = main[2 + ((Math.random() * (main.length - 3)) | 0)] ?? { x: bx, y: 320 };
        const br = [s0];
        let bx2 = s0.x;
        let by2 = s0.y;
        for (let k = 0; k < 4; k++) {
          bx2 += (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 16);
          by2 += 12 + Math.random() * 10;
          br.push({ x: bx2, y: by2 });
        }
        return br;
      });
      s.bolt = { t: 0, x: bx, main, branches };
    }
  }
  const b = s.bolt;
  if (!b) return;
  b.t += dt * 1000;
  const t = b.t;
  const a = t < 70 ? 1 : t < 140 ? 0.15 : t < 230 ? 0.8 : t < 320 ? 0.1 : t < 440 ? 0.5 * (1 - (t - 320) / 120) : 0;
  if (t > 460) {
    s.bolt = null;
    s.nextBolt = 10 + Math.random() * 10;
    return;
  }
  const glow = g.createRadialGradient(b.x, 300, 0, b.x, 300, 180);
  glow.addColorStop(0, `rgba(190,170,255,${0.18 * a})`);
  glow.addColorStop(1, "rgba(190,170,255,0)");
  g.fillStyle = glow;
  g.fillRect(b.x - 180, 120, 360, 360);
  g.save();
  g.strokeStyle = `rgba(225,230,255,${0.9 * a})`;
  g.lineWidth = 1.5;
  g.shadowColor = "rgba(180,170,255,0.9)";
  g.shadowBlur = 10 * DPR;
  for (const line of [b.main, ...b.branches]) {
    g.beginPath();
    line.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.stroke();
  }
  g.restore();
}

/** A rare distant blast: a short bloom of light, a few sparks, then smoke drifting up for a few seconds. */
export function drawBoom(g: Ctx, s: Scene, dt: number): void {
  s.nextBoom -= dt;
  if (!s.boom && s.nextBoom <= 0) {
    if (!claim(s.stage, s.weather, 1.2)) s.nextBoom = 2;
    else {
      s.boom = {
        t: 0,
        x: 400 + Math.random() * 1100,
        y: HZ - 60 - Math.random() * 60,
        sparks: Array.from({ length: 12 }, () => ({ vx: (Math.random() - 0.5) * 140, vy: -40 - Math.random() * 110 })),
        puffs: Array.from({ length: 7 }, () => ({
          dx: (Math.random() - 0.5) * 26,
          r: 7 + Math.random() * 9,
          d: Math.random() * 0.6,
        })),
      };
    }
  }
  const b = s.boom;
  if (!b) return;
  b.t += dt;
  const t = b.t;
  if (t > 6) {
    s.boom = null;
    s.nextBoom = 25 + Math.random() * 15;
    return;
  }
  for (const p of b.puffs) {
    const pt = t - 0.2 - p.d;
    if (pt <= 0) continue;
    g.fillStyle = `rgba(60,36,86,${0.35 * Math.max(0, 1 - pt / 5)})`;
    g.beginPath();
    g.arc(b.x + p.dx + pt * 6, b.y - pt * 12, p.r * (1 + pt * 0.5), 0, 7);
    g.fill();
  }
  if (t < 1.2) {
    const rad = 8 + 40 * easeOut(Math.min(t / 0.3, 1));
    const a = 1 - t / 1.2;
    g.save();
    g.globalCompositeOperation = "lighter";
    const gl = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, rad);
    gl.addColorStop(0, `rgba(255,220,170,${0.9 * a})`);
    gl.addColorStop(0.4, rgba(AMBER, 0.6 * a));
    gl.addColorStop(1, rgba(PINK, 0));
    g.fillStyle = gl;
    g.beginPath();
    g.arc(b.x, b.y, rad, 0, 7);
    g.fill();
    g.restore();
  }
  if (t < 1) {
    g.fillStyle = rgba(AMBER, 1 - t);
    for (const sp of b.sparks) g.fillRect(b.x + sp.vx * t, b.y + sp.vy * t + 70 * t * t, 2, 2);
  }
}

/** One depth of rain; far rain is fine, faint and slow, near rain thick and fast, so the layers read as depth. */
export interface RainDepth {
  salt: number;
  count: number;
  alpha: number;
  width: number;
  len: readonly [number, number];
  speed: readonly [number, number];
}

export const RAIN = {
  far: { salt: 1, count: 80, alpha: 0.12, width: 0.8, len: [8, 14], speed: [0.22, 0.34] },
  mid: { salt: 2, count: 100, alpha: 0.18, width: 1, len: [12, 22], speed: [0.32, 0.5] },
  near: { salt: 3, count: 60, alpha: 0.26, width: 1.7, len: [24, 40], speed: [0.55, 0.8] },
} as const satisfies Record<string, RainDepth>;

/**
 * Streaks each with its own lane, speed and length from stable noise, falling with a slight slant.
 * `skip` drops streaks that would fall somewhere rain cannot reach, like inside the dome; a clip path did the same at a measurable cost every frame.
 */
export function drawRain(g: Ctx, t: number, r: RainDepth, skip?: (x: number, y: number) => boolean): void {
  g.strokeStyle = rgba(CYAN, r.alpha);
  g.lineWidth = r.width;
  g.beginPath();
  for (let i = 0; i < r.count; i++) {
    const u = hash2(i, r.salt * 10 + 1);
    const v = hash2(i, r.salt * 10 + 2);
    const spd = r.speed[0] + hash2(i, r.salt * 10 + 3) * (r.speed[1] - r.speed[0]);
    const len = r.len[0] + hash2(i, r.salt * 10 + 4) * (r.len[1] - r.len[0]);
    const fall = (v + t * spd) % 1;
    const y = fall * (CH + 40) - 20;
    const x = u * (CW + 160) - 80 + fall * CH * 0.12;
    if (skip?.(x, y)) continue;
    g.moveTo(x, y);
    g.lineTo(x - len * 0.12, y - len);
  }
  g.stroke();
}

/** Small splash ticks along roofs and terraces; each spot flicks up for a sixth of a second on its own rhythm. */
export function drawSplashes(g: Ctx, t: number, ledges: readonly Ledge[]): void {
  g.strokeStyle = rgba(CYAN, 0.55);
  g.lineWidth = 1;
  g.beginPath();
  ledges.forEach((l, li) => {
    const n = Math.max(1, Math.floor((l.x1 - l.x0) / 34));
    for (let k = 0; k < n; k++) {
      const period = 0.9 + hash2(li, k) * 0.8;
      const local = (t + hash2(k, li + 50) * period) % period;
      if (local > 0.16) continue;
      const x = l.x0 + ((k + 0.5) / n) * (l.x1 - l.x0) + (hash2(li + k, Math.floor(t / period)) - 0.5) * 20;
      const h = 4 * (1 - local / 0.16);
      g.moveTo(x - 3, l.y - h);
      g.lineTo(x, l.y);
      g.lineTo(x + 3, l.y - h);
    }
  });
  g.stroke();
}
