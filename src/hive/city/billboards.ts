import type { CanvasTexture } from "three";
import type { Rand } from "../math";
import { canvas, ctx, texture } from "./textures";

/** One advert: a project of the owner's or an easter egg of the city's. */
export interface Ad {
  title: string;
  line: string;
  colour: string;
  mark: "project" | "skull" | "owl" | "bee" | "face" | "ship" | "hex" | "lantern";
}

/** The city's own adverts; each points at something a visitor can find. */
export const EGGS: readonly Ad[] = [
  { title: "WANTED", line: "the Night Kite's captain", colour: "255,200,90", mark: "skull" },
  { title: "OWLSPIRE", line: "enrolment open: spells, brooms, owls", colour: "180,140,255", mark: "owl" },
  { title: "LOST BEE", line: "answers to Bzz. reward at the hive", colour: "255,190,70", mark: "bee" },
  { title: "LUMEN", line: "face of the week", colour: "255,110,200", mark: "face" },
  { title: "WANDERER?", line: "seen it vanish? call the sky desk", colour: "120,220,255", mark: "ship" },
  { title: "FIND THEM ALL", line: "every hex hides a place", colour: "120,255,180", mark: "hex" },
  { title: "夜市", line: "Lantern Steps, open all night", colour: "255,90,140", mark: "lantern" },
];

/** Board sizes in canvas pixels: tall strips down tower sides, wide panels across them, and Kaleido's giant screen. */
const SIZES = { tall: [128, 320], wide: [320, 128], giant: [512, 640] } as const;
export type BoardSize = keyof typeof SIZES;

const GLITCH_S = 0.45;

