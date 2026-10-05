/**
 * Lumen's face rig: one drawing routine for every character, steered by a small state of blink, gaze and mood.
 * Characters are parameter sets, so a new face is a new entry in the cast, not new drawing code.
 * Every character is an original design.
 */
export type Mood = "calm" | "happy" | "shock" | "sleep";

export interface FaceState {
  /** 0 eyes open, 1 shut. */
  blink: number;
  /** Where the eyes look, each axis from -1 to 1. */
  look: { x: number; y: number };
  mood: Mood;
  t: number;
}

type Head = "round" | "mask" | "box" | "skull" | "disc";
type Eyes = "oval" | "fire" | "cat" | "big" | "scan" | "patch" | "owl" | "slit";
type Extra = "horns" | "ears" | "bigears" | "antenna" | "tricorn" | "wizard" | "crest";

export interface Character {
  name: string;
  /** Behind the head: the dark LED field, two tones top to bottom. */
  field: readonly [string, string];
  head: Head;
  skin: string;
  shade: string;
  eyes: Eyes;
  eye: string;
  extras: readonly Extra[];
  cheeks?: string;
  whiskers?: boolean;
  tusks?: boolean;
  snout?: boolean;
}

type G = CanvasRenderingContext2D;

function ellipse(g: G, x: number, y: number, rx: number, ry: number, fill: string) {
  g.fillStyle = fill;
  g.beginPath();
  g.ellipse(x, y, Math.max(0.001, rx), Math.max(0.001, ry), 0, 0, Math.PI * 2);
  g.fill();
}

function extras(g: G, c: Character, t: number) {
  for (const e of c.extras) {
    g.fillStyle = c.shade;
    if (e === "horns" || e === "ears" || e === "bigears") {
      for (const s of [-1, 1]) {
        g.beginPath();
        if (e === "horns") {
          g.moveTo(s * 0.22, -0.3);
          g.quadraticCurveTo(s * 0.42, -0.5, s * 0.36, -0.72);
          g.lineTo(s * 0.3, -0.36);
          g.fillStyle = "#f4e0c0";
        } else if (e === "ears") {
          g.moveTo(s * 0.12, -0.34);
          g.lineTo(s * 0.34, -0.66);
          g.lineTo(s * 0.4, -0.22);
          g.fillStyle = c.skin;
        } else {
          g.ellipse(s * 0.4, -0.42, 0.14, 0.28, s * 0.5, 0, Math.PI * 2);
          g.fillStyle = c.skin;
        }
        g.fill();
      }
    } else if (e === "antenna") {
      g.fillRect(-0.01, -0.62, 0.02, 0.2);
      ellipse(g, 0, -0.64, 0.04, 0.04, Math.sin(t * 6) > 0 ? "#ff4060" : "#601020");
    } else if (e === "tricorn") {
      g.fillStyle = "#3a2440";
      g.beginPath();
      g.moveTo(-0.5, -0.3);
      g.quadraticCurveTo(0, -0.5, 0.5, -0.3);
      g.quadraticCurveTo(0.3, -0.75, 0, -0.62);
      g.quadraticCurveTo(-0.3, -0.75, -0.5, -0.3);
      g.fill();
      g.fillStyle = "#e0b040";
      g.fillRect(-0.4, -0.36, 0.8, 0.03);
      ellipse(g, 0, -0.48, 0.05, 0.05, "#f0ead8");
    } else if (e === "wizard") {
      g.fillStyle = "#2a2070";
      g.beginPath();
      g.moveTo(-0.34, -0.34);
      g.lineTo(0.08, -0.92);
      g.lineTo(0.34, -0.34);
      g.fill();
      g.fillStyle = "#ffe080";
      for (const [x, y] of [
        [-0.08, -0.5],
        [0.1, -0.64],
        [0.04, -0.42],
      ] as const)
        g.fillRect(x, y, 0.035, 0.035);
    } else {
      g.fillStyle = `hsl(${20 + Math.sin(t * 9) * 15},100%,55%)`;
      g.beginPath();
      for (let i = -2; i <= 2; i++) {
        const fl = 0.12 + 0.05 * Math.sin(t * 11 + i);
        g.moveTo(i * 0.09 - 0.05, -0.36);
        g.lineTo(i * 0.09, -0.4 - fl - (2 - Math.abs(i)) * 0.05);
        g.lineTo(i * 0.09 + 0.05, -0.36);
      }
      g.fill();
    }
  }
}

