import { bounds, rubber, stepZoom, zoomTowards } from "./camera";
import { activeCam, onBack, type Hive } from "./state";
import { TEAR_PX } from "./theme";

/** Hooks the input layer calls into; main wires them to the sheet and nav modules. */
export interface InputHooks {
  firstGesture: () => void;
  canvasDown: (e: PointerEvent) => boolean;
  canvasMove: (e: PointerEvent) => boolean;
  canvasUp: () => void;
  hover: (e: PointerEvent) => void;
  escape: () => void;
}

function sheetRect(h: Hive) {
  const back = onBack(h) ? h.backs[h.nav.sec] : null;
  return back ? back.rect : h.front.rect;
}

/** Pointer, wheel and Escape handling is blocked while a section or leaf transition runs, as in the prototype. */
export function interactive(h: Hive): boolean {
  const n = h.nav;
  return !n.busy && !n.leafOpen && !(n.S > 0 && n.S < 1);
}

/** Starts a pan from any press that nothing else claimed, including presses on the DOM proxies over cells. */
export function startPan(h: Hive, e: PointerEvent): void {
  if (!interactive(h) || e.button !== 0) return;
  const c = activeCam(h);
  h.zoom = null;
  h.drag = { kind: "pan", x: e.clientX, y: e.clientY, cx: c.x, cy: c.y };
  h.dragMoved = false;
}

export function bindInput(h: Hive, cv: HTMLCanvasElement, hooks: InputHooks): void {
  cv.addEventListener("pointerdown", (e) => {
    hooks.firstGesture();
    if (!interactive(h) || e.button !== 0) return;
    if (hooks.canvasDown(e)) return;
    startPan(h, e);
  });
  addEventListener("pointermove", (e) => {
    h.pointer.x = e.clientX;
    h.pointer.y = e.clientY;
    if (hooks.canvasMove(e)) return;
    const d = h.drag;
    if (d?.kind === "pan") {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.hypot(dx, dy) > TEAR_PX) {
        h.dragMoved = true;
        cv.classList.add("dragging");
      }
      if (h.dragMoved) {
        const c = activeCam(h);
        const b = bounds(sheetRect(h), c.z, h.W, h.H);
        const wantX = d.cx - dx / c.z;
        const wantY = d.cy - dy / c.z;
        c.x = b.fits.x ? b.mid.x + (wantX - b.mid.x) * 0.35 : rubber(wantX, b.lo.x, b.hi.x);
        c.y = b.fits.y ? b.mid.y + (wantY - b.mid.y) * 0.35 : rubber(wantY, b.lo.y, b.hi.y);
      }
      return;
    }
    hooks.hover(e);
  });
  addEventListener("pointerup", () => {
    hooks.canvasUp();
    h.drag = null;
    cv.classList.remove("dragging");
    setTimeout(() => (h.dragMoved = false), 0);
  });
  document.documentElement.addEventListener("pointerleave", () => {
    h.pointer.x = h.pointer.y = -9999;
  });
  addEventListener(
    "wheel",
    (e) => {
      if (!interactive(h) || (e.target instanceof Element && e.target.closest(".leaf-inner, #menu"))) return;
      e.preventDefault();
      const c = activeCam(h);
      h.zoom = zoomTowards(c, h.zoom, e.deltaY, e.clientX, e.clientY, h.W, h.H);
      if (!h.reduced) return;
      stepZoom(c, h.zoom, Infinity, h.W, h.H);
      h.zoom = null;
    },
    { passive: false },
  );
  addEventListener("keydown", (e) => {
    hooks.firstGesture();
    if (e.key !== "Escape") return;
    e.preventDefault();
    hooks.escape();
  });
}
