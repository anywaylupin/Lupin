import type { Rand } from "../math";
import { AMBER, CYAN, PINK, rgba } from "../theme";
import { facade, STYLE, type BlockStyle, type Ledge } from "./block";
import { CH, type Ctx2D, type Win } from "./board";
import { PLAN } from "./plan";

/** Garden green for terraces, the one colour outside the palette, kept dim so it reads as planting rather than neon. */
const GARDEN = "120,230,190";

interface Out {
  wins: Win[];
  ledges: Ledge[];
}

function line(g: Ctx2D, x0: number, y0: number, x1: number, y1: number) {
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
}

/** Two towers joined by a skybridge; the right one is still being built, bare frame above `builtTo` with a crane mast on top. */
export function twinTowers(g: Ctx2D, rand: Rand, out: Out) {
  const t = PLAN.twin;
  const o = STYLE.mid;
  const [wa = 70, wb = 62] = t.w;
  const [ta = 250, tb = 300] = t.tops;
  const bx = t.x + wa + t.gap;
  facade(g, t.x, ta, wa, o, rand, out.wins);
  g.fillStyle = o.top;
  g.fillRect(t.x + 10, ta - 18, wa - 20, 18);
  g.fillRect(t.x + 22, ta - 30, wa - 44, 12);
  g.fillStyle = rgba(CYAN, 0.6);
  g.fillRect(t.x + wa / 2 - 1, ta - 70, 2, 40);
  facade(g, bx, t.builtTo, wb, o, rand, out.wins);
  g.strokeStyle = "#3a3d82";
  g.lineWidth = 2;
  for (const x of [bx + 2, bx + wb / 2, bx + wb - 2]) line(g, x, tb, x, t.builtTo);
  for (let y = tb; y < t.builtTo; y += 22) line(g, bx, y, bx + wb, y);
  g.lineWidth = 1;
  for (let y = tb; y < t.builtTo - 22; y += 22) line(g, bx, y, bx + wb / 2, y + 22);
  const mx = bx + wb - 14;
  g.strokeStyle = "#4a4e9a";
  line(g, mx, t.craneTop, mx, tb);
  line(g, mx + 8, t.craneTop, mx + 8, tb);
  for (let y = t.craneTop; y < tb; y += 10) line(g, mx, y, mx + 8, y + 10);
  g.fillStyle = "#262a6e";
  g.fillRect(t.x + wa, t.bridgeY, t.gap, 16);
  g.fillStyle = rgba(CYAN, 0.7);
  g.fillRect(t.x + wa + 3, t.bridgeY + 5, t.gap - 6, 4);
  g.fillStyle = rgba(PINK, 0.55);
  g.fillRect(t.x + wa, t.bridgeY + 15, t.gap, 1.5);
  out.ledges.push({ x0: t.x, x1: t.x + wa, y: ta - 30 }, { x0: t.x + wa, x1: bx, y: t.bridgeY });
}

