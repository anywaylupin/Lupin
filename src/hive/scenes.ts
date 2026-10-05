import { astronaut, bee } from "./figures";
import { hash2 } from "./math";
import { AMBER, PINK, rgba } from "./theme";

type Ctx = CanvasRenderingContext2D;

/**
 * Small animated vignettes that head a page when a cell flips into it.
 * Each draws into a w by h box from the origin, with `t` in seconds; reduced motion passes a fixed `t` for a still frame.
 */
export type SceneKind = "rooftop" | "hive" | "orbit" | "lanterns" | "dusk";

function sky(g: Ctx, w: number, h: number, top: string, bottom: string) {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, top);
  gr.addColorStop(1, bottom);
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(220,220,255,0.5)";
  for (let i = 0; i < 24; i++) g.fillRect(hash2(i, 1) * w, hash2(i, 2) * h * 0.6, 1, 1);
}

function skyline(g: Ctx, w: number, h: number, base: number, color: string) {
  g.fillStyle = color;
  for (let x = 0, i = 0; x < w; i++) {
    const bw = 14 + hash2(i, 9) * 26;
    const bh = 10 + hash2(i, 7) * base;
    g.fillRect(x, h - bh, bw, bh);
    x += bw + 2;
  }
}

function hex(g: Ctx, x: number, y: number, r: number) {
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.closePath();
}

function at(g: Ctx, x: number, y: number, s: number, draw: () => void, flip = false) {
  g.save();
  g.translate(x, y);
  g.scale(flip ? -s : s, s);
  draw();
  g.restore();
}

/** A three-tier pagoda silhouette standing on (x, y), its eaves tipped up and edged in pink. */
function pagoda(g: Ctx, x: number, y: number, u: number) {
  for (let i = 0; i < 3; i++) {
    const w = u * (1.4 - i * 0.3);
    const top = y - u * (0.9 + i * 0.95);
    g.fillStyle = "#0b0a20";
    g.fillRect(x - w * 0.55, top, w * 1.1, u);
    g.beginPath();
    g.moveTo(x - w * 1.1, top - u * 0.15);
    g.quadraticCurveTo(x - w * 0.5, top + u * 0.05, x, top - u * 0.5);
    g.quadraticCurveTo(x + w * 0.5, top + u * 0.05, x + w * 1.1, top - u * 0.15);
    g.lineTo(x + w * 0.6, top + u * 0.08);
    g.lineTo(x - w * 0.6, top + u * 0.08);
    g.closePath();
    g.fill();
    g.strokeStyle = rgba(PINK, 0.8);
    g.lineWidth = 1;
    g.stroke();
  }
  g.fillStyle = rgba(AMBER, 0.9);
  g.fillRect(x - 0.5, y - u * 3.6, 1, u * 0.7);
}

/** A sky lantern: a warm paper box with a brighter flame at its foot. */
function lantern(g: Ctx, x: number, y: number, r: number, a: number) {
  const glow = g.createRadialGradient(x, y, 0, x, y, r * 3);
  glow.addColorStop(0, rgba(AMBER, 0.45 * a));
  glow.addColorStop(1, rgba(AMBER, 0));
  g.fillStyle = glow;
  g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  g.fillStyle = rgba(AMBER, 0.9 * a);
  g.fillRect(x - r * 0.7, y - r, r * 1.4, r * 2);
  g.fillStyle = `rgba(255,236,190,${a})`;
  g.fillRect(x - r * 0.3, y + r * 0.5, r * 0.6, r * 0.5);
}

function honeycomb(g: Ctx, cx: number, cy: number, r: number, fill: (i: number) => number) {
  let i = 0;
  for (let row = -1; row <= 1; row++) {
    for (let col = -2; col <= 2; col++) {
      const x = cx + col * r * 1.74 + (row % 2 ? r * 0.87 : 0);
      const y = cy + row * r * 1.5;
      hex(g, x, y, r * 0.92);
      g.fillStyle = rgba(AMBER, 0.15 + 0.6 * fill(i++));
      g.fill();
      g.strokeStyle = rgba(AMBER, 0.7);
      g.lineWidth = 1;
      g.stroke();
    }
  }
}

