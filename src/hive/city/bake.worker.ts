import { bakeCity, type Baked } from "./bake";

/** Bakes the six city layers off the main thread and hands them back as transferable bitmaps. */
const baked = bakeCity<OffscreenCanvas>({
  make: (w, h) => new OffscreenCanvas(w, h),
  ctx: (c) => {
    const g = c.getContext("2d");
    if (!g) throw new Error("OffscreenCanvas 2D is unavailable");
    return g;
  },
});

const message: Baked<ImageBitmap> = {
  layers: baked.layers.map((l) => ({ id: l.id, image: l.image.transferToImageBitmap() })),
  wins: baked.wins,
};

postMessage(message, { transfer: message.layers.map((l) => l.image) });
