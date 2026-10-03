import { bakeCity, type Baked } from "./bake";

/**
 * Bakes the six city layers off the main thread and hands them back as transferable bitmaps.
 * `willReadFrequently` keeps the canvases on the CPU: GPU-backed bitmaps forced a synchronous readback when drawn on the main thread, a 680 ms stall that took Lighthouse blocking time from 150 ms to 2.9 s.
 */
const baked = bakeCity<OffscreenCanvas>({
  make: (w, h) => new OffscreenCanvas(w, h),
  ctx: (c) => {
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) throw new Error("OffscreenCanvas 2D is unavailable");
    return g;
  },
});

const message: Baked<ImageBitmap> = {
  layers: baked.layers.map((l) => ({ id: l.id, image: l.image.transferToImageBitmap() })),
  wins: baked.wins,
};

postMessage(message, { transfer: message.layers.map((l) => l.image) });
