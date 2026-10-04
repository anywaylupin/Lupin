import type { Cam } from "../camera";
import type { Point } from "../hex";
import { bakeCity, type Baked, type LayerId } from "./bake";
import { CH, CW } from "./board";

/** How far behind the sheet each layer sits inside the 900px CSS perspective; the browser does the parallax. */
const DEPTH: Record<LayerId, number> = { sky: 3200, far: 1900, farmid: 1150, mid: 620, nearmid: 300, near: 70 };
const PERSPECTIVE = 900;
/** The board point behind the hole centre, set high enough that phones still see some sky above the skyline. */
export const FOCUS = { x: 960, y: 430 };

/**
 * A depth layer as two stacked canvases: the baked image, painted once and never touched again, and a transparent overlay redrawn each frame.
 * Re-blitting the 1600 by 1000 baked image into a single canvas every frame cost a third of the frame rate under software rendering (35 fps against 56).
 * The far layer never moves, so it has no overlay.
 */
export interface Layer {
  id: LayerId;
  baked: CanvasImageSource;
  base: HTMLCanvasElement;
  el: HTMLCanvasElement | null;
  g: CanvasRenderingContext2D | null;
  d: number;
}

function boardCanvas(): HTMLCanvasElement {
  const el = Object.assign(document.createElement("canvas"), { width: CW, height: CH });
  el.style.width = `${CW}px`;
  el.style.height = `${CH}px`;
  return el;
}

function canBakeOffThread(): boolean {
  try {
    return (
      typeof Worker !== "undefined" &&
      typeof OffscreenCanvas !== "undefined" &&
      !!new OffscreenCanvas(1, 1).getContext("2d")
    );
  } catch {
    return false;
  }
}

function bakeOnMainThread(): Baked<CanvasImageSource> {
  return bakeCity<HTMLCanvasElement>({
    make: (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h }),
    ctx: (c) => {
      const g = c.getContext("2d");
      if (!g) throw new Error("2D canvas is unavailable");
      return g;
    },
  });
}

/** Bakes in a worker where OffscreenCanvas allows it, so the first frames of the sheet are not held up by the skyline. */
export function bake(): Promise<Baked<CanvasImageSource>> {
  if (!canBakeOffThread()) return Promise.resolve(bakeOnMainThread());
  return new Promise((resolve) => {
    const worker = new Worker(new URL("./bake.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<Baked<ImageBitmap>>) => {
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      e.preventDefault();
      worker.terminate();
      resolve(bakeOnMainThread());
    };
  });
}

export function mountCity(root: HTMLElement, baked: Baked<CanvasImageSource>): Layer[] {
  const layers = baked.layers.map(({ id, image }): Layer => {
    const base = boardCanvas();
    base.getContext("2d")?.drawImage(image, 0, 0);
    const el = id === "far" ? null : boardCanvas();
    return { id, baked: image, base, el, g: el?.getContext("2d") ?? null, d: DEPTH[id] };
  });
  const scan = document.createElement("div");
  scan.className = "scan";
  root.replaceChildren(...layers.flatMap((l) => (l.el ? [l.base, l.el] : [l.base])), scan);
  return layers;
}

/**
 * Sets each layer inside the CSS perspective from the sheet camera: panning slides near layers more than far ones, zooming pushes them all forward.
 * At rest the centre of the visible hole shows the board's FOCUS point on every screen, so the city can be composed around one spot.
 * Each layer is then clamped so its canvas edges stay off screen; without it, deep zooms and pans showed the bottom of the board and buildings floated.
 */
export function placeCity(layers: readonly Layer[], cam: Cam, home: Cam, view: Point, W: number, H: number): void {
  const cx = W / 2;
  const cy = H / 2;
  const sBase = Math.max(W / CW, H / CH) * 1.3;
  const hx = view.x;
  const hy = view.y;
  const dx = (cam.x - home.x) * cam.z * 0.9;
  const dy = (cam.y - home.y) * cam.z * 0.9;
  const dz = (1 - 1 / cam.z) * 420;
  for (const L of layers) {
    const f0 = PERSPECTIVE / (PERSPECTIVE + L.d);
    const k = sBase / f0;
    const tz = -L.d + dz;
    const s = PERSPECTIVE / (PERSPECTIVE - tz);
    const left = cx - cx / s;
    const right = cx + (W - cx) / s - k * CW;
    let tx = cx + (hx - cx) / f0 - k * FOCUS.x - dx;
    tx = right <= left ? Math.min(left, Math.max(right, tx)) : (left + right) / 2;
    let ty = Math.max(cy + (H - cy) / s - k * CH, cy + (hy - cy) / f0 - k * FOCUS.y - dy);
    if (L.id === "sky") ty = Math.min(ty, cy - cy / s);
    const transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,${tz.toFixed(1)}px) scale(${k.toFixed(4)})`;
    L.base.style.transform = transform;
    if (L.el) L.el.style.transform = transform;
  }
}
