import { hexVerts, lerpPts, perimeter, type Point } from "../hex";
import type { Slot } from "../layout";
import { clamp, easeOut, hash2, lerp } from "../math";
import { addPoly, type Ctx } from "../paint";
import { AMBER, CYAN, HEX, PINK, rgba } from "../theme";

export interface Spark {
  DPR: number;
  now: number;
  electric: boolean;
}

/** Lightning along a polyline: every point gets a fresh sideways kick each tick so the line crawls instead of sliding. */
export function bolt(
  g: Ctx,
  pts: readonly Point[],
  amp: number,
  z: number,
  tick: number,
  salt: number,
  rgb: string,
  alpha: number,
  closed: boolean,
  DPR: number,
) {
  g.beginPath();
  pts.forEach((p, i) => {
    const end = !closed && (i === 0 || i === pts.length - 1);
    const j = end ? 0 : (hash2(tick * 31 + salt, i) - 0.5) * 2 * amp;
    const n = pts[(i + 1) % pts.length] ?? p;
    const dx = n.x - p.x;
    const dy = n.y - p.y;
    const l = Math.hypot(dx, dy) || 1;
    const x = p.x - (dy / l) * j;
    const y = p.y + (dx / l) * j;
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  });
  if (closed) g.closePath();
  g.save();
  g.lineJoin = "miter";
  g.strokeStyle = rgba(rgb, alpha);
  g.lineWidth = 2 / z;
  g.shadowColor = rgba(rgb, 0.8);
  g.shadowBlur = 7 * DPR;
  g.stroke();
  g.strokeStyle = `rgba(235,230,255,${alpha * 0.7})`;
  g.lineWidth = 0.8 / z;
  g.shadowBlur = 0;
  g.stroke();
  g.restore();
}

/**
 * The hover border is itself the current: a jagged live wire just outside the cell, redrawn about eight times a second, with the odd stronger spike.
 * With electric borders off it falls back to a plain pink outline.
 */
export function charge(g: Ctx, x: number, y: number, size: number, z: number, gv: number, s: Spark): void {
  g.beginPath();
  addPoly(g, hexVerts(x, y, size));
  g.strokeStyle = rgba(CYAN, 0.85 * gv);
  g.lineWidth = 2.2 / z;
  g.stroke();
  const outer = perimeter(hexVerts(x, y, size * (1.03 + 0.08 * gv)), 0.1);
  if (!s.electric) {
    g.beginPath();
    addPoly(g, outer);
    g.strokeStyle = rgba(PINK, gv * 0.8);
    g.lineWidth = 1.8 / z;
    g.stroke();
    return;
  }
  const tick = Math.floor(s.now / 120);
  const spike = hash2(tick, 5) < 0.15 ? 3 : 1;
  bolt(g, outer, size * 0.018 * spike, z, tick, 1, PINK, 0.85 * gv, true, s.DPR);
}

/** While a loose hex is held near an empty slot, the slot lights up and current arcs across the gap. */
export function drawMagnet(
  g: Ctx,
  held: readonly Point[],
  slot: Slot,
  k: number,
  R: number,
  z: number,
  s: Spark,
): void {
  const pulse = 0.6 + 0.4 * Math.sin(s.now / 90);
  const gv = hexVerts(slot.x, slot.y, R * HEX);
  g.save();
  g.beginPath();
  addPoly(g, gv);
  g.strokeStyle = rgba(PINK, 0.9 * k * pulse);
  g.lineWidth = (1.5 + 2 * k) / z;
  g.shadowColor = rgba(PINK, 1);
  g.shadowBlur = 16 * k * s.DPR;
  g.stroke();
  g.restore();
  const tick = Math.floor(s.now / 55);
  if (!s.electric) {
    g.strokeStyle = rgba(CYAN, 0.5 * k);
    g.lineWidth = 1 / z;
    g.beginPath();
    for (let i = 0; i < 6; i += 2) {
      const a = held[i];
      const b = gv[i];
      if (!a || !b) continue;
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
    }
    g.stroke();
    return;
  }
  const n = 2 + Math.round(k * 3);
  for (let j = 0; j < n; j++) {
    const i = Math.floor(hash2(tick, j * 7) * 6);
    const a = held[i];
    const b = gv[i];
    if (a && b)
      bolt(
        g,
        lerpPts(a, b, 8),
        R * 0.06 * (0.5 + k),
        z,
        tick,
        j + 20,
        j % 2 ? CYAN : PINK,
        0.4 + 0.6 * k,
        false,
        s.DPR,
      );
  }
  g.fillStyle = `rgba(235,230,255,${0.8 * k})`;
  for (let j = 0; j < 6; j++) {
    const t = (s.now / 400 + j / 6) % 1;
    const a = held[j];
    if (a) g.fillRect(lerp(a.x, slot.x, t) - 1 / z, lerp(a.y, slot.y, t) - 1 / z, 2 / z, 2 / z);
  }
}

export const SEAT_MS = 650;

/** The seat burst: a flash inside the slot, a ring of light pushed outward, sparks, and a last crackle along the border. */
export function drawSeat(g: Ctx, f: Point & { t0: number }, R: number, z: number, s: Spark): void {
  const p = clamp((s.now - f.t0) / SEAT_MS, 0, 1);
  const e = easeOut(p);
  g.save();
  g.beginPath();
  addPoly(g, hexVerts(f.x, f.y, R * HEX));
  g.clip();
  const gl = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, R);
  gl.addColorStop(0, `rgba(255,235,250,${0.7 * (1 - p)})`);
  gl.addColorStop(0.5, rgba(PINK, 0.45 * (1 - p)));
  gl.addColorStop(1, rgba(CYAN, 0));
  g.fillStyle = gl;
  g.fillRect(f.x - R, f.y - R, R * 2, R * 2);
  g.restore();
  g.beginPath();
  addPoly(g, hexVerts(f.x, f.y, R * (0.95 + 0.8 * e)));
  g.strokeStyle = rgba(CYAN, 0.8 * (1 - p));
  g.lineWidth = (3 * (1 - p) + 0.5) / z;
  g.stroke();
  g.beginPath();
  addPoly(g, hexVerts(f.x, f.y, R * (0.95 + 0.45 * e)));
  g.strokeStyle = rgba(PINK, 0.7 * (1 - p));
  g.lineWidth = 1.5 / z;
  g.stroke();
  g.fillStyle = rgba(AMBER, 1 - p);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + hash2(i, f.t0 | 0);
    const d = R * (0.9 + 0.9 * e);
    g.fillRect(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, 2.5 / z, 2.5 / z);
  }
  if (p < 0.6) charge(g, f.x, f.y, R * HEX, z, 1 - p / 0.6, s);
}
