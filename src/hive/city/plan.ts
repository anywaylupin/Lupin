import { lerp, type Rand } from "../math";

/** A point in the city, in world units of about a metre; y is up and the camera looks down negative z. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * The two levels: the upper city stands on a deck at y 0 that ends in a cliff at z `edge`, and the undercity lies on the floor below it.
 * The camera floats in front of the cliff, so the top of the screen shows the upper city and the bottom looks down the cliff face into the undercity.
 */
export const LEVEL = { deck: 0, under: -220, water: -214, edge: 260 } as const;

/** Lumen, the dome: a full sphere on a ring of supports, standing just behind the cliff edge. */
export const DOME = { x: 0, y: 236, z: -40, r: 220 } as const;

/**
 * The camera at rest: a little above the deck, pitched down so the cliff and the undercity fill the lower part of the screen.
 * Phones get a wider lens so the dome still fits their narrow hole.
 */
export const VIEW = {
  eye: { x: 0, y: 300, z: 1250 },
  pitch: -0.21,
  fov: (aspect: number) => (aspect < 1 ? 74 : 42),
} as const;

/** World units the camera moves per pixel of sheet pan; across the three by three screen area that is about 500 units each way. */
export const PAN = 0.25;

/** The subway runs along a viaduct in front of the cliff at this height and depth, through Threadline. */
export const RAIL = { y: -70, z: 330 } as const;

export type Level = "upper" | "edge" | "under" | "sky";

/** A landmark's plot: where it stands and how much room it keeps clear of filler. */
export interface Plot {
  id: string;
  name: string;
  level: Level;
  at: Vec3;
  room: number;
}

/**
 * Every landmark by name, placed round Lumen so the dome's hole shows a ring of them and panning finds the rest.
 * Edge landmarks stand on the undercity floor and climb past the cliff; Owlspire floats free of the ground.
 */
export const PLOTS: readonly Plot[] = [
  { id: "kaleido", name: "Kaleido", level: "upper", at: { x: 520, y: 0, z: -250 }, room: 120 },
  { id: "bell", name: "Bell Crown", level: "upper", at: { x: -500, y: 0, z: -400 }, room: 130 },
  { id: "ironbloom", name: "Ironbloom", level: "upper", at: { x: 960, y: 0, z: -560 }, room: 110 },
  { id: "bamboo", name: "Bamboo Veil", level: "upper", at: { x: -900, y: 0, z: -160 }, room: 120 },
  { id: "steamvault", name: "Steamvault", level: "upper", at: { x: 230, y: 0, z: -760 }, room: 100 },
  { id: "starberth", name: "Starberth", level: "upper", at: { x: -1300, y: 0, z: -560 }, room: 130 },
  { id: "lotus", name: "Lotus Pillar", level: "upper", at: { x: -440, y: 0, z: 120 }, room: 140 },
  { id: "owlspire", name: "Owlspire Academy", level: "sky", at: { x: 700, y: 860, z: -520 }, room: 0 },
  { id: "silverfall", name: "Silverfall", level: "edge", at: { x: -1020, y: 0, z: 140 }, room: 130 },
  { id: "threadline", name: "Threadline", level: "edge", at: { x: -1500, y: -220, z: 330 }, room: 110 },
  { id: "ascender", name: "Ascender", level: "edge", at: { x: 760, y: -220, z: 420 }, room: 90 },
  { id: "lantern", name: "Lantern Steps", level: "under", at: { x: -420, y: -220, z: 330 }, room: 150 },
  { id: "rustcove", name: "Rust Cove", level: "under", at: { x: 280, y: -220, z: 430 }, room: 170 },
  { id: "crucible", name: "The Crucible", level: "under", at: { x: 1250, y: -220, z: 400 }, room: 150 },
];

export function plot(id: string): Plot {
  const p = PLOTS.find((q) => q.id === id);
  if (!p) throw new Error(`no plot ${id}`);
  return p;
}

/** A filler tower: anything that is not a landmark. Far ones are plain blocks; near ones get the cyber kit. */
export interface Filler {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  far: boolean;
  seed: number;
}