function mark(g: CanvasRenderingContext2D, ad: Ad, x: number, y: number, s: number) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.strokeStyle = `rgba(${ad.colour},1)`;
  g.fillStyle = `rgba(${ad.colour},1)`;
  g.lineWidth = 0.08;
  g.beginPath();
  if (ad.mark === "skull") {
    g.arc(0, -0.1, 0.5, Math.PI, 0);
    g.lineTo(0.35, 0.35);
    g.lineTo(-0.35, 0.35);
    g.closePath();
    g.stroke();
    g.fillRect(-0.28, -0.15, 0.18, 0.18);
    g.fillRect(0.1, -0.15, 0.18, 0.18);
    g.strokeRect(-0.6, 0.5, 1.2, 0.02);
  } else if (ad.mark === "owl") {
    g.ellipse(0, 0.1, 0.45, 0.55, 0, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(-0.18, -0.05, 0.14, 0, Math.PI * 2);
    g.arc(0.18, -0.05, 0.14, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(-0.5, -0.4);
    g.lineTo(0, -1);
    g.lineTo(0.5, -0.4);
    g.stroke();
  } else if (ad.mark === "bee") {
    g.ellipse(0, 0, 0.5, 0.32, 0, 0, Math.PI * 2);
    g.stroke();
    for (const k of [-0.15, 0.15]) g.fillRect(k - 0.04, -0.3, 0.08, 0.6);
    g.beginPath();
    g.ellipse(-0.15, -0.45, 0.2, 0.3, -0.5, 0, Math.PI * 2);
    g.ellipse(0.15, -0.45, 0.2, 0.3, 0.5, 0, Math.PI * 2);
    g.stroke();
  } else if (ad.mark === "face") {
    g.arc(0, 0, 0.55, 0, Math.PI * 2);
    g.stroke();
    g.fillRect(-0.25, -0.2, 0.12, 0.2);
    g.fillRect(0.13, -0.2, 0.12, 0.2);
    g.beginPath();
    g.arc(0, 0.05, 0.3, 0.2, Math.PI - 0.2);
    g.stroke();
  } else if (ad.mark === "ship") {
    g.ellipse(0, 0, 0.7, 0.18, 0, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(0, -0.1, 0.28, Math.PI, 0);
    g.stroke();
  } else if (ad.mark === "lantern") {
    g.roundRect(-0.3, -0.45, 0.6, 0.9, 0.2);
    g.stroke();
    g.fillRect(-0.05, 0.45, 0.1, 0.3);
  } else {
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k + Math.PI / 6;
      g.lineTo(Math.cos(a) * 0.55, Math.sin(a) * 0.55);
    }
    g.closePath();
    g.stroke();
  }
  g.restore();
}

/** Draws one advert to fill a canvas: a dark panel with a frame, the mark, the title and the line, laid out for its shape. */
function paintAd(g: CanvasRenderingContext2D, ad: Ad, w: number, h: number, mono: string, zh: string) {
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#0a0820");
  bg.addColorStop(1, `rgba(${ad.colour},0.28)`);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = `rgba(${ad.colour},0.9)`;
  g.lineWidth = Math.max(3, w * 0.015);
  g.strokeRect(4, 4, w - 8, h - 8);
  g.fillStyle = "rgba(255,255,255,0.05)";
  for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
  const tall = h > w;
  const u = Math.min(w, h);
  mark(g, ad, tall ? w / 2 : u * 0.5, tall ? u * 0.55 : h / 2, u * 0.35);
  g.shadowColor = `rgba(${ad.colour},1)`;
  g.shadowBlur = u * 0.06;
  g.fillStyle = "#fff";
  g.textAlign = tall ? "center" : "left";
  g.textBaseline = "middle";
  const cjk = /[\u3000-\u9fff]/.test(ad.title);
  const tx = tall ? w / 2 : u;
  const maxW = tall ? w * 0.9 : w - u - 12;
  let size = u * (tall ? 0.24 : 0.3);
  g.font = `900 ${size}px ${cjk ? zh : mono}`;
  while (g.measureText(ad.title).width > maxW && size > 8) {
    size *= 0.9;
    g.font = `900 ${size}px ${cjk ? zh : mono}`;
  }
  g.fillText(ad.title, tx, tall ? h * 0.62 : h * 0.4);
  g.shadowBlur = 0;
  g.fillStyle = `rgba(${ad.colour},1)`;
  let small = u * 0.09;
  g.font = `${small}px ${mono}`;
  while (g.measureText(ad.line).width > maxW && small > 6) {
    small *= 0.92;
    g.font = `${small}px ${mono}`;
  }
  g.fillText(ad.line, tx, tall ? h * 0.75 : h * 0.68);
}

interface Board {
  g: CanvasRenderingContext2D;
  tex: CanvasTexture;
  w: number;
  h: number;
  ad: number;
  next: number;
  glitch: number;
  /** Scratch canvases holding the outgoing and incoming adverts during a glitch. */
  from: HTMLCanvasElement;
  to: HTMLCanvasElement;
}

export interface Boards {
  /** A texture for a board of this size; boards of one size share a few canvases, so the city never draws more than a dozen. */
  get: (size: BoardSize) => CanvasTexture;
  update: (dt: number, glitch: boolean) => void;
  /** Repaints every board, for when the fonts arrive after the first paint. */
  repaint: () => void;
  /** Kaleido's event: every board of a size glitches hard and lands on one of the owner's projects. */
  takeover: (size: BoardSize) => void;
}

/**
 * Billboards switch adverts every six to ten seconds with a glitch: torn slices from both adverts, colour bars and noise for under half a second.
 * With the glitch effect on, a board also stutters now and then between switches.
 */
export function createBoards(ads: readonly Ad[], mono: string, zh: string, rand: Rand): Boards {
  const all = [...ads, ...EGGS];
  const pools = new Map<BoardSize, Board[]>();
  let turn = 0;
  const draw = (b: Board, target: HTMLCanvasElement, i: number) => {
    const ad = all[i % all.length];
    if (ad) paintAd(ctx(target), ad, b.w, b.h, mono, zh);
  };
  const show = (b: Board) => {
    draw(b, b.to, b.ad);
    b.g.drawImage(b.to, 0, 0);
    b.tex.needsUpdate = true;
  };
  const make = (size: BoardSize): Board => {
    const [w, h] = SIZES[size];
    const c = canvas(w, h);
    const b: Board = {
      g: ctx(c),
      tex: texture(c),
      w,
      h,
      ad: turn++ * 3 + Math.floor(rand() * all.length),
      next: 2 + rand() * 8,
      glitch: -1,
      from: canvas(w, h),
      to: canvas(w, h),
    };
    show(b);
    return b;
  };
  const glitchFrame = (b: Board) => {
    const k = Math.max(0, b.glitch / GLITCH_S);
    for (let i = 0; i < 9; i++) {
      const y = Math.floor(rand() * b.h);
      const sh = 4 + Math.floor(rand() * b.h * 0.15);
      const src = rand() < k ? b.to : b.from;
      b.g.drawImage(src, 0, y, b.w, sh, (rand() - 0.5) * b.w * 0.2, y, b.w, sh);
    }
    b.g.globalCompositeOperation = "lighter";
    b.g.fillStyle = "rgba(255,40,160,0.35)";
    b.g.fillRect(0, rand() * b.h, b.w, 3);
    b.g.fillStyle = "rgba(40,220,255,0.35)";
    b.g.fillRect(0, rand() * b.h, b.w, 3);
    b.g.globalCompositeOperation = "source-over";
    for (let i = 0; i < 14; i++) {
      b.g.fillStyle = rand() < 0.5 ? "#000" : "rgba(255,255,255,0.6)";
      b.g.fillRect(rand() * b.w, rand() * b.h, 4 + rand() * 20, 2 + rand() * 6);
    }
    b.tex.needsUpdate = true;
  };
  return {
    get: (size) => {
      const pool = pools.get(size) ?? [];
      pools.set(size, pool);
      if (pool.length < 4) {
        const b = make(size);
        pool.push(b);
        return b.tex;
      }
      const b = pool[turn++ % pool.length];
      return b ? b.tex : make(size).tex;
    },
    update: (dt, glitch) => {
      for (const pool of pools.values())
        for (const b of pool) {
          if (b.glitch !== -1) {
            b.glitch += dt;
            if (b.glitch > GLITCH_S) {
              b.glitch = -1;
              show(b);
            } else glitchFrame(b);
            continue;
          }
          b.next -= dt;
          if (b.next <= 0) {
            b.from.getContext("2d")?.drawImage(b.to, 0, 0);
            b.ad++;
            draw(b, b.to, b.ad);
            b.glitch = 0;
            b.next = 6 + rand() * 4;
          } else if (glitch && rand() < dt * 0.15) {
            b.from.getContext("2d")?.drawImage(b.to, 0, 0);
            b.glitch = GLITCH_S * 0.7;
          }
        }
    },
    repaint: () => {
      for (const pool of pools.values()) for (const b of pool) show(b);
    },
    takeover: (size) => {
      const target = ads.length ? Math.floor(rand() * ads.length) : 0;
      for (const b of pools.get(size) ?? []) {
        b.from.getContext("2d")?.drawImage(b.to, 0, 0);
        b.ad = target + Math.ceil(b.ad / all.length) * all.length;
        draw(b, b.to, b.ad);
        b.glitch = -GLITCH_S * 2;
        b.next = 10;
      }
    },
  };
}
