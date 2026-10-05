import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { AMBER, CYAN, PINK, rgba } from "../theme";

/** Window cells across and down the facade texture; with each cell 4 by 5 world units, one tile covers 64 by 80 before it repeats. */
export const WIN = { cols: 16, rows: 16, w: 4, h: 5 } as const;
const PX = 16;
const COLOURS = [AMBER, AMBER, CYAN, PINK, "255,236,190"];

function canvas(w: number, h: number): HTMLCanvasElement {
  return Object.assign(document.createElement("canvas"), { width: w, height: h });
}

function texture(c: HTMLCanvasElement): CanvasTexture {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/**
 * The facade glow map shared by every lit building: a grid of windows on black, about a quarter lit.
 * Cell (0, 0) stays dark so roofs and floors, whose UVs are pinned there, never glow.
 */
export interface Windows {
  tex: CanvasTexture;
  toggle: (count: number, rand: () => number) => void;
}

export function windowTexture(rand: () => number): Windows {
  const c = canvas(WIN.cols * PX, WIN.rows * PX);
  const g = c.getContext("2d");
  if (!g) throw new Error("2D canvas is unavailable");
  g.fillStyle = "#000";
  g.fillRect(0, 0, c.width, c.height);
  const paint = (col: number, row: number, on: boolean) => {
    if (col === 0 && row === WIN.rows - 1) on = false;
    g.fillStyle = on ? rgba(COLOURS[Math.floor(rand() * COLOURS.length)] ?? AMBER, 0.55 + rand() * 0.45) : "#000";
    g.fillRect(col * PX + 4, row * PX + 4, PX - 8, PX - 6);
  };
  for (let row = 0; row < WIN.rows; row++) for (let col = 0; col < WIN.cols; col++) paint(col, row, rand() < 0.24);
  const tex = texture(c);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  return {
    tex,
    toggle: (count, r) => {
      for (let i = 0; i < count; i++) paint(Math.floor(r() * WIN.cols), Math.floor(r() * WIN.rows), r() < 0.4);
      tex.needsUpdate = true;
    },
  };
}

/** A soft round glow for sprites and particles: white at the centre fading to clear, tinted by the material. */
export function glowTexture(): CanvasTexture {
  const c = canvas(64, 64);
  const g = c.getContext("2d");
  if (g) {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.25, "rgba(255,255,255,0.6)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  }
  return texture(c);
}

/** The night sky behind everything: deep blue at the top warming to violet at the horizon, as the old painted backdrop did. */
export function skyTexture(): CanvasTexture {
  const c = canvas(2, 256);
  const g = c.getContext("2d");
  if (g) {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#05061a");
    gr.addColorStop(0.45, "#140f3e");
    gr.addColorStop(0.7, "#2a1257");
    gr.addColorStop(1, "#160d36");
    g.fillStyle = gr;
    g.fillRect(0, 0, 2, 256);
  }
  return texture(c);
}

/** The ground: dark asphalt with faint cyan street lines every block, drawn once and repeated. */
export function groundTexture(): CanvasTexture {
  const c = canvas(64, 64);
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#08071a";
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = rgba(CYAN, 0.22);
    g.fillRect(0, 31, 64, 2);
    g.fillRect(31, 0, 2, 64);
  }
  const t = texture(c);
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  return t;
}

/**
 * A neon sign: Chinese and Japanese characters stacked down a dark panel, framed and glowing in one colour.
 * The caller redraws once the CJK font has loaded, since the first draw may fall back to a system face.
 */
export function signTexture(text: string, colour: string, font: string): { tex: CanvasTexture; redraw: () => void } {
  const n = [...text].length;
  const c = canvas(64, 24 + n * 56);
  const g = c.getContext("2d");
  const tex = texture(c);
  const redraw = () => {
    if (!g) return;
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = "#0b0a20";
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = rgba(colour, 0.9);
    g.lineWidth = 4;
    g.strokeRect(2, 2, c.width - 4, c.height - 4);
    g.fillStyle = rgba(colour, 1);
    g.shadowColor = rgba(colour, 1);
    g.shadowBlur = 10;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `900 46px ${font}`;
    [...text].forEach((ch, i) => g.fillText(ch, 32, 40 + i * 56));
    tex.needsUpdate = true;
  };
  redraw();
  return { tex, redraw };
}

export const SIGNS: readonly { text: string; colour: string }[] = [
  { text: "夜市", colour: PINK },
  { text: "橘", colour: CYAN },
  { text: "开放", colour: AMBER },
  { text: "快递", colour: PINK },
  { text: "龍", colour: CYAN },
  { text: "茶", colour: AMBER },
  { text: "祭", colour: PINK },
  { text: "酒", colour: CYAN },
];
