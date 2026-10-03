import type { Cam } from "./camera";
import type { HiveData } from "./data";
import { DIRS, ax, hexVerts, keyOf, visibleRange, type Point } from "./hex";
import { emptyGaps, isLocked, isOpen } from "./sheet";
import type { Hive } from "./state";
import { BLUE, C, CYAN, HEX, PINK, rgba } from "./theme";

export type Ctx = CanvasRenderingContext2D;

/** Hole edge vertex pairs, indexed like DIRS, so an edge is drawn only where the neighbour is still solid. */
const EDGE: readonly (readonly [number, number])[] = [
  [0, 1],
  [5, 0],
  [4, 5],
  [3, 4],
  [2, 3],
  [1, 2],
];

export function addPoly(g: Ctx, v: readonly Point[]): void {
  v.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
  g.closePath();
}

export function hexFill(g: Ctx, x: number, y: number, size: number, fill: string, stroke: string, lw: number, rot = 0) {
  g.beginPath();
  addPoly(g, hexVerts(x, y, size, rot));
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = lw;
  g.lineJoin = "miter";
  g.stroke();
}

/** The name cell glows cyan, cells that open sections pink, single pages blue. */
export function frontStroke(data: HiveData, i: number): string {
  if (i === 0) return rgba(CYAN, 0.6);
  return data.home[i]?.cards ? rgba(PINK, 0.6) : rgba(BLUE, 0.6);
}

/** Screen offset of the world origin for a camera, so world point p lands at p * z + o. */
export function camOrigin(h: Hive, cam: Cam): Point {
  return { x: h.W / 2 - cam.x * cam.z, y: h.H / 2 - cam.y * cam.z };
}

/** Plain hexes brighten towards the pointer within a radius that scales with the cell size. */
export function flashAt(h: Hive, p: Point, mw: Point, z: number, live: boolean, radius: number): number {
  const d = live && h.pointer.x > -999 ? Math.hypot(p.x - mw.x, p.y - mw.y) * z : 1e9;
  return Math.max(0, 1 - d / radius) ** 2;
}

export function drawSheetBase(g: Ctx, h: Hive, cam: Cam): void {
  const F = h.front;
  const z = cam.z;
  const o = camOrigin(h, cam);
  g.setTransform(h.DPR, 0, 0, h.DPR, 0, 0);
  g.fillStyle = C.base;
  g.fillRect(0, 0, h.W, h.H);
  g.setTransform(h.DPR * z, 0, 0, h.DPR * z, h.DPR * o.x, h.DPR * o.y);
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  for (const s of emptyGaps(F)) addPoly(g, hexVerts(s.x, s.y, F.R * 1.004));
  g.fill();
  g.globalCompositeOperation = "source-over";
}

export function drawPlainHexes(g: Ctx, h: Hive, cam: Cam, live: boolean, now: number): void {
  const F = h.front;
  const R = F.R;
  const z = cam.z;
  const o = camOrigin(h, cam);
  const mw = { x: (h.pointer.x - o.x) / z, y: (h.pointer.y - o.y) / z };
  const flR = Math.max(200, R * 2.4);
  const vr = visibleRange(z, o.x, o.y, h.W, h.H, R);
  for (let r = vr.r0; r <= vr.r1; r++) {
    const [q0, q1] = vr.q(r);
    for (let q = q0; q <= q1; q++) {
      const key = keyOf(q, r);
      if (F.content.has(key) || F.gaps.has(key) || F.removed.has(key) || h.pending?.key === key) continue;
      const p = ax(q, r, R);
      const fl = flashAt(h, p, mw, z, live, flR);
      const st = F.shake?.key === key ? now - F.shake.t0 : 1e9;
      const x = st < 320 ? p.x + Math.sin(st / 18) * R * 0.05 * (1 - st / 320) : p.x;
      hexFill(g, x, p.y, R * HEX, C.deco, fl > 0.01 ? rgba(BLUE, 0.1 + 0.4 * fl) : C.line, 1 / z);
      if (isLocked(F, q, r, h.W, h.H)) {
        g.fillStyle = "#2c2656";
        for (const v of hexVerts(x, p.y, R * 0.78)) {
          g.beginPath();
          g.arc(v.x, v.y, 2.2 / z, 0, 7);
          g.fill();
        }
      }
    }
  }
}

/** Each empty slot is rimmed only along edges that border a solid hex, alternating pink and cyan. */
export function drawHoleEdges(g: Ctx, h: Hive, z: number): void {
  const F = h.front;
  g.lineJoin = "miter";
  for (const s of emptyGaps(F)) {
    const v = hexVerts(s.x, s.y, F.R * 0.98);
    DIRS.forEach(([dq, dr], di) => {
      if (isOpen(F, keyOf(s.q + dq, s.r + dr))) return;
      const [e0 = 0, e1 = 0] = EDGE[di] ?? [];
      const a = v[e0];
      const b = v[e1];
      if (!a || !b) return;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.strokeStyle = rgba(di % 2 ? CYAN : PINK, 0.7);
      g.lineWidth = 1.4 / z;
      g.stroke();
    });
  }
}

export function drawFront(g: Ctx, h: Hive, cam: Cam, live: boolean, now: number): void {
  const F = h.front;
  const z = cam.z;
  drawSheetBase(g, h, cam);
  drawPlainHexes(g, h, cam, live, now);
  drawHoleEdges(g, h, z);
  for (const p of F.powered) hexFill(g, p.x, p.y, F.R * HEX, C.cell, frontStroke(h.data, p.idx), 1.4 / z);
  for (const l of F.loose) {
    g.save();
    g.shadowColor = "rgba(0,0,0,0.65)";
    g.shadowBlur = 14 * h.DPR;
    g.shadowOffsetY = 7 * h.DPR;
    hexFill(g, l.ax, l.ay, F.R * HEX, C.loose, rgba(BLUE, 0.5), 1.3 / z, l.rot);
    g.restore();
  }
}
