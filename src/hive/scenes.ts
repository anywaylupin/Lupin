import { astronaut, bee, cloud, runner, wukong } from "./city/figures";
import { hash2 } from "./math";
import { AMBER, CYAN, PINK, rgba } from "./theme";

type Ctx = CanvasRenderingContext2D;

/**
 * Small animated vignettes: page headers when a cell flips into its page, and secrets behind a few plain hexes.
 * Each draws into a w by h box from the origin, with `t` in seconds; reduced motion passes a fixed `t` for a still frame.
 */
export type SceneKind = "rooftop" | "hive" | "orbit" | "swing" | "dusk" | "nap" | "nest";

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
    at(g, w * 0.7, h * 0.72, 1.6 * s, () => wukong(g, t, 0));
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
  } else if (kind === "swing") {
    sky(g, w, h, "#05061a", "#2a1052");
    g.fillStyle = "#120f34";
    g.fillRect(w * 0.12, h * 0.15, w * 0.08, h);
    g.fillRect(w * 0.8, h * 0.25, w * 0.08, h);
    const a = Math.sin(t * 1.4) * 0.9;
    const ax = w * 0.5;
    const len = h * 0.6;
    const hx = ax + Math.sin(a) * len;
    const hy = Math.cos(a) * len;
    g.strokeStyle = "rgba(200,240,255,0.7)";
    g.beginPath();
    g.moveTo(ax, 0);
    g.lineTo(hx, hy);
    g.stroke();
    g.save();
    g.translate(hx, hy + 16 * s);
    g.rotate(-a * 0.6);
    g.scale(1.6 * s, 1.6 * s);
    runner(g, t);
    g.restore();
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
  } else if (kind === "nap") {
    g.fillStyle = "#0e0b2a";
    g.fillRect(0, 0, w, h);
    at(g, w * 0.5, h * 0.62, 1.2 * s, () => cloud(g, t));
    at(g, w * 0.5, h * 0.6, 1.1 * s, () => {
      g.rotate(-Math.PI / 2.2);
      wukong(g, t * 0.2, 0);
    });
    g.fillStyle = rgba(CYAN, 0.8);
    g.font = `${10 * s}px monospace`;
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.4 + i / 3) % 1;
      g.globalAlpha = 1 - k;
      g.fillText("z", w * 0.62 + k * 14 * s, h * 0.45 - k * 26 * s);
    }
    g.globalAlpha = 1;
  } else {
    g.fillStyle = "#120a26";
    g.fillRect(0, 0, w, h);
    honeycomb(g, w / 2, h / 2, 12 * s, (i) => (hash2(i, 5) > 0.3 ? 1 : 0.2));
    for (let i = 0; i < 3; i++) {
      at(g, w / 2 + Math.sin(t * 0.7 + i * 2) * w * 0.25, h / 2 + Math.cos(t * 0.5 + i) * h * 0.2, 1.3 * s, () =>
        bee(g, t, i),
      );
    }
  }
}