function head(g: G, c: Character) {
  g.fillStyle = c.skin;
  g.beginPath();
  if (c.head === "box") g.roundRect(-0.42, -0.4, 0.84, 0.8, 0.08);
  else if (c.head === "mask") {
    g.moveTo(-0.38, -0.36);
    g.quadraticCurveTo(0, -0.5, 0.38, -0.36);
    g.quadraticCurveTo(0.46, 0.2, 0, 0.5);
    g.quadraticCurveTo(-0.46, 0.2, -0.38, -0.36);
  } else if (c.head === "skull") {
    g.arc(0, -0.04, 0.4, Math.PI, 0);
    g.lineTo(0.26, 0.38);
    g.lineTo(-0.26, 0.38);
    g.closePath();
  } else g.arc(0, 0, c.head === "disc" ? 0.44 : 0.42, 0, Math.PI * 2);
  g.fill();
  if (c.head === "box") {
    g.fillStyle = "#05080e";
    g.fillRect(-0.34, -0.3, 0.68, 0.5);
  }
  if (c.head === "disc") {
    for (const s of [-1, 1]) ellipse(g, s * 0.17, -0.02, 0.2, 0.2, "#d8b088");
  }
}

function eyes(g: G, c: Character, s: FaceState) {
  const open = Math.max(0, 1 - s.blink) * (s.mood === "sleep" ? 0.08 : s.mood === "shock" ? 1.3 : 1);
  const lx = s.look.x * 0.05;
  const ly = s.look.y * -0.04;
  for (const side of [-1, 1]) {
    const x = side * (c.eyes === "owl" ? 0.17 : 0.16);
    const y = -0.04;
    if (c.eyes === "patch" && side === 1) {
      ellipse(g, x, y, 0.1, 0.08, "#101010");
      g.fillStyle = "#101010";
      g.fillRect(-0.4, -0.2, 0.8, 0.025);
      continue;
    }
    if (c.eyes === "scan") {
      const w = 0.16;
      g.fillStyle = c.eye;
      g.fillRect(x - w / 2 + lx, y - 0.025 * open + ly, w, 0.05 * open + 0.004);
      continue;
    }
    if (c.eyes === "fire") {
      ellipse(g, x + lx, y + ly, 0.09, 0.05 * open, c.eye);
      ellipse(g, x + lx, y + ly, 0.04, 0.03 * open, "#fff6c0");
      continue;
    }
    if (c.eyes === "patch") {
      ellipse(g, x, y, 0.09, 0.09 * open, "#151010");
      ellipse(g, x + lx, y + ly, 0.03, 0.03 * open, c.eye);
      continue;
    }
    const big = c.eyes === "big" || c.eyes === "owl";
    const rx = big ? 0.12 : c.eyes === "cat" || c.eyes === "slit" ? 0.08 : 0.06;
    const ry = (big ? 0.13 : c.eyes === "oval" ? 0.1 : 0.08) * open;
    if (c.eyes === "owl") ellipse(g, x, y, rx, ry, "#fff8e0");
    ellipse(g, x + lx, y + ly, c.eyes === "owl" ? rx * 0.6 : rx, c.eyes === "owl" ? ry * 0.6 : ry, c.eye);
    if (c.eyes === "slit" || c.eyes === "cat") ellipse(g, x + lx, y + ly, rx * 0.25, ry * 0.85, "#101010");
    else if (c.eyes === "owl") ellipse(g, x + lx, y + ly, rx * 0.25, ry * 0.25, "#101010");
    if (open > 0.3) ellipse(g, x + lx + rx * 0.3, y + ly - ry * 0.35, rx * 0.25, rx * 0.25, "rgba(255,255,255,0.9)");
  }
  if (c.eyes === "owl") {
    g.strokeStyle = "#e0c070";
    g.lineWidth = 0.02;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.arc(side * 0.17, -0.04, 0.15, 0, Math.PI * 2);
      g.stroke();
    }
  }
}

