import type { Point } from "../hex";
import { clamp, hash2, lerp } from "../math";
import { AMBER, CYAN, PINK, rgba } from "../theme";
import { CH, CW, type Win } from "./board";
import { glitchLayer, glitching, type GlitchTimer } from "./glitch";
import type { Layer } from "./layers";
import type { Drone, Platform, Rail, Scene, Sign } from "./scene";
import { drawBolt, drawBoom, drawRain } from "./weather";

type Ctx = CanvasRenderingContext2D;

/** What one frame of the city needs to know; flags already fold in reduced motion. */
export interface CityFrame {
  dt: number;
  now: number;
  clock: number;
  life: boolean;
  weather: boolean;
  glitch: boolean;
  reduced: boolean;
  DPR: number;
  zh: string;
}

export interface City {
  layers: Layer[];
  wins: { mid: Win[]; nearmid: Win[] };
  scene: Scene;
  glitch: GlitchTimer;
}

/** About 3% of windows change state per second, so the skyline breathes without blinking. */
function toggleWindows(list: Win[], dt: number): void {
  const n = list.length * dt * 0.03;
  const count = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
  for (let i = 0; i < count; i++) {
    const w = list[(Math.random() * list.length) | 0];
    if (w) w.on = !w.on;
  }
}

function drawWindows(g: Ctx, list: readonly Win[], alpha: number): void {
  for (const col of [CYAN, PINK, AMBER]) {
    g.fillStyle = rgba(col, alpha);
    for (const w of list) if (w.on && w.c === col) g.fillRect(w.x, w.y, w.w, w.h);
  }
}

function drawLanes(g: Ctx, s: Scene, k: number, f: CityFrame): void {
  const span = CW + 240;
  const t = f.life ? f.clock : 0;
  for (const l of s.lanes) {
    if (l.k !== k) continue;
    g.fillStyle = rgba(l.c, 0.9);
    for (let i = 0; i < l.n; i++) {
      const x = ((i * span) / l.n + hash2(i, l.y) * 30 + t * l.speed * l.dir) % span;
      const xx = (x < 0 ? x + span : x) - 120;
      g.fillRect(xx, l.y, l.size * 3, l.size);
      g.globalAlpha = 0.35;
      g.fillRect(xx - l.dir * l.size * 6, l.y, l.size * 6, l.size);
      g.globalAlpha = 1;
    }
  }
}

function drawPlatform(g: Ctx, p: Platform, f: CityFrame): void {
  const lv = f.life;
  const x = p.x + (lv ? Math.sin(f.clock * 0.25 + p.ph) * 10 : 0);
  const y = p.y + (lv ? Math.sin(f.clock * 0.6 + p.ph) * 6 : 0);
  const w = p.w;
  const glow = g.createRadialGradient(x, y + 18, 0, x, y + 18, w * 0.7);
  glow.addColorStop(0, rgba(CYAN, 0.3));
  glow.addColorStop(1, rgba(CYAN, 0));
  g.fillStyle = glow;
  g.fillRect(x - w, y - 10, w * 2, w);
  const top = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return { x: x + (Math.cos(a) * w) / 2, y: y + Math.sin(a) * w * 0.14 };
  });
  g.fillStyle = "#0d0e2c";
  g.beginPath();
  const [t0, t1, t2, t3] = top;
  if (t0 && t1 && t2 && t3) {
    g.moveTo(t0.x, t0.y);
    for (const v of [t0, t1, t2, t3]) g.lineTo(v.x, v.y + 9);
    g.lineTo(t3.x, t3.y);
    g.closePath();
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
    if (lv && Math.floor(f.clock * 1.5 + i) % 2 !== 0) return;
    g.fillStyle = rgba(AMBER, 0.95);
    g.fillRect(v.x - 1.5, v.y - 1.5, 3, 3);
  });
}

function railPoint(r: Rail, t: number): Point {
  return { x: lerp(r.a.x, r.b.x, t), y: lerp(r.a.y, r.b.y, t) + Math.sin(t * Math.PI) * r.sag };
}

