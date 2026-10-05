import { Vector2, WebGLRenderer, type PerspectiveCamera, type Scene } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { rng } from "../math";

/**
 * True on software WebGL, as in Lighthouse and headless test runs.
 * In a headless run the sheet fell from about 12 fps to 2 with the city drawing every frame, so there the city starts in low graphics and draws one frame in twelve.
 */
function softwareGl(renderer: WebGLRenderer): boolean {
  const gl = renderer.getContext();
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  return /swiftshader|llvmpipe|software/i.test(name);
}

/** Torn horizontal bands slipping sideways, a colour split and pink seams, from a per-glitch seed. */
const glitchShader = {
  uniforms: { tDiffuse: { value: null }, uSeed: { value: 0 } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uSeed;
    varying vec2 vUv;
    float h(float n) { return fract(sin(n) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      float band = floor(uv.y * 28.0);
      float r = h(band + uSeed);
      if (r > 0.82) uv.x += (h(band * 3.1 + uSeed) - 0.5) * 0.14;
      float split = 0.004 + 0.01 * step(0.9, r);
      vec4 c = vec4(texture2D(tDiffuse, uv + vec2(split, 0.0)).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - vec2(split, 0.0)).b, 1.0);
      if (r > 0.82 && fract(uv.y * 28.0) < 0.06) c.rgb += vec3(0.5, 0.1, 0.4);
      gl_FragColor = c;
    }`,
};

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

export interface Post {
  renderer: WebGLRenderer;
  soft: boolean;
  setSize: (W: number, H: number, dpr: number) => void;
  setLow: (low: boolean) => void;
  /** Draws a frame; `glitch` is the glitch seed while one runs, `lens` the camera's resting view offset. */
  render: (glitch: number | null, lens: { x: number; y: number }) => void;
}

/**
 * Full graphics renders through bloom and a glitch pass; low graphics renders straight to the screen at pixel ratio 1 and glitches by re-rendering a few scissored bands through a shifted lens.
 * Bloom picks up the neon, lamps, screens and the dome, which is most of what moves the city from neon blocks to the lit haze of the reference.
 */
export function createPost(scene: Scene, camera: PerspectiveCamera): Post {
  const renderer = new WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  const soft = softwareGl(renderer);
  const composer = new EffectComposer(renderer);
  const pass = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.7, 0.5, 0.78);
  const glitch = new ShaderPass(glitchShader);
  glitch.enabled = false;
  composer.addPass(pass);
  composer.addPass(bloom);
  composer.addPass(glitch);
  composer.addPass(new OutputPass());
  let low = false;
  let W = 1;
  let H = 1;
  let ratio = 1;
  const apply = () => {
    const pr = low || soft ? (soft ? 0.5 : 1) : Math.min(ratio, 1.5);
    renderer.setPixelRatio(pr);
    renderer.setSize(W, H);
    composer.setPixelRatio(pr);
    composer.setSize(W, H);
  };
  return {
    renderer,
    soft,
    setSize: (w, h, dpr) => {
      W = w;
      H = h;
      ratio = dpr;
      apply();
    },
    setLow: (l) => {
      low = l;
      apply();
    },
    render: (seed, lens) => {
      if (!low) {
        glitch.enabled = seed !== null;
        const u = glitch.uniforms["uSeed"];
        if (u && seed !== null) u.value = (seed % 1000) / 10;
        composer.render();
        return;
      }
      renderer.render(scene, camera);
      if (seed === null) return;
      const r = rng(seed);
      renderer.autoClear = false;
      renderer.setScissorTest(true);
      for (let k = 0; k < 3; k++) {
        const y = Math.floor(r() * H);
        const h = 4 + Math.floor(r() * 30);
        camera.setViewOffset(W, H, lens.x + (r() - 0.5) * 80, lens.y, W, H);
        renderer.setScissor(0, y, W, h);
        renderer.clear();
        renderer.render(scene, camera);
      }
      camera.setViewOffset(W, H, lens.x, lens.y, W, H);
      renderer.setScissorTest(false);
      renderer.autoClear = true;
    },
  };
}