function mouth(g: G, c: Character, s: FaceState) {
  g.strokeStyle = c.head === "box" ? c.eye : "#2a1010";
  g.fillStyle = "#3a0a14";
  g.lineWidth = 0.03;
  g.lineCap = "round";
  const y = c.head === "skull" ? 0.2 : 0.18;
  g.beginPath();
  if (s.mood === "shock") {
    g.ellipse(0, y + 0.02, 0.06, 0.08, 0, 0, Math.PI * 2);
    g.fill();
  } else if (s.mood === "happy") {
    g.arc(0, y - 0.06, 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
    g.closePath();
    g.fill();
  } else if (c.whiskers) {
    g.arc(-0.04, y, 0.04, 0, Math.PI);
    g.arc(0.04, y, 0.04, 0, Math.PI);
    g.stroke();
  } else if (c.head === "skull") {
    for (let i = -2; i <= 2; i++) g.fillRect(i * 0.06 - 0.02, y, 0.04, 0.08);
  } else if (s.mood === "sleep") {
    g.moveTo(-0.06, y);
    g.lineTo(0.06, y);
    g.stroke();
  } else {
    g.arc(0, y - 0.08, 0.1, 0.25 * Math.PI, 0.75 * Math.PI);
    g.stroke();
  }
  if (c.tusks)
    for (const sd of [-1, 1]) {
      g.fillStyle = "#f4e0c0";
      g.beginPath();
      g.moveTo(sd * 0.12, y + 0.02);
      g.lineTo(sd * 0.1, y - 0.1);
      g.lineTo(sd * 0.06, y + 0.02);
      g.fill();
    }
  if (c.snout) for (const sd of [-1, 1]) ellipse(g, sd * 0.05, 0.08, 0.02, 0.015, "#103020");
  if (c.whiskers) {
    g.strokeStyle = "rgba(80,70,110,0.8)";
    g.lineWidth = 0.012;
    for (const sd of [-1, 1])
      for (const k of [-0.03, 0.02]) {
        g.beginPath();
        g.moveTo(sd * 0.12, 0.12 + k);
        g.lineTo(sd * 0.36, 0.08 + k * 2);
        g.stroke();
      }
  }
  if (c.cheeks)
    for (const sd of [-1, 1]) {
      g.globalAlpha = 0.7;
      ellipse(g, sd * 0.27, 0.1, 0.07, 0.05, c.cheeks);
      g.globalAlpha = 1;
    }
  if (s.mood === "sleep") {
    g.fillStyle = "#e0e8ff";
    g.font = "0.12px monospace";
    const k = (s.t * 0.5) % 1;
    g.globalAlpha = 1 - k;
    g.fillText("z", 0.3 + k * 0.1, -0.3 - k * 0.15);
    g.globalAlpha = 1;
  }
}

/** Draws a face to fill a square canvas of side `size`: the LED field, then head, extras, eyes and mouth in a unit space centred on the canvas. */
export function drawFace(g: G, c: Character, s: FaceState, size: number): void {
  const bg = g.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, c.field[0]);
  bg.addColorStop(1, c.field[1]);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);
  g.setTransform(size * 0.95, 0, 0, size * 0.95, size / 2, size / 2 + size * 0.04);
  extras(g, c, s.t);
  head(g, c);
  if (c.extras.includes("tricorn") || c.extras.includes("wizard") || c.extras.includes("crest")) extras(g, c, s.t);
  eyes(g, c, s);
  mouth(g, c, s);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
