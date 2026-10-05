import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { rng } from "../math";

/**
 * True on software WebGL, as in Lighthouse and headless test runs.
 * In a headless run the sheet fell from about 12 fps to 2 with the city drawing every frame; at half resolution and one frame in twelve it holds 9.
 */
export function softwareGl(renderer: WebGLRenderer): boolean {
  const gl = renderer.getContext();
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  return /swiftshader|llvmpipe|software/i.test(name);
}

/** Frames between city renders on software WebGL. */
export const SOFT_EVERY = 12;

/** The glitch belongs to the city, not the cursor: every three to seven and a half seconds it fires for 140 to 260 ms. */
export function glitchTimer() {
  let next = 2.5;
  let until = 0;
  let seed = 0;
  return (clock: number, enabled: boolean) => {
    if (!enabled) return null;
    if (clock > next) {
      until = clock + 0.14 + Math.random() * 0.12;
      next = clock + 3 + Math.random() * 4.5;
      seed = (Math.random() * 1e6) | 0;
    }
    return clock < until ? seed : null;
  };
}

/** Slices of the frame slip sideways with pink and cyan seams, re-rendered through an offset view inside a scissor. */
export function glitchSlices(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  W: number,
  H: number,
  seed: number,
): void {
  const r = rng(seed);
  renderer.autoClear = false;
  renderer.setScissorTest(true);
  for (let k = 0; k < 3; k++) {
    const y = Math.floor(r() * H);
    const h = 4 + Math.floor(r() * 30);
    camera.setViewOffset(W, H, (r() - 0.5) * 80, 0, W, H);
    renderer.setScissor(0, y, W, h);
    renderer.clear();
    renderer.render(scene, camera);
    for (const [yy, c] of [
      [y, 0x2f6a78],
      [y + h, 0x7a2a5c],
    ] as const) {
      renderer.setScissor(0, yy, W, 1);
      renderer.setClearColor(c, 1);
      renderer.clear(true, false, false);
    }
  }
  camera.clearViewOffset();
  renderer.setClearColor(0x000000, 1);
  renderer.setScissorTest(false);
  renderer.autoClear = true;
}
