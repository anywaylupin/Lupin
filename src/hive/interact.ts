import type { Cam } from "./camera";
import { keyOf, toAxial, type Point } from "./hex";
import type { InputHooks } from "./input";
import { applyReset, planReset, settleReset } from "./reset";
import { drop, hitLoose, isLocked, isOpen, isPlain, pickUp, tearOut } from "./sheet";
import { onBack, type Hive } from "./state";
import { TEAR_PX } from "./theme";

function worldPt(h: Hive, e: { clientX: number; clientY: number }, c: Cam): Point {
  return { x: (e.clientX - h.W / 2) / c.z + c.x, y: (e.clientY - h.H / 2) / c.z + c.y };
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
        h.drag = { kind: "loose", ...grab };
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
      if (isPlain(F(), key)) {
        h.pending = { key, q, r, x: e.clientX, y: e.clientY, wp };
        return true;
      }
      return false;
    },
    canvasMove(e) {
      const p = h.pending;
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TEAR_PX) {
        h.drag = { kind: "loose", ...tearOut(F(), p.key, p.q, p.r, p.wp) };
        h.pending = null;
        cv.classList.add("dragging");
        changed();
      }
      if (h.drag?.kind !== "loose") return false;
      const wp = worldPt(h, e, h.frontCam);
      h.drag.loose.x = wp.x - h.drag.ox;
      h.drag.loose.y = wp.y - h.drag.oy;
      return true;
    },
    canvasUp() {
      h.pending = null;
      if (h.drag?.kind !== "loose") return;
      drop(F(), h.drag.loose, performance.now());
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

/** Flies every loose hex home, then heals the sheet once the last one has landed. */
export function resetSheet(h: Hive, changed: () => void): void {
  const F = h.front;
  const plan = planReset(F, h.reduced);
  applyReset(F, plan, performance.now());
  changed();
  setTimeout(() => {
    if (h.front !== F) return;
    settleReset(F);
    changed();
  }, plan.settleAfter);
}
