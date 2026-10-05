import type { Group, Texture } from "three";
import type { Rand } from "../math";
import type { Boards } from "./billboards";
import type { Parts } from "./kit";
import type { Vec3 } from "./plan";

/** A named building with its own design and its own event. */
export interface Landmark {
  id: string;
  name: string;
  /** Where its event happens, used to find the landmark behind an open hex. */
  anchor: Vec3;
  /** Its moving parts; the static ones are merged into the city through `Kit.p`. */
  group: Group;
  update: (dt: number, t: number) => void;
  trigger: () => void;
}

/** What every landmark builder gets: the shared parts collector, textures, billboards, the clock and a seeded random. */
export interface Kit {
  p: Parts;
  glow: Texture;
  boards: Boards;
  time: { value: number };
  rand: Rand;
}