/** A sagging monorail with pylons; pods leave every three to seven seconds in either direction. */
function drawRail(g: Ctx, r: Rail, f: CityFrame): void {
  g.strokeStyle = "#24245a";
  g.lineWidth = 4 * r.scale;
  g.beginPath();
  for (let t = 0; t <= 1.001; t += 0.05) {
    const p = railPoint(r, t);
    if (t) g.lineTo(p.x, p.y);
    else g.moveTo(p.x, p.y);
  }
  g.stroke();
  g.fillStyle = "#14143a";
  for (let t = 0.08; t < 1; t += 0.14) {
    const p = railPoint(r, t);
    g.fillRect(p.x - 3 * r.scale, p.y, 6 * r.scale, CH - p.y);
  }
  g.fillStyle = rgba(CYAN, 0.4);
  for (let t = 0; t <= 1; t += 0.02) {
    const p = railPoint(r, t);
    g.fillRect(p.x - 1, p.y - 3 * r.scale, 2, 2);
  }
  if (f.life) {
    r.next -= f.dt;
    if (r.next <= 0) {
      r.pods.push({ t: 0, dir: Math.random() < 0.5 ? 1 : -1 });
      r.next = 3 + Math.random() * 4;
    }
  }
  const len = Math.hypot(r.b.x - r.a.x, r.b.y - r.a.y);
  r.pods = r.pods.filter((pd) => pd.t <= 1);
  for (const pd of r.pods) {
    if (f.life) pd.t += (r.speed * f.dt) / len;
    const t = pd.dir > 0 ? pd.t : 1 - pd.t;
    const p = railPoint(r, t);
    const q = railPoint(r, clamp(t + 0.01, 0, 1));
    const s = r.scale;
    g.save();
    g.translate(p.x, p.y - 9 * s);
    g.rotate(Math.atan2(q.y - p.y, q.x - p.x));
    g.scale(s, s);
    g.fillStyle = "#1d1f4e";
    g.beginPath();
    g.roundRect(-30, -6, 60, 12, 6);
    g.fill();
    g.fillStyle = rgba(CYAN, 0.9);
    for (let wx = -24; wx < 22; wx += 9) g.fillRect(wx, -3, 6, 3);
    g.fillStyle = rgba(AMBER, 1);
    g.fillRect(pd.dir > 0 ? 27 : -29, -1, 2, 2);
    g.restore();
  }
}

function drawDrone(g: Ctx, d: Drone, f: CityFrame): void {
  const t = f.life ? f.clock : 0;
  const x = d.cx + Math.sin(t * d.sp + d.ph) * d.ax;
  const y = d.cy + Math.sin(t * d.sp * 2 + d.ph) * d.ay;
  g.fillStyle = "#15163e";
  g.fillRect(x - 5, y - 1.5, 10, 3);
  if (f.reduced || Math.floor(f.clock * 2 + d.ph) % 2 === 0) {
    g.fillStyle = rgba(PINK, 1);
    g.fillRect(x - 1, y + 1.5, 2, 2);
  }
}

/** A flying car crosses every ten to twenty seconds, trailing pink and throwing an amber beam ahead. */
function drawCar(g: Ctx, s: Scene, f: CityFrame): void {
  if (f.life) {
    s.nextCar -= f.dt;
    if (!s.car && s.nextCar <= 0)
      s.car = { p: 0, dir: Math.random() < 0.5 ? 1 : -1, y: 360 + Math.random() * 120, dur: 6 + Math.random() * 3 };
  }
  const car = s.car;
  if (!car) return;
  if (f.life) car.p += f.dt / car.dur;
  if (car.p > 1) {
    s.car = null;
    s.nextCar = 10 + Math.random() * 10;
    return;
  }
  const d = car.dir;
  const x = d > 0 ? -150 + (CW + 300) * car.p : CW + 150 - (CW + 300) * car.p;
  const y = car.y + Math.sin(car.p * 12) * 4;
  const trail = g.createLinearGradient(x, y, x - d * 90, y);
  trail.addColorStop(0, rgba(PINK, 0.8));
  trail.addColorStop(1, rgba(PINK, 0));
  g.strokeStyle = trail;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - d * 16, y);
  g.lineTo(x - d * 100, y);
  g.stroke();
  const beam = g.createLinearGradient(x, y, x + d * 70, y);
  beam.addColorStop(0, rgba(AMBER, 0.5));
  beam.addColorStop(1, rgba(AMBER, 0));
  g.fillStyle = beam;
  g.beginPath();
  g.moveTo(x + d * 16, y - 1);
  g.lineTo(x + d * 80, y - 14);
  g.lineTo(x + d * 80, y + 12);
  g.closePath();
  g.fill();
  g.fillStyle = "#0e0d26";
  g.beginPath();
  g.roundRect(x - 18, y - 6, 36, 10, 5);
  g.fill();
  g.fillStyle = rgba(CYAN, 0.85);
  g.fillRect(x - 12, y + 4, 24, 1.5);
}

