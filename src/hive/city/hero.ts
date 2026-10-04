import type { Point } from "../hex";
import { clamp, easeOut, hash2, lerp } from "../math";
import { AMBER, CYAN, PINK, rgba } from "../theme";
import { claim } from "./events";
import { bezier, coasterAt, PLAN } from "./plan";
import type { Scene } from "./scene";

type Ctx = CanvasRenderingContext2D;

/** White-gold for the star, the only light warmer than amber. */
const STAR = "255,236,190";
/** Ice blue for the dome's inside weather. */
const ICE = "200,232,255";
/** A flare runs 1.4 s: rays and a halo burst out, and the city's windows brighten in step. */
const FLARE_S = 1.4;

/** Advances the star's flare timer on weather time; returns the flare's brightness, 0 at rest and 1 at its peak. */
export function stepFlare(s: Scene, dt: number): number {
  if (s.flare === null) {
    s.nextFlare -= dt;
    if (s.nextFlare <= 0) {
      if (claim(s.stage, s.weather, FLARE_S)) s.flare = 0;
      else s.nextFlare = 1;
    }
  } else {
    s.flare += dt;
    if (s.flare > FLARE_S) {
      s.flare = null;
      s.nextFlare = 15 + Math.random() * 15;
    }
  }
  s.glow = s.flare === null ? 0 : Math.sin(Math.PI * clamp(s.flare / FLARE_S, 0, 1));
  return s.glow;
}

/** The power star: a white-gold core held in a tilted ring, a steady halo, and on a flare, sweeping rays and an expanding ring of light. */
export function drawStar(g: Ctx, s: Scene, at: Point, t: number, astronaut: (g: Ctx, t: number) => void) {
  const pulse = 0.85 + 0.15 * Math.sin(t * 1.7);
  const halo = g.createRadialGradient(at.x, at.y, 0, at.x, at.y, 70 + 40 * s.glow);
  halo.addColorStop(0, rgba(STAR, 0.35 + 0.4 * s.glow));
  halo.addColorStop(1, rgba(STAR, 0));
  g.fillStyle = halo;
  g.fillRect(at.x - 120, at.y - 120, 240, 240);
  if (s.flare !== null) {
    const k = s.flare / FLARE_S;
    const e = easeOut(k);
    g.save();
    g.translate(at.x, at.y);
    g.rotate(k * 0.8);
    g.strokeStyle = rgba(STAR, 0.5 * (1 - k));
    g.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10;
      g.beginPath();
      g.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
      g.lineTo(Math.cos(a) * (40 + 90 * e), Math.sin(a) * (40 + 90 * e));
      g.stroke();
    }
    g.restore();
    g.strokeStyle = rgba(STAR, 0.6 * (1 - k));
    g.beginPath();
    g.arc(at.x, at.y, 20 + 110 * e, 0, Math.PI * 2);
    g.stroke();
  }
  g.strokeStyle = "#8f93c8";
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(at.x, at.y, 30, 9, -0.3, Math.PI, 0);
  g.stroke();
  const core = g.createRadialGradient(at.x, at.y, 0, at.x, at.y, 15 * pulse);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(0.5, rgba(STAR, 0.95));
  core.addColorStop(1, rgba(AMBER, 0));
  g.fillStyle = core;
  g.beginPath();
  g.arc(at.x, at.y, 15 * pulse, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#a9adda";
  g.beginPath();
  g.ellipse(at.x, at.y, 30, 9, -0.3, 0, Math.PI);
  g.stroke();
  g.fillStyle = rgba(CYAN, 0.9);
  for (const a of [0.4, 1.9, 3.4, 4.9]) g.fillRect(at.x + Math.cos(a) * 30 - 1.5, at.y + Math.sin(a) * 9 - 1.5, 3, 3);
  const ax = at.x + 46 + Math.sin(t * 0.5) * 6;
  const ay = at.y + 18 + Math.cos(t * 0.7) * 5;
  g.strokeStyle = "rgba(200,205,232,0.5)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(at.x + 28, at.y + 3);
  g.quadraticCurveTo(at.x + 38, at.y + 20, ax - 4, ay - 8);
  g.stroke();
  g.save();
  g.translate(ax, ay);
  g.rotate(Math.sin(t * 0.4) * 0.5);
  g.scale(0.9, 0.9);
  astronaut(g, t);
  g.restore();
}

/** The energy beam from the star to the dome's crown, fading out before it reaches the star so parallax never shows a gap. */
export function drawBeam(g: Ctx, s: Scene, star: Point, t: number) {
  const d = PLAN.dome;
  const top = { x: d.x, y: d.y - d.ry };
  const gr = g.createLinearGradient(top.x, top.y, star.x, star.y);
  gr.addColorStop(0, rgba(STAR, 0.45 + 0.4 * s.glow));
  gr.addColorStop(0.7, rgba(STAR, 0));
  g.strokeStyle = gr;
  g.lineWidth = 2 + 2 * s.glow;
  g.beginPath();
  g.moveTo(top.x, top.y);
  g.lineTo(star.x, star.y);
  g.stroke();
  g.fillStyle = rgba(STAR, 0.8);
  for (let i = 0; i < 4; i++) {
    const k = ((t * 0.5 + i / 4) % 1) * 0.65;
    g.fillRect(lerp(top.x, star.x, k) - 1.5, lerp(top.y, star.y, k) - 1.5, 3, 3);
  }
}