function clearOf(x: number, z: number, r: number): boolean {
  if (Math.hypot(x - DOME.x, z - DOME.z) < DOME.r + r + 60) return false;
  return PLOTS.every(
    (p) => p.level === "sky" || p.level === "under" || Math.hypot(x - p.at.x, z - p.at.z) > p.room + r,
  );
}

/**
 * Filler towers on the deck: very tall and packed close, set back from the cliff, kept off every landmark plot.
 * They stand lower toward the middle, opening a wedge of sky over Lumen as the street canyon in the reference does.
 * Within 1400 units of the dome each tower gets its own design from its seed; beyond that they are plain blocks that only make a skyline.
 */
export function planFillers(rand: Rand): Filler[] {
  const out: Filler[] = [];
  for (let z = -260; z > -3200; z -= 150) {
    const far = z < -1500;
    const step = far ? 170 : 150;
    const reach = 1300 + (LEVEL.edge - z) * 0.7;
    for (let x = -reach; x <= reach; x += step) {
      const cx = x + (rand() - 0.5) * 50;
      const cz = z + (rand() - 0.5) * 50;
      const w = (far ? 90 : 70) + rand() * 60;
      if (!clearOf(cx, cz, w * 0.7) || rand() < 0.15) continue;
      const depth = Math.min(1, (LEVEL.edge - cz) / 2400);
      out.push({
        x: cx,
        z: cz,
        w,
        d: w * (0.7 + rand() * 0.4),
        h: lerp(380, 1100, depth) * (0.6 + rand() * 0.7) * (0.45 + 0.55 * Math.min(1, Math.abs(cx) / 1100)),
        far,
        seed: Math.floor(rand() * 1e9),
      });
    }
  }
  return out;
}

/** Shafts through the deck where the undercity's light comes up; kept off plots and the dome. */
export function planShafts(rand: Rand): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; out.length < 9 && i < 200; i++) {
    const x = (rand() - 0.5) * 3000;
    const z = LEVEL.edge - 140 - rand() * 600;
    if (clearOf(x, z, 70) && out.every((s) => Math.hypot(s.x - x, s.z - z) > 260)) out.push({ x, y: 0, z });
  }
  return out;
}

/**
 * The flying dragon's spine: a straight run from `a` to `b` bent by an S curve up and sideways, so it reads as swimming through the air.
 * `u` runs 0 to 1 along the flight; segments behind the head pass a smaller `u`.
 */
export function serpent(a: Vec3, b: Vec3, u: number, amp: number): Vec3 {
  const w = Math.sin(u * Math.PI * 5);
  return {
    x: lerp(a.x, b.x, u),
    y: lerp(a.y, b.y, u) + w * amp + Math.sin(u * Math.PI) * amp * 0.8,
    z: lerp(a.z, b.z, u) + Math.cos(u * Math.PI * 5) * amp * 0.6,
  };
}

/** A screen point in normalised device coordinates, x and y from -1 to 1 with y up. */
export interface Ndc {
  x: number;
  y: number;
}

/** Something that can happen at a place on screen: a landmark's event, or a show staged wherever it is wanted. */
export interface Candidate {
  id: string;
  /** Where it shows on screen right now, or null when it can stage itself anywhere. */
  at: Ndc | null;
  /** Clock time it last ran. */
  last: number;
}

/** A landmark's event can run again after this many seconds; a staged show after a third of that. */
export const COOLDOWN = 24;

/**
 * Picks what happens next for a spot on screen: the landmark nearest the spot that is off cooldown, if one shows within a third of the screen of it, otherwise the staged show that waited longest.
 * Returns the candidate's index, or -1 when everything is cooling down.
 */
export function chooseFor(spot: Ndc, list: readonly Candidate[], now: number): number {
  let best = -1;
  let bd = 0.7;
  list.forEach((c, i) => {
    if (!c.at || now - c.last < COOLDOWN) return;
    const d = Math.hypot(c.at.x - spot.x, c.at.y - spot.y);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  if (best >= 0) return best;
  let age = COOLDOWN / 3;
  list.forEach((c, i) => {
    if (c.at || now - c.last < age) return;
    age = now - c.last;
    best = i;
  });
  return best;
}