/** Neon signs flicker off for an eighth of a second about one tick in twenty five while the glitch effect is on. */
function drawSign(g: Ctx, s: Sign, f: CityFrame): void {
  const lit = !f.glitch || hash2(Math.floor(f.clock * 8), s.x) > 0.04;
  g.fillStyle = "#0b0a20";
  g.fillRect(s.x, s.y, s.w, s.h);
  g.strokeStyle = rgba(s.c, lit ? 0.9 : 0.25);
  g.lineWidth = 2;
  g.strokeRect(s.x, s.y, s.w, s.h);
  g.save();
  g.fillStyle = rgba(s.c, lit ? 0.95 : 0.2);
  if (lit) {
    g.shadowColor = rgba(s.c, 0.9);
    g.shadowBlur = 8 * f.DPR;
  }
  g.textAlign = "center";
  g.textBaseline = "middle";
  if (s.text && s.horizontal) {
    g.font = `900 ${s.h * 0.66}px ${f.zh}`;
    g.fillText(s.text, s.x + s.w / 2, s.y + s.h / 2 + 1);
  } else if (s.text) {
    g.font = `900 ${s.w * 0.72}px ${f.zh}`;
    [...s.text].forEach((ch, i) => g.fillText(ch, s.x + s.w / 2, s.y + s.w * 0.6 + i * s.w * 0.95));
  } else for (let y = s.y + 8; y < s.y + s.h - 8; y += 12) g.fillRect(s.x + 4, y, s.w - 8, 5);
  g.restore();
}

/**
 * Only layers with something moving are redrawn each frame: the baked layer first, then lights, traffic and weather on top.
 * The far layer never changes, and the sky is redrawn only while weather is on or once after it turns off.
 */
export function updateCity(city: City, f: CityFrame): void {
  const s = city.scene;
  const glitchNow = glitching(city.glitch, f.now, f.glitch);
  if (f.life) {
    toggleWindows(city.wins.mid, f.dt);
    toggleWindows(city.wins.nearmid, f.dt);
  }
  for (const L of city.layers) {
    if (L.id === "far") continue;
    if (L.id === "sky" && !f.weather && !L.dirty) continue;
    const g = L.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, CW, CH);
    g.drawImage(L.baked, 0, 0);
    if (L.id === "sky") {
      L.dirty = f.weather;
      if (f.weather) drawBolt(g, s, f.dt, f.DPR);
    } else if (L.id === "farmid") {
      if (f.weather) drawBoom(g, s, f.dt);
      drawLanes(g, s, 0.35, f);
    } else if (L.id === "mid") {
      drawWindows(g, city.wins.mid, 0.75);
      for (const sign of s.signs) if (sign.k === 0.6) drawSign(g, sign, f);
      for (const p of s.platforms) if (p.k === 0.6) drawPlatform(g, p, f);
      for (const r of s.rails) if (r.k === 0.6) drawRail(g, r, f);
      for (const d of s.drones) drawDrone(g, d, f);
      if (glitchNow) glitchLayer(g, city.glitch, f.now, 1);
    } else if (L.id === "nearmid") {
      drawWindows(g, city.wins.nearmid, 0.6);
      for (const sign of s.signs) if (sign.k === 0.85) drawSign(g, sign, f);
      drawLanes(g, s, 0.85, f);
      for (const p of s.platforms) if (p.k === 0.85) drawPlatform(g, p, f);
      for (const r of s.rails) if (r.k === 0.85) drawRail(g, r, f);
      drawCar(g, s, f);
      if (glitchNow) glitchLayer(g, city.glitch, f.now, 2);
    } else if (L.id === "near") {
      drawLanes(g, s, 1.1, f);
      if (f.weather) drawRain(g, f.clock);
      if (glitchNow) glitchLayer(g, city.glitch, f.now, 3);
    }
  }
}
