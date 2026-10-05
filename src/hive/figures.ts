import { AMBER, CYAN, PINK, rgba } from "./theme";

/**
 * The flat cast for the sheet and the page vignettes, drawn as small vector silhouettes in two or three colours.
 * Every figure is drawn around its own origin at unit scale; callers translate and scale. `t` is seconds, for wings and lights.
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
