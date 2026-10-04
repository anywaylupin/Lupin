import { AMBER, CYAN, PINK, rgba } from "../theme";

/**
 * The cast, drawn as small vector silhouettes in two or three colours so they read at the size the hole shows them.
 * Every figure is drawn around its own origin at unit scale; callers translate and scale. `t` is seconds, for wings, capes and lights.
 * All designs are original: the Monkey King comes from the public domain Journey to the West, the wall-runner is our own.
 */
type Ctx = CanvasRenderingContext2D;

function hexPath(g: Ctx, x: number, y: number, r: number) {
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.closePath();
}

/** A cyber bee: hex body with pink and cyan running lights in place of stripes, translucent wings beating fast. */
export function bee(g: Ctx, t: number, phase = 0) {
  const flap = Math.sin(t * 38 + phase) * 0.5 + 0.5;
  g.fillStyle = "rgba(190,230,255,0.35)";
  for (const s of [-1, 1]) {
    g.beginPath();
    g.ellipse(s * 4, -5, 6, 2.6 + flap * 2.4, s * (0.6 - flap * 0.5), 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#1b1644";
  hexPath(g, 0, 0, 5.2);
  g.fill();
  g.strokeStyle = rgba(AMBER, 0.95);
  g.lineWidth = 1;
  g.stroke();
  g.fillStyle = rgba(PINK, 1);
  g.fillRect(-3, -1, 2, 2);
  g.fillStyle = rgba(CYAN, 1);
  g.fillRect(1, -1, 2, 2);
  g.fillStyle = "#1b1644";
  g.beginPath();
  g.arc(6.5, -1, 2.6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = rgba(CYAN, 1);
  g.fillRect(7, -2, 1.5, 1.5);
}

/** The Monkey King: visor in place of the headband, a neon-ringed staff, a tail; `stance` 0 stands guard, 1 leaps with the staff overhead. */
export function wukong(g: Ctx, t: number, stance = 0) {
  g.strokeStyle = "#120f2e";
  g.lineCap = "round";
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(-2, -8);
  g.quadraticCurveTo(-10, -6 + Math.sin(t * 3) * 2, -9, -14);
  g.stroke();
  g.fillStyle = "#16123a";
  g.beginPath();
  g.moveTo(-4, -18);
  g.lineTo(4, -18);
  g.lineTo(3.5, -8);
  g.lineTo(-3.5, -8);
  g.closePath();
  g.fill();
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-2, -8);
  g.lineTo(-4 - stance * 3, 0);
  g.moveTo(2, -8);
  g.lineTo(4 + stance * 3, 0);
  g.stroke();
  g.fillStyle = "#1d1847";
  g.beginPath();
  g.arc(0, -21.5, 3.6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = rgba(AMBER, 0.95);
  g.fillRect(-3, -22.5, 6, 1.6);
  g.strokeStyle = rgba(AMBER, 0.9);
  g.lineWidth = 1.4;
  g.beginPath();
  const lift = stance * 14;
  g.moveTo(-10, -16 - lift);
  g.lineTo(10, -10 - lift * 0.4);
  g.stroke();
  g.fillStyle = rgba(PINK, 1);
  for (const k of [-10, 10]) g.fillRect(k - 1, (k < 0 ? -16 - lift : -10 - lift * 0.4) - 1, 2, 2);
}

/** Wukong's hover cloud, a soft pink and amber blur that trails behind him on a leap. */
export function cloud(g: Ctx, t: number) {
  for (let i = 0; i < 4; i++) {
    g.fillStyle = `rgba(255,${180 + i * 12},${200 - i * 20},${0.35 - i * 0.06})`;
    g.beginPath();
    g.ellipse(-i * 5, 2 + Math.sin(t * 6 + i) * 0.8, 9 - i, 3.2, 0, 0, Math.PI * 2);
    g.fill();
  }
}

/** The wall-runner: a lean figure in a cyan-striped suit, legs tucked mid-swing, one arm up on the grapple line. */
export function runner(g: Ctx, t: number) {
  g.strokeStyle = "#141136";
  g.lineCap = "round";
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(0, -12);
  g.lineTo(0, -3);
  g.moveTo(0, -3);
  g.lineTo(-4, 2 + Math.sin(t * 5) * 1.5);
  g.moveTo(0, -3);
  g.lineTo(4, 1);
  g.moveTo(0, -11);
  g.lineTo(0, -18);
  g.moveTo(0, -10);
  g.lineTo(5, -6);
  g.stroke();
  g.strokeStyle = rgba(CYAN, 0.9);
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(0, -12);
  g.lineTo(0, -3);
  g.stroke();
  g.fillStyle = "#1a1642";
  g.beginPath();
  g.arc(0, -14.5, 2.8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = rgba(PINK, 0.95);
  g.fillRect(-2.2, -15.2, 4.4, 1.3);
}

/** An astronaut in a pale suit with a gold visor and a small pack; the pack light blinks. */
export function astronaut(g: Ctx, t: number) {
  g.fillStyle = "#c9cde8";
  g.beginPath();
  g.ellipse(0, -6, 4, 5.5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#9ea4cc";
  g.fillRect(-5.5, -9, 2.5, 6);
  g.strokeStyle = "#c9cde8";
  g.lineCap = "round";
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(-2, -1);
  g.lineTo(-3, 4);
  g.moveTo(2, -1);
  g.lineTo(3, 4);
  g.moveTo(3, -8);
  g.lineTo(6, -5);
  g.stroke();
  g.fillStyle = "#c9cde8";
  g.beginPath();
  g.arc(0, -13, 3.6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = rgba(AMBER, 0.95);
  g.beginPath();
  g.ellipse(1, -13, 2.2, 1.6, 0, 0, Math.PI * 2);
  g.fill();
  if (Math.floor(t * 2) % 2 === 0) {
    g.fillStyle = rgba(PINK, 1);
    g.fillRect(-6, -10, 2, 2);
  }
}

/** A short jetpack plume under a figure, flickering in amber. */
export function plume(g: Ctx, t: number) {
  const len = 6 + Math.sin(t * 30) * 2;
  const gr = g.createLinearGradient(0, 0, 0, len);
  gr.addColorStop(0, rgba(AMBER, 0.9));
  gr.addColorStop(1, rgba(PINK, 0));
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(-4, -2);
  g.lineTo(-2, -2);
  g.lineTo(-3, len);
  g.closePath();
  g.fill();
}
