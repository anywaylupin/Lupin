import { CYAN, PINK, rgba } from "../theme";
import { CH, type Ctx2D } from "./board";
import { bezier, coasterAt, PLAN } from "./plan";

/** Samples per track; enough that the helix and loop stay round at the largest zoom. */
const STEPS = 320;

/**
 * The coaster rail, baked in two passes around the cylinder tower: the stretches behind it first, the ones in front after the tower is painted.
 * Supports drop from the lift hill and the loop to the ground.
 */
export function coasterTrack(g: Ctx2D, pass: "behind" | "front") {
  g.lineWidth = 3;
  g.strokeStyle = pass === "behind" ? "#20235a" : "#3a3f96";
  g.beginPath();
  let drawing = false;
  for (let i = 0; i <= STEPS; i++) {
    const p = coasterAt(i / STEPS);
    const show = pass === "behind" ? p.side < 0 : p.side >= 0;
    if (show && drawing) g.lineTo(p.x, p.y);
    else if (show) g.moveTo(p.x, p.y);
    drawing = show;
  }
  g.stroke();
  if (pass === "behind") return;
  g.strokeStyle = rgba(CYAN, 0.35);
  g.lineWidth = 1;
  g.stroke();
  g.fillStyle = "#14153c";
  for (let t = 0.84; t < 1; t += 0.05) {
    const p = coasterAt(t);
    g.fillRect(p.x - 2, p.y, 4, CH - p.y);
  }
  const c = PLAN.coaster;
  g.fillRect(c.loopX - 3, c.loopY + c.loopR, 6, CH - c.loopY - c.loopR);
}

/** The vacuum tube: a wide translucent glass sleeve with a bright upper highlight, slung between the arcology and the pagoda. */
export function tube(g: Ctx2D) {
  const pts = PLAN.tube;
  const path = () => {
    g.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const p = bezier(pts, i / STEPS);
      if (i) g.lineTo(p.x, p.y);
      else g.moveTo(p.x, p.y);
    }
  };
  g.lineCap = "round";
  path();
  g.strokeStyle = "rgba(120,190,255,0.12)";
  g.lineWidth = 18;
  g.stroke();
  g.strokeStyle = rgba(CYAN, 0.45);
  g.lineWidth = 1.5;
  g.save();
  g.translate(0, -8);
  path();
  g.stroke();
  g.restore();
  g.strokeStyle = rgba(PINK, 0.3);
  g.save();
  g.translate(0, 8);
  path();
  g.stroke();
  g.restore();
  g.lineCap = "butt";
  for (const t of [0.25, 0.5, 0.75]) {
    const p = bezier(pts, t);
    g.fillStyle = "#16173f";
    g.fillRect(p.x - 3, p.y + 9, 6, CH - p.y - 9);
  }
}