function domePath(g: Ctx) {
  const d = PLAN.dome;
  g.beginPath();
  g.ellipse(d.x, d.y, d.rx, d.ry, 0, Math.PI, 0);
  g.closePath();
}

/** The dome's live layer: snow falling inside under a soft blue glow, a shimmer sweeping the barrier, ripples where rain strikes it. */
export function drawDome(g: Ctx, s: Scene, dt: number, raining: boolean) {
  const d = PLAN.dome;
  const t = s.weather;
  g.save();
  domePath(g);
  g.clip();
  const glow = g.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.rx);
  glow.addColorStop(0, rgba(ICE, 0.12 + 0.12 * s.glow));
  glow.addColorStop(1, rgba(ICE, 0));
  g.fillStyle = glow;
  g.fillRect(d.x - d.rx, d.y - d.ry, d.rx * 2, d.ry);
  g.fillStyle = rgba(ICE, 0.8);
  for (let i = 0; i < 45; i++) {
    const fall = (hash2(i, 2) + t * (0.05 + hash2(i, 3) * 0.05)) % 1;
    const x = d.x - d.rx + hash2(i, 1) * d.rx * 2 + Math.sin(t * 0.8 + i) * 6;
    const size = 1 + hash2(i, 4) * 1.4;
    g.fillRect(x, d.y - d.ry + fall * d.ry, size, size);
  }
  g.restore();
  const sweep = (t * 0.35) % Math.PI;
  g.strokeStyle = rgba(CYAN, 0.25 + 0.35 * s.glow);
  g.lineWidth = 2;
  domePath(g);
  g.stroke();
  g.strokeStyle = rgba(ICE, 0.55);
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(d.x, d.y, d.rx, d.ry, 0, Math.PI + sweep, Math.PI + Math.min(Math.PI, sweep + 0.35));
  g.stroke();
  if (raining && Math.random() < dt * 6) {
    const a = Math.PI * (0.12 + Math.random() * 0.76);
    s.ripples.push({ x: d.x + Math.cos(a) * d.rx, y: d.y - Math.sin(a) * d.ry, t: 0 });
  }
  s.ripples = s.ripples.filter((r) => (r.t += dt) < 0.5);
  g.lineWidth = 1;
  for (const r of s.ripples) {
    g.strokeStyle = rgba(CYAN, 0.7 * (1 - r.t / 0.5));
    g.beginPath();
    g.ellipse(r.x, r.y, 3 + r.t * 24, 1 + r.t * 6, 0, 0, Math.PI * 2);
    g.stroke();
  }
}

/** True inside the dome's barrier, where the mid-depth rain must not fall. */
export function inDome(x: number, y: number): boolean {
  const d = PLAN.dome;
  const nx = (x - d.x) / d.rx;
  const ny = (y - d.y) / d.ry;
  return y <= d.y && nx * nx + ny * ny < 1;
}

function portalRing(g: Ctx, p: Point, t: number, bright: number) {
  const glow = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 40);
  glow.addColorStop(0, rgba(CYAN, 0.25 + 0.4 * bright));
  glow.addColorStop(1, rgba(CYAN, 0));
  g.fillStyle = glow;
  g.fillRect(p.x - 40, p.y - 40, 80, 80);
  g.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = rgba(i % 2 ? PINK : CYAN, 0.55);
    const a = t * (2 + i) + i * 2;
    g.beginPath();
    g.ellipse(p.x, p.y, 10 - i * 3, 24 - i * 6, 0, a, a + 2.2);
    g.stroke();
  }
  g.strokeStyle = rgba(PINK, 0.9);
  g.lineWidth = 2.5;
  g.beginPath();
  g.ellipse(p.x, p.y, 14, 30, 0, 0, Math.PI * 2);
  g.stroke();
}

function pod(g: Ctx, p: Point, dir: number, scale: number) {
  g.save();
  g.translate(p.x, p.y);
  g.scale(scale * dir, scale);
  g.fillStyle = "#1d1f4e";
  g.beginPath();
  g.roundRect(-18, -6, 36, 12, 6);
  g.fill();
  g.fillStyle = rgba(CYAN, 0.9);
  for (let x = -12; x < 12; x += 7) g.fillRect(x, -3, 4, 3);
  g.fillStyle = rgba(AMBER, 1);
  g.fillRect(16, -1, 2, 2);
  g.restore();
}

