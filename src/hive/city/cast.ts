import type { Point } from "../hex";
import { clamp, ease, lerp } from "../math";
import { AMBER, rgba } from "../theme";
import { claim } from "./events";
import { astronaut, bee, cloud, plume, runner, wukong } from "./figures";
import { PLAN } from "./plan";
import type { Bee, Scene } from "./scene";

type Ctx = CanvasRenderingContext2D;

/** The sky the swarms keep to: above the dome, inside the desktop window. */
const SKY = { x0: PLAN.dome.x - 230, x1: PLAN.dome.x + 230, y0: 170, y1: 400 };
const BEE_SPEED = 70;
const LEAP_S = 2.2;

/**
 * Flocking for the bee swarms: each bee steers toward its swarm's centre and target, matches its neighbours' heading and keeps its distance.
 * Targets move every four to seven seconds, so swarms drift across the sky instead of circling one spot.
 */
export function stepBees(bees: Bee[], swarms: Scene["swarms"], dt: number, rand: () => number = Math.random): void {
  for (const s of swarms) {
    s.next -= dt;
    if (s.next > 0) continue;
    s.target = { x: lerp(SKY.x0, SKY.x1, rand()), y: lerp(SKY.y0, SKY.y1, rand()) };
    s.next = 4 + rand() * 3;
  }
  for (const b of bees) {
    const mates = bees.filter((o) => o.swarm === b.swarm && o !== b);
    const n = mates.length || 1;
    const cx = mates.reduce((a, o) => a + o.x, 0) / n;
    const cy = mates.reduce((a, o) => a + o.y, 0) / n;
    const avx = mates.reduce((a, o) => a + o.vx, 0) / n;
    const avy = mates.reduce((a, o) => a + o.vy, 0) / n;
    let ax = (cx - b.x) * 0.6 + (avx - b.vx) * 0.5;
    let ay = (cy - b.y) * 0.6 + (avy - b.vy) * 0.5;
    for (const o of mates) {
      const dx = b.x - o.x;
      const dy = b.y - o.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 196 && d2 > 0) {
        ax += (dx / d2) * 1600;
        ay += (dy / d2) * 1600;
      }
    }
    const t = swarms[b.swarm]?.target ?? b;
    ax += (t.x - b.x) * 0.9;
    ay += (t.y - b.y) * 0.9;
    b.vx += ax * dt;
    b.vy += ay * dt;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > BEE_SPEED) {
      b.vx *= BEE_SPEED / sp;
      b.vy *= BEE_SPEED / sp;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
}

/** Bees face the way they fly and are drawn 1.6x, big enough to read as creatures rather than specks. */
export function drawBees(g: Ctx, s: Scene, t: number) {
  for (const b of s.bees) {
    g.save();
    g.translate(b.x, b.y + Math.sin(t * 3 + b.phase) * 2);
    g.scale(b.vx < 0 ? -1.6 : 1.6, 1.6);
    bee(g, t, b.phase);
    g.restore();
  }
}

/** Wukong guards the pagoda roof and now and then leaps on his cloud to the arcology and back, when the stage is free. */
export function drawWukong(g: Ctx, s: Scene, dt: number, t: number) {
  const w = s.wukong;
  const { pagoda, arcology } = PLAN.perches;
  if (w.leap === null) {
    w.next -= dt;
    if (w.next <= 0) {
      if (claim(s.stage, s.life, LEAP_S)) w.leap = 0;
      else w.next = 1;
    }
  } else if ((w.leap += dt) > LEAP_S) {
    w.at = w.at === "pagoda" ? "arcology" : "pagoda";
    w.leap = null;
    w.next = 18 + Math.random() * 12;
  }
  const from = w.at === "pagoda" ? pagoda : arcology;
  const to = w.at === "pagoda" ? arcology : pagoda;
  let p: Point = from;
  if (w.leap !== null) {
    const k = ease(clamp(w.leap / LEAP_S, 0, 1));
    p = { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k) - Math.sin(Math.PI * k) * 130 };
  }
  g.save();
  g.translate(p.x, p.y + (w.leap === null ? Math.sin(t * 1.4) * 0.6 : 0));
  g.scale(to.x < from.x && w.leap !== null ? -1.4 : 1.4, 1.4);
  if (w.leap !== null) cloud(g, t);
  wukong(g, t, w.leap === null ? 0 : 1);
  g.restore();
}

/** The wall-runner swings from a grapple on the unfinished tower toward the dome and back, a pendulum on life time. */
export function drawRunner(g: Ctx, t: number) {
  const { anchor, len } = PLAN.swing;
  const a = 0.5 + Math.sin(t * 1.1) * 0.5;
  const hand = { x: anchor.x + Math.sin(a) * len, y: anchor.y + Math.cos(a) * len };
  g.strokeStyle = "rgba(200,240,255,0.6)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(anchor.x, anchor.y);
  g.lineTo(hand.x, hand.y);
  g.stroke();
  g.save();
  g.translate(hand.x, hand.y + 16);
  g.rotate(-a * 0.6);
  g.scale(1.3, 1.3);
  runner(g, t);
  g.restore();
}

/** The crane on the unfinished tower: its jib turns, a beam rides the hook up and down, and welding sparks spit from the frame. */
export function drawCrane(g: Ctx, t: number, moving: boolean) {
  const tw = PLAN.twin;
  const bx = tw.x + (tw.w[0] ?? 70) + tw.gap;
  const wb = tw.w[1] ?? 62;
  const mx = bx + wb - 10;
  const turn = Math.cos(t * 0.35);
  const reach = 92 * turn;
  g.strokeStyle = "#5a5fb0";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(mx - reach, tw.craneTop);
  g.lineTo(mx + 28 * turn, tw.craneTop);
  g.stroke();
  g.fillStyle = rgba(AMBER, 0.9);
  g.fillRect(mx - 3, tw.craneTop - 6, 6, 6);
  const drop = 40 + (Math.sin(t * 0.5) * 0.5 + 0.5) * 60;
  g.strokeStyle = "rgba(200,205,232,0.5)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(mx - reach, tw.craneTop);
  g.lineTo(mx - reach, tw.craneTop + drop);
  g.stroke();
  g.fillStyle = "#3a3f8a";
  g.fillRect(mx - reach - 14, tw.craneTop + drop, 28, 4);
  if (!moving) return;
  for (let i = 0; i < 6; i++) {
    if (Math.random() > 0.5) continue;
    g.fillStyle = rgba(AMBER, 0.6 + Math.random() * 0.4);
    g.fillRect(bx + 10 + Math.random() * (wb - 20), tw.tops[1] + 20 + Math.random() * 60, 1.5, 1.5);
  }
}

/** An astronaut jetpacks between the two platforms, resting on each for a few seconds. */
export function drawJetpacker(g: Ctx, t: number) {
  const [a, b] = PLAN.platforms;
  if (!a || !b) return;
  const cycle = (t % 20) / 20;
  const go = cycle < 0.3 ? cycle / 0.3 : cycle < 0.5 ? 1 : cycle < 0.8 ? 1 - (cycle - 0.5) / 0.3 : 0;
  const flying = (cycle > 0.02 && cycle < 0.28) || (cycle > 0.52 && cycle < 0.78);
  const k = ease(go);
  const x = lerp(a.x, b.x, k);
  const y = lerp(a.y, b.y, k) - Math.sin(Math.PI * k) * 50 - 10;
  g.save();
  g.translate(x, y);
  g.scale(1.2, 1.2);
  if (flying) plume(g, t);
  astronaut(g, t);
  g.restore();
}
