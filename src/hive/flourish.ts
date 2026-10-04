import { bee } from "./city/figures";
import { DIRS, hexVerts, keyOf, type Point } from "./hex";
import type { Loose } from "./layout";
import { clamp, easeOut, hash2 } from "./math";
import { addPoly, type Ctx } from "./paint";
import { drawScene } from "./scenes";
import { emptyGaps, isOpen } from "./sheet";
import { on, type Hive } from "./state";
import { CYAN, rgba } from "./theme";

/** A bee carrying one hex home during Reset: it joins as the hex lifts, rides above it, and flies off once it lands. */
export interface Carrier {
  l: Loose;
  t0: number;
  delay: number;
  dur: number;
  from: Point | null;
}

const ARRIVE_MS = 180;
const LEAVE_MS = 600;

/** Torn-out secret hexes show their scene in place of the city, clipped to the slot. */
export function drawEggs(g: Ctx, h: Hive, now: number): void {
  const F = h.front;
  if (!F.eggs.size) return;
  const t = h.reduced ? 0.8 : now / 1000;
  for (const s of emptyGaps(F)) {
    const kind = F.eggs.get(s.key);
    if (!kind) continue;
    g.save();
    g.beginPath();
    addPoly(g, hexVerts(s.x, s.y, F.R * 1.004));
    g.clip();
    g.translate(s.x - F.R * 0.87, s.y - F.R);
    drawScene(g, kind, F.R * 1.74, F.R * 2, t);
    g.restore();
  }
}

/** Rain drips run down the hole's rim: each sloping rim edge sends a drop down every couple of seconds on its own rhythm. */
export function drawDrips(g: Ctx, h: Hive, z: number, now: number): void {
  if (!on(h, "weather")) return;
  const F = h.front;
  const t = now / 1000;
  g.fillStyle = rgba(CYAN, 0.7);
  for (const s of emptyGaps(F)) {
    const v = hexVerts(s.x, s.y, F.R * 0.98);
    DIRS.forEach(([dq, dr], di) => {
      if (isOpen(F, keyOf(s.q + dq, s.r + dr))) return;
      const a = v[(6 - di + 0) % 6];
      const b = v[(6 - di + 1) % 6];
      if (!a || !b || Math.abs(a.y - b.y) < 1) return;
      const [top, low] = a.y < b.y ? [a, b] : [b, a];
      const period = 1.6 + hash2(s.q * 31 + di, s.r) * 1.4;
      const k = ((t + hash2(di, s.q * 17 + s.r) * period) % period) / 1.1;
      if (k > 1) return;
      const e = k * k;
      const x = top.x + (low.x - top.x) * e;
      const y = top.y + (low.y - top.y) * e;
      g.beginPath();
      g.ellipse(x, y, 1.4 / z, 2.6 / z, 0, 0, Math.PI * 2);
      g.fill();
    });
  }
}

/** Bees ride above the hexes Reset sends home, tethered by a thin line, then peel off up and away. */
export function drawCarriers(g: Ctx, h: Hive, z: number, now: number): void {
  const R = h.front.R;
  h.carriers = h.carriers.filter((c) => now - c.t0 - c.delay < c.dur + LEAVE_MS);
  for (const c of h.carriers) {
    const t = now - c.t0 - c.delay;
    if (t < -ARRIVE_MS) continue;
    const hex = { x: c.l.ax, y: c.l.ay };
    let p: Point = { x: hex.x, y: hex.y - R * 0.62 };
    let alpha = 1;
    if (t < 0) {
      const k = easeOut(1 + t / ARRIVE_MS);
      p = { x: p.x - R * (1 - k), y: p.y - R * 0.8 * (1 - k) };
      alpha = k;
    } else if (t > c.dur) {
      c.from ??= p;
      const k = clamp((t - c.dur) / LEAVE_MS, 0, 1);
      p = { x: c.from.x + R * 1.6 * k, y: c.from.y - R * 2.4 * k * k };
      alpha = 1 - k;
    } else {
      p.y += Math.sin(now / 120) * R * 0.03;
      g.strokeStyle = rgba(CYAN, 0.5);
      g.lineWidth = 1 / z;
      g.beginPath();
      g.moveTo(p.x, p.y + R * 0.12);
      g.lineTo(hex.x, hex.y - R * 0.3);
      g.stroke();
    }
    g.save();
    g.globalAlpha = alpha;
    g.translate(p.x, p.y);
    g.scale(R * 0.03, R * 0.03);
    bee(g, now / 1000, c.delay);
    g.restore();
  }
}
