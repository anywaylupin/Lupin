import {
  AdditiveBlending,
  BufferGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  Vector4,
} from "three";
import { CYAN, ICE } from "./palette";
import { DOME } from "./plan";

/**
 * The glass barrier: a fresnel rim that glows where the dome turns away from the eye, a highlight sweeping across it, and up to four rings where rain strikes.
 * Additive and depth-blind, so the shrine and the snow inside show through untouched.
 */
const domeShader = {
  vertexShader: `
    varying vec3 vN;
    varying vec3 vView;
    varying vec3 vPos;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vPos = normalize(position);
      vN = normalize(mat3(modelMatrix) * normal);
      vView = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: `
    uniform float uTime;
    uniform float uGlow;
    uniform vec4 uRipples[4];
    uniform vec3 uCyan;
    uniform vec3 uIce;
    varying vec3 vN;
    varying vec3 vView;
    varying vec3 vPos;
    void main() {
      float f = pow(1.0 - abs(dot(vN, vView)), 2.2);
      float sweep = cos(mod(uTime * 0.35, 3.14159));
      float band = smoothstep(0.08, 0.0, abs(vPos.x - sweep)) * 0.5;
      float ring = 0.0;
      for (int i = 0; i < 4; i++) {
        vec4 r = uRipples[i];
        if (r.w < 0.0) continue;
        float d = acos(clamp(dot(vPos, r.xyz), -1.0, 1.0));
        ring += smoothstep(0.035, 0.0, abs(d - r.w * 0.45)) * (1.0 - r.w / 0.5);
      }
      vec3 c = uCyan * (0.06 + 0.7 * f) * (1.0 + uGlow) + uIce * band + uCyan * ring;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

/** Snow inside the dome: each flake falls on its own speed and wraps to the top, and flakes outside the glass are not drawn. */
const snowShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uR;
    attribute float aSeed;
    void main() {
      vec3 p = position;
      p.y = mod(p.y - uTime * (3.0 + aSeed * 4.0), uR);
      p.x += sin(uTime * 0.8 + aSeed * 20.0) * 2.0;
      float inside = step(length(p), uR * 0.96);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (1.2 + aSeed * 1.6) * inside * (300.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uIce;
    void main() {
      if (length(gl_PointCoord - 0.5) > 0.5) discard;
      gl_FragColor = vec4(uIce, 0.85);
    }`,
};

/** The dome on its plinth: the glass, a geodesic lattice over it, and the snow inside. */
export function createDome(time: { value: number }, glow: { value: number }) {
  const g = new Group();
  const rippleU = { value: Array.from({ length: 4 }, () => new Vector4(0, 1, 0, -1)) };
  const glass = new Mesh(
    new SphereGeometry(DOME.r, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    new ShaderMaterial({
      ...domeShader,
      uniforms: { uTime: time, uGlow: glow, uRipples: rippleU, uCyan: { value: CYAN }, uIce: { value: ICE } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  glass.renderOrder = 2;
  const edges = new EdgesGeometry(new IcosahedronGeometry(DOME.r + 0.3, 3), 1);
  const src = edges.getAttribute("position");
  const kept: number[] = [];
  for (let i = 0; i < src.count; i += 2) {
    if (src.getY(i) < -0.5 || src.getY(i + 1) < -0.5) continue;
    kept.push(src.getX(i), src.getY(i), src.getZ(i), src.getX(i + 1), src.getY(i + 1), src.getZ(i + 1));
  }
  const lattice = new BufferGeometry();
  lattice.setAttribute("position", new Float32BufferAttribute(kept, 3));
  const latticeMat = new LineBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.18,
    blending: AdditiveBlending,
  });
  const plinth = new Mesh(
    new CylinderGeometry(DOME.r + 8, DOME.r + 12, 5, 48),
    new MeshLambertMaterial({ color: 0x15132e, emissive: 0x0a0820 }),
  );
  plinth.position.y = -2;
  const rim = new LineLoop(
    new BufferGeometry().setFromPoints(
      Array.from(
        { length: 64 },
        (_, i) =>
          new Vector3(
            Math.cos((i / 64) * Math.PI * 2) * (DOME.r + 8),
            0.6,
            Math.sin((i / 64) * Math.PI * 2) * (DOME.r + 8),
          ),
      ),
    ),
    new LineBasicMaterial({ color: CYAN }),
  );
  const snowPos: number[] = [];
  const seeds: number[] = [];
  for (let i = 0; i < 260; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * DOME.r;
    snowPos.push(Math.cos(a) * r, Math.random() * DOME.r, Math.sin(a) * r);
    seeds.push(Math.random());
  }
  const snowGeo = new BufferGeometry();
  snowGeo.setAttribute("position", new Float32BufferAttribute(snowPos, 3));
  snowGeo.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
  const snow = new Points(
    snowGeo,
    new ShaderMaterial({
      ...snowShader,
      uniforms: { uTime: time, uR: { value: DOME.r }, uIce: { value: ICE } },
      transparent: true,
    }),
  );
  snow.frustumCulled = false;
  g.add(plinth, rim, snow, new LineSegments(lattice, latticeMat), glass);
  return { g, rippleU, latticeMat };
}
