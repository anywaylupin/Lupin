import type { Cam } from "./camera";
import { ax, keyOf, toAxial, type Point } from "./hex";
import type { InputHooks } from "./input";
import { applyReset, planReset, RESET_MS, settleReset } from "./reset";
import { clamp } from "./math";
import { heldLook } from "./render";
import { drop, hitLoose, isLocked, isOpen, isPlain, magnetFor, pickUp, tearOut, toggleGlass } from "./sheet";
import { onBack, type Hive } from "./state";
import { TEAR_PX } from "./theme";

function worldPt(h: Hive, e: { clientX: number; clientY: number }, c: Cam): Point {
  return { x: (e.clientX - h.W / 2) / c.z + c.x, y: (e.clientY - h.H / 2) / c.z + c.y };
}

/** Tells the city a hex opened, at the cell's centre on screen. */
function revealAt(h: Hive, q: number, r: number): void {
  const p = ax(q, r, h.front.R);
  const c = h.frontCam;
  h.city?.reveal((p.x - c.x) * c.z + h.W / 2, (p.y - c.y) * c.z + h.H / 2);
}

/**
 * Loose hexes can be picked up and dropped into any empty slot nearby; bolted hexes shake when grabbed; anywhere else the drag pans the sheet.
 * Dragging is decorative: the canvas is hidden from assistive tech and Reset in settings puts everything back from the keyboard.
 */
export function sheetHooks(
  h: Hive,
  cv: HTMLCanvasElement,
  changed: () => void,
): Pick<InputHooks, "canvasDown" | "canvasMove" | "canvasUp" | "hover"> {
  const F = () => h.front;
  return {
    canvasDown(e) {
      if (onBack(h)) return false;
      const wp = worldPt(h, e, h.frontCam);
      const li = hitLoose(F(), wp);
      if (li >= 0) {
        const grab = pickUp(F(), li, wp);
        if (!grab) return false;
        h.drag = { kind: "loose", ...grab, t0: performance.now(), lean: 0, lastX: e.clientX };
        cv.classList.add("dragging");
        changed();
        return true;
      }
      const [q, r] = toAxial(wp.x, wp.y, F().R);
      const key = keyOf(q, r);
      if (isLocked(F(), q, r, h.W, h.H)) {
        F().shake = { key, t0: performance.now() };
        return false;
      }
      const glass = h.prefs.glass;
      if (isPlain(F(), key) || (glass && F().glass.has(key))) {
        h.pending = { glass, key, q, r, x: e.clientX, y: e.clientY, wp };
        return true;
      }
      return false;
    },
    canvasMove(e) {
      const p = h.pending;
      if (p?.glass && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TEAR_PX) {
        h.pending = null;
        const c = h.frontCam;
        h.drag = { kind: "pan", x: p.x, y: p.y, cx: c.x, cy: c.y };
        h.dragMoved = false;
        return false;
      }
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TEAR_PX) {
        const torn = tearOut(F(), p.key, p.q, p.r, p.wp);
        revealAt(h, p.q, p.r);
        h.drag = { kind: "loose", ...torn, t0: performance.now(), lean: 0, lastX: e.clientX };
        h.pending = null;
        cv.classList.add("dragging");
        changed();
      }
      const d = h.drag;
      if (d?.kind !== "loose") return false;
      const wp = worldPt(h, e, h.frontCam);
      d.loose.x = wp.x - d.ox;
      d.loose.y = wp.y - d.oy;
      d.lean = clamp(d.lean * 0.7 + (e.clientX - d.lastX) * 0.004, -0.2, 0.2);
      d.lastX = e.clientX;
      return true;
    },
    canvasUp() {
      const p = h.pending;
      h.pending = null;
      if (p?.glass) {
        if (toggleGlass(F(), p.key)) revealAt(h, p.q, p.r);
        changed();
        return;
      }
      const d = h.drag;
      if (d?.kind !== "loose") return;
      const now = performance.now();
      const look = heldLook(h, d, magnetFor(F(), d.loose), now);
      drop(F(), d.loose, now, look.rot, -look.dy);
      changed();
    },
    hover(e) {
      h.hoverLoose = -1;
      cv.classList.remove("over-loose", "over-lock");
      const n = h.nav;
      if (onBack(h) || n.S !== 0 || n.busy || n.leafOpen) return;
      const wp = worldPt(h, e, h.frontCam);
      h.hoverLoose = hitLoose(F(), wp);
      if (h.hoverLoose >= 0) {
        cv.classList.add("over-loose");
        return;
      }
      const [q, r] = toAxial(wp.x, wp.y, F().R);
      const key = keyOf(q, r);
      if (isLocked(F(), q, r, h.W, h.H)) cv.classList.add("over-lock");
      else if (!F().content.has(key) && !isOpen(F(), key)) cv.classList.add("over-loose");
    },
  };
}

/** Bees fly every loose hex home, then the sheet heals once the last one has landed. */
export function resetSheet(h: Hive, changed: () => void): void {
  const F = h.front;
  F.glass.clear();
  const plan = planReset(F, h.reduced);
  const now = performance.now();
  applyReset(F, plan, now);
  h.carriers = h.reduced
    ? []
    : plan.moves.flatMap((m) => {
        const l = F.loose[m.hex];
        return l ? [{ l, t0: now, delay: m.delay, dur: RESET_MS, from: null }] : [];
      });
  changed();
  setTimeout(() => {
    if (h.front !== F) return;
    settleReset(F);
    changed();
  }, plan.settleAfter);
}
