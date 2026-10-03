import type { Cam } from "../camera";
import type { Point } from "../hex";
import { bakeCity, CH, CW, type Baked, type LayerId } from "./bake";

/** How far behind the sheet each layer sits inside the 900px CSS perspective; the browser does the parallax. */
const DEPTH: Record<LayerId, number> = { sky: 3200, far: 1900, farmid: 1150, mid: 620, nearmid: 300, near: 70 };
const PERSPECTIVE = 900;
/** The board point that lines up with the hole centre, just above the horizon. */
const FOCUS = { x: 800, y: 470 };

export interface Layer {
  id: LayerId;
  baked: CanvasImageSource;
  el: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  d: number;
  dirty: boolean;
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
    const el = Object.assign(document.createElement("canvas"), { width: CW, height: CH });
    el.style.width = `${CW}px`;
    el.style.height = `${CH}px`;
    const g = el.getContext("2d");
    if (!g) throw new Error("2D canvas is unavailable");
    g.drawImage(image, 0, 0);
    return { id, baked: image, el, g, d: DEPTH[id], dirty: false };
  });
  const scan = document.createElement("div");
  scan.className = "scan";
  root.replaceChildren(...layers.map((l) => l.el), scan);
  return layers;
}

/**
 * Sets each layer inside the CSS perspective from the sheet camera: panning slides near layers more than far ones, zooming pushes them all forward.
 * The hole centre shifts the focus a little so the skyline sits behind the broken patch.
 */
export function placeCity(layers: readonly Layer[], cam: Cam, home: Cam, hc: Point, W: number, H: number): void {
  const cx = W / 2;
  const cy = H / 2;
  const sBase = Math.max(W / CW, H / CH) * 1.3;
  const hx = cx + 0.35 * (hc.x - home.x);
  const hy = cy + 0.35 * (hc.y - home.y);
  const dx = (cam.x - home.x) * cam.z * 0.9;
  const dy = (cam.y - home.y) * cam.z * 0.9;
  const dz = (1 - 1 / cam.z) * 420;
  for (const L of layers) {
    const f0 = PERSPECTIVE / (PERSPECTIVE + L.d);
    const k = sBase / f0;
    const tz = -L.d + dz;
    const tx = cx + (hx - cx) / f0 - k * FOCUS.x - dx;
    const ty = cy + (hy - cy) / f0 - k * FOCUS.y - dy;
    L.el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,${tz.toFixed(1)}px) scale(${k.toFixed(4)})`;
  }
}
