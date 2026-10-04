import type { Point } from "../hex";
import { hash2 } from "../math";
import { AMBER, CYAN, PINK, rgba } from "../theme";
import type { Ledge } from "./block";
import { CH, CW, type Win } from "./board";
import { drawBees, drawCrane, drawJetpacker, drawRunner, drawWukong, stepBees } from "./cast";
import { astronaut } from "./figures";
import { glitchLayer, glitching, type GlitchTimer } from "./glitch";
import {
  drawBeam,
  drawCapsules,
  drawCoaster,
  drawDome,
  drawPlatforms,
  drawPortals,
  drawStar,
  inDome,
  stepFlare,
} from "./hero";
import type { Layer } from "./layers";
import type { Lane, Scene, Sign } from "./scene";
import { drawBolt, drawBoom, drawRain, drawSplashes, RAIN } from "./weather";

type Ctx = CanvasRenderingContext2D;

/** What one frame of the city needs to know; flags already fold in reduced motion. */
export interface CityFrame {
  dt: number;
  now: number;
  life: boolean;
  weather: boolean;
  glitch: boolean;
  reduced: boolean;
  DPR: number;
  zh: string;
  star: Point;
  /** The layer the star hangs on: the sky on desktops, the mid layer on phones, where the hole opens below the far skylines. */
  starLayer: "sky" | "mid";
}

export interface City {
  layers: Layer[];
  wins: { mid: Win[]; nearmid: Win[] };
  ledges: { mid: Ledge[]; nearmid: Ledge[] };
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

/** Windows brighten with the star's flare, as if the whole grid drew on it at once. */
function drawWindows(g: Ctx, list: readonly Win[], alpha: number, glow: number): void {
  for (const col of [CYAN, PINK, AMBER]) {
    g.fillStyle = rgba(col, Math.min(1, alpha * (1 + 0.6 * glow)));
    for (const w of list) if (w.on && w.c === col) g.fillRect(w.x, w.y, w.w, w.h);
  }
}

function drawLanes(g: Ctx, lanes: readonly Lane[], layer: Lane["layer"], t: number): void {
  const span = CW + 240;
  for (const l of lanes) {
    if (l.layer !== layer) continue;
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

/** A flying car crosses every ten to twenty seconds, trailing pink and throwing an amber beam ahead. */
function drawCar(g: Ctx, s: Scene, dt: number): void {
  s.nextCar -= dt;
  if (!s.car && s.nextCar <= 0) {
    s.car = { p: 0, dir: Math.random() < 0.5 ? 1 : -1, y: 340 + Math.random() * 100, dur: 7 + Math.random() * 3 };
  }
  const car = s.car;
  if (!car) return;
  car.p += dt / car.dur;
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
function drawSign(g: Ctx, s: Sign, f: CityFrame, t: number): void {
  const lit = !f.glitch || hash2(Math.floor(t * 8), s.x) > 0.04;
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
 * Redraws each layer's live overlay every frame: lights, traffic, weather and the cast over the untouched baked canvas below.
 * The far layer has no overlay. Life time and weather time advance only while their switch is on, so each switch freezes its half of the city mid-motion.
 */
export function updateCity(city: City, f: CityFrame): void {
  const s = city.scene;
  const dtL = f.life ? f.dt : 0;
  const dtW = f.weather ? f.dt : 0;
  s.life += dtL;
  s.weather += dtW;
  const glow = stepFlare(s, dtW);
  const glitchNow = glitching(city.glitch, f.now, f.glitch);
  if (f.life) {
    toggleWindows(city.wins.mid, f.dt);
    toggleWindows(city.wins.nearmid, f.dt);
    stepBees(s.bees, s.swarms, f.dt);
  }
  for (const L of city.layers) {
    const g = L.g;
    if (!g) continue;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, CW, CH);
    if (L.id === "sky") {
      if (f.starLayer === "sky") drawStar(g, s, f.star, s.life + s.weather, astronaut);
      if (f.weather) drawBolt(g, s, dtW, f.DPR);
    } else if (L.id === "farmid") {
      if (f.weather) {
        drawBoom(g, s, dtW);
        drawRain(g, s.weather, RAIN.far);
      }
      drawLanes(g, s.lanes, "farmid", s.life);
    } else if (L.id === "mid") {
      drawWindows(g, city.wins.mid, 0.75, glow);
      for (const sign of s.signs) if (sign.layer === "mid") drawSign(g, sign, f, s.life);
      drawPlatforms(g, s.life, f.life);
      if (f.starLayer === "mid") drawStar(g, s, f.star, s.life + s.weather, astronaut);
      drawBeam(g, s, f.star, s.life + s.weather);
      drawDome(g, s, dtW, f.weather);
      drawPortals(g, s, dtL, s.life);
      drawCoaster(g, s, dtL);
      drawCrane(g, s.life, f.life);
      drawRunner(g, s.life);
      drawJetpacker(g, s.life);
      drawBees(g, s, s.life);
      if (f.weather) {
        drawRain(g, s.weather, RAIN.mid, inDome);
        drawSplashes(g, s.weather, city.ledges.mid);
      }
      if (glitchNow) glitchLayer(g, L.baked, city.glitch, f.now, 1);
    } else if (L.id === "nearmid") {
      drawWindows(g, city.wins.nearmid, 0.6, glow);
      for (const sign of s.signs) if (sign.layer === "nearmid") drawSign(g, sign, f, s.life);
      drawLanes(g, s.lanes, "nearmid", s.life);
      drawCapsules(g, s, dtL);
      drawCar(g, s, dtL);
      drawWukong(g, s, dtL, s.life);
      if (f.weather) drawSplashes(g, s.weather, city.ledges.nearmid);
      if (glitchNow) glitchLayer(g, L.baked, city.glitch, f.now, 2);
    } else if (L.id === "near") {
      drawLanes(g, s.lanes, "near", s.life);
      if (f.weather) drawRain(g, s.weather, RAIN.near);
      if (glitchNow) glitchLayer(g, L.baked, city.glitch, f.now, 3);
    }
  }
}
