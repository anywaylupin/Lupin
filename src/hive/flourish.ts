import { bee } from "./figures";
import { DIRS, hexVerts, keyOf, type Point } from "./hex";
import type { Loose } from "./layout";
import { clamp, easeOut, hash2 } from "./math";
import { addPoly, type Ctx } from "./paint";
import { emptyGaps, glassSlots, isOpen } from "./sheet";
import { lowGraphics, on, type Hive } from "./state";
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

/**
 * Glass hexes: a faint cyan tint with a bright rim, a streak of light that sweeps across each pane on its own rhythm, and raindrops sliding down while it rains.
 * Low graphics keeps only the tint and the rim.
 */
export function drawGlass(g: Ctx, h: Hive, z: number, now: number): void {
  const F = h.front;
  if (!F.glass.size) return;
  const t = h.reduced ? 0 : now / 1000;
  const rich = !lowGraphics(h);
  const rain = on(h, "weather");
  for (const s of glassSlots(F)) {
    const v = hexVerts(s.x, s.y, F.R * 0.98);
    g.save();
    g.beginPath();
    addPoly(g, v);
    g.fillStyle = rgba(CYAN, 0.07);
    g.fill();
    g.strokeStyle = "rgba(210,240,255,0.55)";
    g.lineWidth = 1.6 / z;
    g.stroke();
    if (rich) {
      g.clip();
      const seed = hash2(s.q * 13, s.r * 7);
      const k = ((t * 0.2 + seed) % 1.6) - 0.3;
      const x = s.x - F.R + k * F.R * 2.4;
      const sweep = g.createLinearGradient(x - F.R * 0.3, s.y - F.R, x + F.R * 0.3, s.y + F.R);
      sweep.addColorStop(0, "rgba(255,255,255,0)");
      sweep.addColorStop(0.5, "rgba(230,248,255,0.16)");
      sweep.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = sweep;
      g.fillRect(s.x - F.R, s.y - F.R, F.R * 2, F.R * 2);
      g.strokeStyle = "rgba(255,255,255,0.18)";
      g.lineWidth = 2 / z;
      g.beginPath();
      g.moveTo(s.x - F.R * 0.55, s.y - F.R * 0.35);
      g.lineTo(s.x - F.R * 0.2, s.y - F.R * 0.7);
      g.stroke();
      if (rain) {
        g.fillStyle = "rgba(200,235,255,0.5)";
        for (let i = 0; i < 7; i++) {
          const period = 2 + hash2(i, seed * 100) * 3;
          const fall = ((t + hash2(seed * 50, i) * period) % period) / period;
          const dx = (hash2(i, s.q + s.r * 31) - 0.5) * F.R * 1.4;
          const dy = -F.R + fall * F.R * 2;
          g.beginPath();
          g.ellipse(s.x + dx, s.y + dy, 1.6 / z, (2.4 + fall * 3) / z, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
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