/** A stepped arcology: four terraces narrowing upward, each planted along its edge. */
export function arcology(g: Ctx2D, rand: Rand, out: Out) {
  const a = PLAN.arcology;
  const o = STYLE.nearmid;
  for (let i = 0; i < 4; i++) {
    const w = a.w * (1 - i * 0.22);
    const x = a.x + (a.w - w) / 2;
    const top = a.top + (3 - i) * 58;
    facade(g, x, top, w, o, rand, out.wins);
    g.fillStyle = rgba(GARDEN, 0.45);
    g.fillRect(x, top, w, 2);
    for (let tx = x + 8; tx < x + w - 8; tx += 14 + rand() * 10) {
      g.fillStyle = "#1c4a48";
      g.beginPath();
      g.arc(tx, top - 4, 4 + rand() * 3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = rgba(GARDEN, 0.35);
      g.fillRect(tx - 1, top - 7, 2, 2);
    }
    out.ledges.push({ x0: x, x1: x + w, y: top });
  }
}

/** A round tower: shaded across its width to read as a cylinder, with lit ring balconies and a domed cap. */
export function cylinder(g: Ctx2D, out: Out) {
  const c = PLAN.cylinder;
  const sh = g.createLinearGradient(c.x - c.r, 0, c.x + c.r, 0);
  sh.addColorStop(0, "#0b0c28");
  sh.addColorStop(0.55, "#2c2f7c");
  sh.addColorStop(1, "#0b0c28");
  g.fillStyle = sh;
  g.fillRect(c.x - c.r, c.top, c.r * 2, CH - c.top);
  g.beginPath();
  g.ellipse(c.x, c.top, c.r, c.r * 0.7, 0, Math.PI, 0);
  g.fill();
  g.fillStyle = rgba(PINK, 0.8);
  g.fillRect(c.x - 1, c.top - c.r * 0.7 - 34, 2, 34);
  for (let y = c.top + 30; y < CH; y += 46) {
    g.fillStyle = "#090a22";
    g.beginPath();
    g.ellipse(c.x, y, c.r + 8, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = rgba(CYAN, 0.5);
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(c.x, y, c.r + 8, 5, 0, 0, Math.PI);
    g.stroke();
    for (let k = -2; k <= 2; k++)
      out.wins.push({ x: c.x + k * 12 - 2, y: y + 12, w: 4, h: 14, c: k % 2 ? CYAN : AMBER, on: k !== 0 });
  }
}

/** A block whose upper floors overhang its base, carried on diagonal struts, with an amber strip under the overhang. */
export function cantilever(g: Ctx2D, rand: Rand, out: Out) {
  const k = STYLE.nearmid;
  const c = PLAN.cantilever;
  const split = c.top + 92;
  facade(g, c.x + c.w * 0.36, split, c.w * 0.64, k, rand, out.wins);
  facade(g, c.x, c.top, c.w * 0.86, k, rand, out.wins, split);
  g.fillStyle = rgba(AMBER, 0.6);
  g.fillRect(c.x, split - 2, c.w * 0.36, 2);
  g.strokeStyle = "#2a2c6a";
  g.lineWidth = 3;
  line(g, c.x + c.w * 0.36, split + 70, c.x + 8, split);
  line(g, c.x + c.w * 0.36, split + 30, c.x + c.w * 0.16, split);
  out.ledges.push({ x0: c.x, x1: c.x + c.w * 0.86, y: c.top });
}

function eave(g: Ctx2D, cx: number, y: number, w: number) {
  g.beginPath();
  g.moveTo(cx - w / 2 - 10, y - 8);
  g.quadraticCurveTo(cx - w / 2, y + 4, cx - w / 2 + 14, y + 4);
  g.lineTo(cx + w / 2 - 14, y + 4);
  g.quadraticCurveTo(cx + w / 2, y + 4, cx + w / 2 + 10, y - 8);
  g.lineTo(cx + w / 3, y - 18);
  g.lineTo(cx - w / 3, y - 18);
  g.closePath();
}

/** A cyber pagoda: stacked roofs with upturned neon eaves and hanging lanterns; the Mandarin signs hang on it live. */
export function pagoda(g: Ctx2D, rand: Rand, out: Out) {
  const p = PLAN.pagoda;
  const cx = p.x + p.w / 2;
  facade(g, p.x + p.w * 0.2, p.top + 20, p.w * 0.6, STYLE.nearmid, rand, out.wins);
  for (let i = 0; i < 4; i++) {
    const y = p.top + 20 + i * 62;
    const w = p.w * (0.55 + i * 0.15);
    g.fillStyle = "#1a1240";
    eave(g, cx, y, w);
    g.fill();
    g.strokeStyle = rgba(PINK, 0.85);
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = rgba(AMBER, 0.9);
    for (const sx of [-1, 1]) g.fillRect(cx + sx * (w / 2 - 4) - 2, y + 8, 4, 6);
    out.ledges.push({ x0: cx - w / 3, x1: cx + w / 3, y: y - 18 });
  }
  g.strokeStyle = rgba(AMBER, 0.8);
  line(g, cx, p.top - 40, cx, p.top + 2);
  for (let y = p.top - 34; y < p.top; y += 9) line(g, cx - 4, y, cx + 4, y);
}

/** A low block bristling with masts and dishes, kept short so the dome above it stays clear. */
export function antennaFarm(g: Ctx2D, rand: Rand, out: Out) {
  const a = PLAN.antennas;
  facade(g, a.x, a.top, a.w, STYLE.nearmid, rand, out.wins);
  g.strokeStyle = "#2b2d6a";
  g.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const x = a.x + 14 + (i * (a.w - 28)) / 4;
    const h = 30 + rand() * 50;
    line(g, x, a.top, x, a.top - h);
    g.fillStyle = rgba(PINK, 0.9);
    g.fillRect(x - 1.5, a.top - h - 3, 3, 3);
  }
  g.strokeStyle = rgba(CYAN, 0.6);
  g.lineWidth = 1.5;
  for (const [x, r] of [
    [a.x + 40, 14],
    [a.x + a.w - 44, 18],
  ] as const) {
    g.beginPath();
    g.ellipse(x, a.top - 12, r, r * 0.45, -0.5, 0, Math.PI);
    g.stroke();
  }
  out.ledges.push({ x0: a.x, x1: a.x + a.w, y: a.top });
}

/** A megastructure whose windows are hexagons, echoing the hive in front of the city. */
export function megastructure(g: Ctx2D, rand: Rand) {
  const m = PLAN.mega;
  const o: BlockStyle = { ...STYLE.nearmid, strip: 0, lit: 0, pad: m.w };
  facade(g, m.x, m.top, m.w, o, rand, null);
  const s = 8;
  for (let row = 0; m.top + 20 + row * s * 1.5 < CH; row++) {
    const y = m.top + 20 + row * s * 1.5;
    for (let x = m.x + 12 + (row % 2) * s * 0.87; x < m.x + m.w - 12; x += s * 1.74) {
      g.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = (Math.PI / 3) * k - Math.PI / 6;
        g.lineTo(x + Math.cos(ang) * s * 0.8, y + Math.sin(ang) * s * 0.8);
      }
      g.closePath();
      const r = rand();
      if (r < 0.3) {
        g.fillStyle = rgba(r < 0.12 ? PINK : r < 0.24 ? CYAN : AMBER, 0.5);
        g.fill();
      }
      g.strokeStyle = rgba(CYAN, 0.18);
      g.lineWidth = 0.8;
      g.stroke();
    }
  }
}

