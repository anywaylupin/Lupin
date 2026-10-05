import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  MeshBasicMaterial,
  MeshLambertMaterial,
  type Material,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { TINTED, type Slot } from "./kit";
import type { Facade } from "./textures";

/** Merges one slot's pieces; every piece must carry the same attributes, so untinted slots drop colour and only the body keeps UVs. */
export function merged(list: BufferGeometry[], slot: Slot): BufferGeometry {
  const flat = list.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (slot !== "body" && n.getAttribute("uv")) n.deleteAttribute("uv");
    if (!TINTED.has(slot) && n.getAttribute("color")) n.deleteAttribute("color");
    if (TINTED.has(slot) && !n.getAttribute("color"))
      n.setAttribute(
        "color",
        new Float32BufferAttribute(new Float32Array(n.getAttribute("position").count * 3).fill(0.5), 3),
      );
    if (!n.getAttribute("normal")) n.computeVertexNormals();
    return n;
  });
  return mergeGeometries(flat) ?? new BufferGeometry();
}

export function materials(facade: Facade) {
  return {
    body: new MeshLambertMaterial({ color: 0x272456, emissive: 0xffffff, emissiveMap: facade.tex }),
    metal: new MeshLambertMaterial({ color: 0x343858, emissive: 0x06070e }),
    stone: new MeshLambertMaterial({ color: 0x6a6478, emissive: 0x0c0a14 }),
    wood: new MeshLambertMaterial({ color: 0x5a1c28, emissive: 0x1a0608 }),
    roof: new MeshLambertMaterial({ vertexColors: true, emissive: 0x06081a, side: DoubleSide }),
    plant: new MeshLambertMaterial({ vertexColors: true, emissive: 0x020a04 }),
    lit: new MeshBasicMaterial({ vertexColors: true }),
    lamp: new MeshBasicMaterial({ color: 0xffb04a }),
    glass: new MeshBasicMaterial({ color: 0x5090d0, transparent: true, opacity: 0.18, depthWrite: false }),
  } satisfies Record<Slot, Material>;
}