/** Draws one vignette; every kind fills its whole box, so it can sit behind text or inside a hex. */
export function drawScene(g: Ctx, kind: SceneKind, w: number, h: number, t: number): void {
  const s = h / 90;
  if (kind === "rooftop") {
    sky(g, w, h, "#05061a", "#2a1257");
    skyline(g, w, h, h * 0.45, "#120f34");
    g.fillStyle = "#0b0a20";
    g.fillRect(w * 0.55, h * 0.72, w * 0.3, h * 0.28);
    g.fillStyle = rgba(PINK, 0.85);
    g.fillRect(w * 0.55, h * 0.72, w * 0.3, 1.5);
    pagoda(g, w * 0.7, h * 0.72, 18 * s);
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.12 + i / 3) % 1;
      lantern(g, w * (0.2 + 0.25 * i) + Math.sin(t + i) * 4 * s, h * (0.8 - 0.7 * k), 3 * s, 1 - k);
    }
  } else if (kind === "hive") {
    sky(g, w, h, "#07051a", "#1a0f36");
    honeycomb(g, w / 2, h / 2, 13 * s, (i) => (i === 7 ? Math.sin(t * 1.5) * 0.5 + 0.5 : hash2(i, 3) > 0.4 ? 1 : 0.1));
    for (let i = 0; i < 4; i++) {
      const a = t * (0.8 + i * 0.2) + i * 1.6;
      at(
        g,
        w / 2 + Math.cos(a) * w * 0.32,
        h / 2 + Math.sin(a * 1.3) * h * 0.3,
        1.4 * s,
        () => bee(g, t, i),
        Math.sin(a) > 0,
      );
    }
  } else if (kind === "orbit") {
    sky(g, w, h, "#03041a", "#0f0d3a");
    const cx = w * 0.3;
    const cy = h * 0.5;
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, 30 * s);
    core.addColorStop(0, "rgba(255,255,255,1)");
    core.addColorStop(0.3, "rgba(255,236,190,0.8)");
    core.addColorStop(1, "rgba(255,236,190,0)");
    g.fillStyle = core;
    g.fillRect(cx - 40 * s, cy - 40 * s, 80 * s, 80 * s);
    g.strokeStyle = "#8f93c8";
    g.lineWidth = 1.5;
    g.beginPath();
    g.ellipse(cx, cy, 34 * s, 10 * s, -0.3, 0, Math.PI * 2);
    g.stroke();
    const ax = w * 0.62 + Math.sin(t * 0.6) * 10 * s;
    const ay = h * 0.55 + Math.cos(t * 0.8) * 8 * s;
    g.strokeStyle = "rgba(200,205,232,0.5)";
    g.beginPath();
    g.moveTo(cx + 30 * s, cy);
    g.quadraticCurveTo((cx + ax) / 2, cy + 30 * s, ax, ay - 10 * s);
    g.stroke();
    at(g, ax, ay, 1.8 * s, () => astronaut(g, t));
  } else if (kind === "lanterns") {
    sky(g, w, h, "#05061a", "#2a1052");
    skyline(g, w, h, h * 0.3, "#120f34");
    pagoda(g, w * 0.22, h, 22 * s);
    for (let i = 0; i < 9; i++) {
      const k = (t * (0.05 + hash2(i, 4) * 0.05) + hash2(i, 5)) % 1;
      const x = w * hash2(i, 6) + Math.sin(t * 0.8 + i) * 6 * s;
      lantern(g, x, h * (1.05 - 1.2 * k), (2.4 + hash2(i, 7) * 2) * s, Math.min(1, (1 - k) * 2));
    }
  } else if (kind === "dusk") {
    const k = Math.sin(t * 0.25) * 0.5 + 0.5;
    sky(g, w, h, "#060820", k > 0.5 ? "#5a1d66" : "#7a4a2a");
    const sx = w * (0.15 + 0.7 * k);
    const sy = h * (0.75 - Math.sin(Math.PI * k) * 0.45);
    const sun = g.createRadialGradient(sx, sy, 0, sx, sy, 22 * s);
    sun.addColorStop(0, rgba(k > 0.5 ? PINK : AMBER, 0.95));
    sun.addColorStop(1, rgba(k > 0.5 ? PINK : AMBER, 0));
    g.fillStyle = sun;
    g.fillRect(sx - 30 * s, sy - 30 * s, 60 * s, 60 * s);
    skyline(g, w, h, h * 0.4, "#0e0b2a");
  }
}
