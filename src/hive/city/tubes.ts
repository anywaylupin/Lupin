import {
  AdditiveBlending,
  BoxGeometry,
  CatmullRomCurve3,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  TubeGeometry,
  Vector3,
} from "three";
import { LEVEL } from "./plan";

/** A glass tube: its path, whether it closes on itself, how many capsules ride it and how fast. */
interface Tube {
  kind: "road" | "line" | "lift";
  points: readonly [number, number, number][];
  closed: boolean;
  capsules: number;
  speed: number;
  r: number;
}

const E = LEVEL.edge;

/**
 * The tube network: road tubes slung between landmarks behind Lumen, a maglev line looping over the upper city, lift tubes climbing the cliff and an undercity tube along its foot.
 * Lift capsules ride up and back down; the others run round.
 */
const TUBES: readonly Tube[] = [
  {
    kind: "road",
    points: [
      [520, 300, -180],
      [200, 340, -330],
      [-200, 340, -360],
      [-500, 360, -330],
    ],
    closed: false,
    capsules: 5,
    speed: 0.05,
    r: 9,
  },
  {
    kind: "road",
    points: [
      [230, 420, -700],
      [600, 400, -640],
      [960, 380, -500],
    ],
    closed: false,
    capsules: 3,
    speed: 0.07,
    r: 8,
  },
  {
    kind: "road",
    points: [
      [-900, 260, -100],
      [-1150, 290, -320],
      [-1300, 300, -480],
    ],
    closed: false,
    capsules: 3,
    speed: 0.07,
    r: 8,
  },
  {
    kind: "line",
    points: [
      [700, 560, -300],
      [0, 600, -560],
      [-700, 560, -300],
      [-400, 540, -120],
      [400, 540, -120],
    ],
    closed: true,
    capsules: 6,
    speed: 0.03,
    r: 6,
  },
  {
    kind: "lift",
    points: [
      [-200, LEVEL.under, E + 30],
      [-200, 30, E + 30],
    ],
    closed: false,
    capsules: 2,
    speed: 0.12,
    r: 7,
  },
  {
    kind: "lift",
    points: [
      [1100, LEVEL.under, E + 30],
      [1100, 30, E + 30],
    ],
    closed: false,
    capsules: 2,
    speed: 0.1,
    r: 7,
  },
  {
    kind: "road",
    points: [
      [-2600, -120, E + 110],
      [-900, -110, E + 120],
      [900, -125, E + 110],
      [2600, -115, E + 120],
    ],
    closed: false,
    capsules: 6,
    speed: 0.025,
    r: 8,
  },
];

const dummy = new Object3D();

export interface Tubes {
  group: Group;
  update: (t: number) => void;
}

export function createTubes(): Tubes {
  const group = new Group();
  const glass = new MeshBasicMaterial({
    color: 0x4080c0,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const glow = [0xff60c0, 0x60e0ff, 0xffc060].map((c) => new MeshBasicMaterial({ color: c }));
  const runs = TUBES.map((tube, i) => {
    const curve = new CatmullRomCurve3(
      tube.points.map(([x, y, z]) => new Vector3(x, y, z)),
      tube.closed,
    );
    const mesh = new Mesh(new TubeGeometry(curve, tube.kind === "lift" ? 2 : 80, tube.r, 10, tube.closed), glass);
    const caps = new InstancedMesh(
      new BoxGeometry(tube.r * 2.4, tube.r * 1.1, tube.r * 1.1),
      glow[i % 3] ?? glass,
      tube.capsules,
    );
    caps.frustumCulled = false;
    group.add(mesh, caps);
    return { tube, curve, caps };
  });
  const ahead = new Vector3();
  return {
    group,
    update: (t) => {
      for (const { tube, curve, caps } of runs) {
        for (let k = 0; k < tube.capsules; k++) {
          let u = (t * tube.speed + k / tube.capsules) % 1;
          if (tube.kind === "lift") u = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
          else if (!tube.closed && k % 2) u = 1 - u;
          const p = curve.getPointAt(u);
          curve.getPointAt(Math.min(0.999, u + 0.002), ahead);
          dummy.position.copy(p);
          if (tube.kind === "lift") dummy.rotation.set(0, 0, Math.PI / 2);
          else dummy.lookAt(ahead);
          if (tube.kind !== "lift") dummy.rotateY(Math.PI / 2);
          dummy.updateMatrix();
          caps.setMatrixAt(k, dummy.matrix);
        }
        caps.instanceMatrix.needsUpdate = true;
      }
    },
  };
}
