import { rng } from "../math";
import { CYAN, PINK, rgba } from "../theme";
import { CH, CW } from "./bake";

export interface GlitchTimer {
  next: number;
  until: number;
  seed: number;
}

export function createGlitch(): GlitchTimer {
  return { next: 2500, until: 0, seed: 0 };
}

/** The glitch belongs to the city, not the cursor: every three to seven and a half seconds it fires for 140 to 260 ms. */
export function glitching(t: GlitchTimer, now: number, enabled: boolean): boolean {
  if (!enabled) return false;
  if (now > t.next) {
    t.until = now + 140 + Math.random() * 120;
    t.next = now + 3000 + Math.random() * 4500;
    t.seed = (Math.random() * 1e6) | 0;
  }
  return now < t.until;
}

/** Slices of the layer slip sideways with pink and cyan seams, and a few pixel blocks drop out; the pattern changes every 45 ms. */
export function glitchLayer(g: CanvasRenderingContext2D, t: GlitchTimer, now: number, salt: number): void {
  const r = rng(t.seed + salt * 977 + Math.floor(now / 45));
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (let k = 0; k < 3; k++) {
    const y = r() * CH;
    const h = 4 + r() * 30;
    const dx = (r() - 0.5) * 80;
    g.drawImage(g.canvas, 0, y, CW, h, dx, y, CW, h);
    g.fillStyle = rgba(CYAN, 0.35);
    g.fillRect(0, y, CW, 1);
    g.fillStyle = rgba(PINK, 0.35);
    g.fillRect(0, y + h, CW, 1);
  }
  const blocks = [rgba(CYAN, 0.45), rgba(PINK, 0.45), "rgba(235,230,255,0.35)"];
  for (let k = 0; k < 6; k++) {
    g.fillStyle = blocks[k % 3] ?? "transparent";
    g.fillRect(r() * CW, r() * CH, 6 + r() * 22, 4 + r() * 12);
  }
}