/** A pod flies into the left portal, vanishes, and leaves the right one a beat later, then rests a few seconds before the next run. */
export function drawPortals(g: Ctx, s: Scene, dt: number, t: number) {
  const { a, b } = PLAN.portals;
  const p = s.portal;
  if (p.rest > 0) p.rest -= dt;
  else if ((p.t += dt / 4) >= 1) {
    p.t = 0;
    p.rest = 2 + Math.random() * 3;
  }
  const k = p.rest > 0 ? -1 : p.t;
  const near = k >= 0 && (Math.abs(k - 0.45) < 0.08 || Math.abs(k - 0.55) < 0.08) ? 1 : 0;
  portalRing(g, a, t, k >= 0.37 && k <= 0.5 ? near : 0);
  portalRing(g, b, t, k >= 0.5 && k <= 0.63 ? near : 0);
  if (k < 0) return;
  if (k < 0.45)
    pod(
      g,
      { x: lerp(a.x - 180, a.x, k / 0.45), y: a.y + Math.sin(k * 9) * 3 },
      1,
      1 - Math.max(0, (k - 0.38) / 0.07) * 0.8,
    );
  else if (k > 0.55)
    pod(g, { x: lerp(b.x, b.x + 180, (k - 0.55) / 0.45), y: b.y }, 1, 0.2 + Math.min(1, (k - 0.55) / 0.07) * 0.8);
}

/** Two capsules glide through the vacuum tube, one each way, glowing through the glass. */
export function drawCapsules(g: Ctx, s: Scene, dt: number) {
  s.capsules = s.capsules.map((c) => (c + dt * 0.11) % 1);
  s.capsules.forEach((c, i) => {
    const t = i % 2 ? 1 - c : c;
    const p = bezier(PLAN.tube, t);
    const q = bezier(PLAN.tube, Math.min(1, t + 0.01));
    g.save();
    g.translate(p.x, p.y);
    g.rotate(Math.atan2(q.y - p.y, q.x - p.x));
    g.fillStyle = rgba(CYAN, 0.25);
    g.beginPath();
    g.roundRect(-17, -8, 34, 16, 8);
    g.fill();
    g.fillStyle = "#c6f2ff";
    g.beginPath();
    g.roundRect(-13, -4, 26, 8, 4);
    g.fill();
    g.restore();
  });
}

/** The coaster train: three cars chasing round the helix and the loop, hidden while they pass behind the tower. */
export function drawCoaster(g: Ctx, s: Scene, dt: number) {
  s.coaster = (s.coaster + dt * 0.07) % 1;
  const c = PLAN.cylinder;
  for (let k = 0; k < 3; k++) {
    const t = s.coaster - k * 0.012;
    const p = coasterAt(t);
    if (p.side < -0.15 && Math.abs(p.x - c.x) < c.r + 2) continue;
    const q = coasterAt(t + 0.004);
    g.save();
    g.translate(p.x, p.y);
    g.rotate(Math.atan2(q.y - p.y, q.x - p.x));
    g.fillStyle = k === 0 ? rgba(PINK, 0.95) : "#2a2d74";
    g.fillRect(-6, -6, 12, 6);
    g.fillStyle = rgba(CYAN, 0.9);
    g.fillRect(-4, -5, 3, 2);
    g.fillRect(1, -5, 3, 2);
    g.restore();
  }
}

/** Floating hex platforms over the twin towers and the dome, bobbing, their corner lights blinking in turn. */
export function drawPlatforms(g: Ctx, t: number, moving: boolean) {
  PLAN.platforms.forEach((p, n) => {
    const ph = n * 2;
    const x = p.x + (moving ? Math.sin(t * 0.25 + ph) * 10 : 0);
    const y = p.y + (moving ? Math.sin(t * 0.6 + ph) * 6 : 0);
    const top = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i;
      return { x: x + (Math.cos(a) * p.w) / 2, y: y + Math.sin(a) * p.w * 0.14 };
    });
    const glow = g.createRadialGradient(x, y + 18, 0, x, y + 18, p.w * 0.7);
    glow.addColorStop(0, rgba(CYAN, 0.3));
    glow.addColorStop(1, rgba(CYAN, 0));
    g.fillStyle = glow;
    g.fillRect(x - p.w, y - 10, p.w * 2, p.w);
    g.fillStyle = "#0d0e2c";
    g.beginPath();
    const [t0, t1, t2, t3] = top;
    if (t0 && t1 && t2 && t3) {
      g.moveTo(t0.x, t0.y);
      for (const v of [t0, t1, t2, t3]) g.lineTo(v.x, v.y + 9);
      g.lineTo(t3.x, t3.y);
      g.fill();
    }
    g.beginPath();
    top.forEach((v, i) => (i ? g.lineTo(v.x, v.y) : g.moveTo(v.x, v.y)));
    g.closePath();
    g.fillStyle = "#1e1f52";
    g.fill();
    g.strokeStyle = rgba(CYAN, 0.6);
    g.lineWidth = 1.2;
    g.stroke();
    top.forEach((v, i) => {
      if (moving && Math.floor(t * 1.5 + i) % 2 !== 0) return;
      g.fillStyle = rgba(AMBER, 0.95);
      g.fillRect(v.x - 1.5, v.y - 1.5, 3, 3);
    });
  });
}
