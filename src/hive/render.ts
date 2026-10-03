import type { Cam } from "./camera";
import type { HiveData } from "./data";
import { charge, drawMagnet, drawSeat, SEAT_MS, type Spark } from "./fx/electric";
import { DIRS, ax, hexVerts, keyOf, visibleRange, type Point } from "./hex";
import { addPoly, hexFill, type Ctx } from "./paint";
import type { Loose } from "./layout";
import { emptyGaps, heldPose, isLocked, isOpen, loosePoly, stepSnap } from "./sheet";
import { on, type Hive } from "./state";
import { BLUE, C, CYAN, HEX, PINK, rgba } from "./theme";

/** Hole edge vertex pairs, indexed like DIRS, so an edge is drawn only where the neighbour is still solid. */
const EDGE: readonly (readonly [number, number])[] = [
  [0, 1],
  [5, 0],
  [4, 5],
  [3, 4],
  [2, 3],
  [1, 2],
];

/** The name cell glows cyan, cells that open sections pink, single pages blue. */
export function frontStroke(data: HiveData, i: number): string {
  if (i === 0) return rgba(CYAN, 0.6);
  return data.home[i]?.cards ? rgba(PINK, 0.6) : rgba(BLUE, 0.6);
}

/** Screen offset of the world origin for a camera, so world point p lands at p * z + o. */
export function camOrigin(h: Hive, cam: Cam): Point {
  return { x: h.W / 2 - cam.x * cam.z, y: h.H / 2 - cam.y * cam.z };
}

export function spark(h: Hive, now: number): Spark {
  return { DPR: h.DPR, now, electric: on(h, "electric") };
}

/** Plain hexes brighten towards the pointer within a radius that scales with the cell size. */
export function flashAt(h: Hive, p: Point, mw: Point, z: number, live: boolean, radius: number): number {
  const d = live && h.pointer.x > -999 ? Math.hypot(p.x - mw.x, p.y - mw.y) * z : 1e9;
  return Math.max(0, 1 - d / radius) ** 2;
}

/** Hover and focus grow a cell by up to 7% over about four frames; reduced motion jumps straight there. */
export function growOf(h: Hive, key: string, hot: boolean): number {
  const prev = h.grow.get(key) ?? 0;
  const gv = prev + ((hot ? 1 : 0) - prev) * (h.reduced ? 1 : 0.25);
  h.grow.set(key, gv);
  return gv;
}

/** Draws a cell turned by f (0 front, 1 back) around its vertical axis; past halfway it shows its back face. */
export function flipCell(g: Ctx, x: number, y: number, size: number, z: number, f: number, stroke: string): void {
  const cs = Math.cos(Math.PI * f);
  g.save();
  g.translate(x, y);
  g.scale(Math.max(Math.abs(cs), 0.002), 1);
  g.translate(-x, -y);
  if (cs >= 0) hexFill(g, x, y, size, C.cell, stroke, 1.4 / z);
  else hexFill(g, x, y, size, C.flip, rgba(PINK, 0.85), 2.2 / z);
  g.restore();
}

/** Hovered cells draw last so their grown border sits over the neighbours. */
export function hoverLast<T extends { id: string }>(items: readonly T[], hoverKey: string | null): number[] {
  return items.map((_, i) => i).sort((a, b) => Number(items[a]?.id === hoverKey) - Number(items[b]?.id === hoverKey));
}

function drawSheetBase(g: Ctx, h: Hive, cam: Cam): void {
  const F = h.front;
  const o = camOrigin(h, cam);
  g.setTransform(h.DPR, 0, 0, h.DPR, 0, 0);
  g.fillStyle = C.base;
  g.fillRect(0, 0, h.W, h.H);
  g.setTransform(h.DPR * cam.z, 0, 0, h.DPR * cam.z, h.DPR * o.x, h.DPR * o.y);
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  for (const s of emptyGaps(F)) addPoly(g, hexVerts(s.x, s.y, F.R * 1.004));
  g.fill();
  g.globalCompositeOperation = "source-over";
}

function drawPlainHexes(g: Ctx, h: Hive, cam: Cam, live: boolean, now: number): void {
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
function drawHoleEdges(g: Ctx, h: Hive, z: number): void {
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

function drawLoose(g: Ctx, h: Hive, z: number, live: boolean, now: number): void {
  const F = h.front;
  const R = F.R;
  const sp = spark(h, now);
  let held: { l: Loose; m: ReturnType<typeof heldPose> } | null = null;
  for (const [i, l] of F.loose.entries()) {
    stepSnap(F, l, now, h.reduced);
    if (h.drag?.kind === "loose" && h.drag.loose === l) {
      held = { l, m: heldPose(F, l, !h.reduced) };
      continue;
    }
    if (l.seat) {
      hexFill(g, l.ax, l.ay, R * HEX, C.deco, C.line, 1 / z, l.rot);
      continue;
    }
    const hot = live && h.hoverLoose === i && !h.drag;
    g.save();
    g.shadowColor = "rgba(0,0,0,0.65)";
    g.shadowBlur = 14 * h.DPR;
    g.shadowOffsetY = 7 * h.DPR;
    hexFill(g, l.ax, l.ay, R * HEX, C.loose, rgba(BLUE, hot ? 0.85 : 0.5), 1.3 / z, l.rot);
    g.restore();
  }
  if (held) {
    const { l, m } = held;
    if (m) drawMagnet(g, loosePoly(l, R), m.g, m.k, R, z, sp);
    g.save();
    g.shadowColor = "rgba(0,0,0,0.7)";
    g.shadowBlur = 26 * h.DPR;
    g.shadowOffsetY = 14 * h.DPR;
    const stroke = m ? rgba(PINK, 0.6 + 0.4 * m.k) : rgba(BLUE, 0.85);
    hexFill(g, l.ax, l.ay, R * HEX * 1.04, C.loose, stroke, 1.5 / z, l.rot * (m ? 1 - m.k : 1));
    g.restore();
  }
  F.fx = F.fx.filter((f) => now - f.t0 < SEAT_MS);
  for (const f of F.fx) drawSeat(g, f, R, z, sp);
}

export function drawFront(g: Ctx, h: Hive, cam: Cam, live: boolean, now: number): void {
  const F = h.front;
  const z = cam.z;
  const { sec, S, CF } = h.nav;
  drawSheetBase(g, h, cam);
  drawPlainHexes(g, h, cam, live, now);
  drawHoleEdges(g, h, z);
  for (const i of hoverLast(F.powered, h.hoverKey)) {
    const p = F.powered[i];
    if (!p || (sec === i && S > 0)) continue;
    if (CF?.where === "front" && CF.idx === i) {
      flipCell(g, p.x, p.y, F.R * HEX, z, CF.f, frontStroke(h.data, i));
      continue;
    }
    const gv = growOf(h, p.id, live && h.hoverKey === p.id);
    const size = F.R * HEX * (1 + 0.07 * gv);
    hexFill(g, p.x, p.y, size, C.cell, frontStroke(h.data, i), 1.4 / z);
    if (gv > 0.02) charge(g, p.x, p.y, size, z, gv, spark(h, now));
  }
  drawLoose(g, h, z, live, now);
}
