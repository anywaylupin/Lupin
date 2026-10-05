import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { Rand } from "../math";

/**
 * Facade cells across and down the texture; each cell is 10 by 12 world units, so one tile covers 160 by 192 before it repeats.
 * Cells half that size turned distant towers into static, since most windows fell under a pixel.
 */
export const WIN = { cols: 16, rows: 16, w: 10, h: 12 } as const;
const PX = 32;
const WARM = ["255,190,110", "255,214,150", "255,236,200"];
const COOL = ["120,220,255", "150,170,255", "255,110,200"];

export function canvas(w: number, h: number): HTMLCanvasElement {
  return Object.assign(document.createElement("canvas"), { width: w, height: h });
}

export function ctx(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const g = c.getContext("2d");
  if (!g) throw new Error("2D canvas is unavailable");
  return g;
}

export function texture(c: HTMLCanvasElement, repeat = false): CanvasTexture {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  if (repeat) {
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
  }
  return t;
}

export interface Facade {
  tex: CanvasTexture;
  /** Flips a few cells between lit and dark, so the skyline breathes. */
  toggle: (count: number, rand: Rand) => void;
}

/**
 * The glow map every lit facade shares, drawn like the panelled towers in the reference: most cells are dark panels with a faint seam, one in six is a lit window, a few are vents, and some columns carry an LED strip.
 * Cell (0, 0) stays dark so roofs and floors, whose UVs are pinned there, never glow.
 */
export function facadeTexture(rand: Rand): Facade {
  const c = canvas(WIN.cols * PX, WIN.rows * PX);
  const g = ctx(c);
  g.fillStyle = "#000";
  g.fillRect(0, 0, c.width, c.height);
  const strips = new Set(Array.from({ length: 3 }, () => Math.floor(rand() * WIN.cols)));
  const paint = (col: number, row: number, lit: boolean) => {
    const x = col * PX;
    const y = row * PX;
    g.fillStyle = "#000";
    g.fillRect(x, y, PX, PX);
    if (col === 0 && row === WIN.rows - 1) return;
    g.fillStyle = "rgba(60,70,130,0.35)";
    g.fillRect(x, y + PX - 2, PX, 1);
    g.fillRect(x + PX - 2, y, 1, PX);
    if (strips.has(col)) {
      g.fillStyle = rand() < 0.5 ? "rgba(120,220,255,0.9)" : "rgba(255,110,200,0.9)";
      g.fillRect(x + PX / 2 - 1, y, 3, PX);
      return;
    }
    if (lit) {
      const warm = rand() < 0.7;
      const col3 = (warm ? WARM : COOL)[Math.floor(rand() * 3)] ?? "255,214,150";
      g.fillStyle = `rgba(${col3},${0.35 + rand() * 0.4})`;
      const split = rand() < 0.4;
      if (split) {
        g.fillRect(x + 4, y + 6, PX / 2 - 6, PX - 14);
        g.fillRect(x + PX / 2 + 2, y + 6, PX / 2 - 6, PX - 14);
      } else g.fillRect(x + 4, y + 6, PX - 8, PX - 14);
    } else if (rand() < 0.12) {
      g.fillStyle = "rgba(90,100,160,0.4)";
      for (let k = 0; k < 4; k++) g.fillRect(x + 5, y + 7 + k * 5, PX - 10, 2);
    }
  };
  for (let row = 0; row < WIN.rows; row++) for (let col = 0; col < WIN.cols; col++) paint(col, row, rand() < 0.16);
  const tex = texture(c, true);
  return {
    tex,
    toggle: (count, r) => {
      for (let i = 0; i < count; i++) paint(Math.floor(r() * WIN.cols), Math.floor(r() * WIN.rows), r() < 0.35);
      tex.needsUpdate = true;
    },
  };
}

/** A soft round glow for sprites and particles: white at the centre fading to clear, tinted by the material. */
export function glowTexture(): CanvasTexture {
  const c = canvas(64, 64);
  const g = ctx(c);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.25, "rgba(255,255,255,0.55)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return texture(c);
}

/** The night sky behind everything: deep blue overhead warming to the violet haze of the reference at the horizon. */
export function skyTexture(): CanvasTexture {
  const c = canvas(2, 512);
  const g = ctx(c);
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#0a0b2e");
  gr.addColorStop(0.4, "#2a2370");
  gr.addColorStop(0.62, "#5a3a9a");
  gr.addColorStop(0.8, "#3a2266");
  gr.addColorStop(1, "#120c2c");
  g.fillStyle = gr;
  g.fillRect(0, 0, 2, 512);
  return texture(c);
}

/** The deck: dark paving in large slabs with a faint seam, so streets read as gaps between towers rather than painted lines. */
export function deckTexture(): CanvasTexture {
  const c = canvas(128, 128);
  const g = ctx(c);
  g.fillStyle = "#0d0c22";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#151338";
  g.fillRect(0, 0, 128, 2);
  g.fillRect(0, 0, 2, 128);
  g.fillStyle = "rgba(90,200,230,0.18)";
  g.fillRect(60, 60, 8, 8);
  return texture(c, true);
}