/** The dome's podium and glass, baked: the cold interior, its small garden towers and the hex facets; shimmer and snow are drawn live. */
export function dome(g: Ctx2D, rand: Rand, out: Out) {
  const d = PLAN.dome;
  facade(g, d.x - d.rx - 24, d.y, d.rx * 2 + 48, STYLE.mid, rand, out.wins);
  g.save();
  g.beginPath();
  g.ellipse(d.x, d.y, d.rx, d.ry, 0, Math.PI, 0);
  g.closePath();
  g.clip();
  const inside = g.createLinearGradient(0, d.y - d.ry, 0, d.y);
  inside.addColorStop(0, "#0e2f55");
  inside.addColorStop(1, "#16457a");
  g.fillStyle = inside;
  g.fillRect(d.x - d.rx, d.y - d.ry, d.rx * 2, d.ry);
  for (let i = 0; i < 7; i++) {
    const x = d.x - d.rx + 30 + i * 40 + rand() * 10;
    const h = 30 + rand() * 60 + (i === 3 ? 30 : 0);
    g.fillStyle = "#0b2444";
    g.fillRect(x, d.y - h, 22, h);
    g.fillStyle = rgba(CYAN, 0.55);
    for (let wy = d.y - h + 6; wy < d.y - 4; wy += 9) g.fillRect(x + 5, wy, 12, 2);
  }
  g.strokeStyle = rgba(CYAN, 0.16);
  g.lineWidth = 1;
  const s = 26;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 13; col++) {
      const x = d.x - d.rx + col * s * 0.87 * 2 + (row % 2) * s * 0.87;
      const y = d.y - row * s * 1.5;
      g.beginPath();
      for (let k = 0; k < 6; k++)
        g.lineTo(x + Math.cos((Math.PI / 3) * k + Math.PI / 6) * s, y + Math.sin((Math.PI / 3) * k + Math.PI / 6) * s);
      g.closePath();
      g.stroke();
    }
  }
  g.restore();
  g.strokeStyle = rgba(CYAN, 0.7);
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(d.x, d.y, d.rx, d.ry, 0, Math.PI, 0);
  g.stroke();
  out.ledges.push({ x0: d.x - d.rx - 24, x1: d.x - d.rx, y: d.y }, { x0: d.x + d.rx, x1: d.x + d.rx + 24, y: d.y });
}
