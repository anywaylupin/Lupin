import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  NormalBlending,
  Points,
  PointsMaterial,
  type Texture,
} from "three";
import type { Rand } from "../math";
import type { Vec3 } from "./plan";

export interface EmitterOptions {
  size: number;
  colour: Color;
  /** Downward pull in units per second squared; negative floats things up, like steam and embers. */
  gravity: number;
  /** Fraction of speed kept each second. */
  drag: number;
  life: number;
  additive?: boolean;
}

/**
 * A pool of particles for one effect: sparks, steam, mist, petals or fireflies.
 * Dead particles are parked far below the city; fading darkens the colour, which on additive blending is the same as lowering the alpha.
 */
export class Emitter {
  points: Points;
  private pos: Float32BufferAttribute;
  private col: Float32BufferAttribute;
  private vel: Float32Array;
  private age: Float32Array;
  private next = 0;

  constructor(
    private n: number,
    glow: Texture,
    private o: EmitterOptions,
  ) {
    const geo = new BufferGeometry();
    this.pos = new Float32BufferAttribute(new Float32Array(n * 3).fill(-1e4), 3);
    this.col = new Float32BufferAttribute(new Float32Array(n * 3), 3);
    geo.setAttribute("position", this.pos);
    geo.setAttribute("color", this.col);
    this.vel = new Float32Array(n * 3);
    this.age = new Float32Array(n).fill(1e9);
    this.points = new Points(
      geo,
      new PointsMaterial({
        size: o.size,
        map: glow,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: o.additive === false ? NormalBlending : AdditiveBlending,
      }),
    );
    this.points.frustumCulled = false;
  }

  /** Emits `count` particles at `at`, each with a velocity from `v`. */
  emit(at: Vec3, count: number, v: (rand: Rand) => [number, number, number], rand: Rand): void {
    for (let k = 0; k < count; k++) {
      const i = this.next;
      this.next = (this.next + 1) % this.n;
      this.pos.setXYZ(i, at.x, at.y, at.z);
      this.vel.set(v(rand), i * 3);
      this.age[i] = 0;
    }
  }

  update(dt: number): void {
    const keep = Math.pow(this.o.drag, dt);
    for (let i = 0; i < this.n; i++) {
      const a = (this.age[i] ?? 1e9) + dt;
      this.age[i] = a;
      if (a > this.o.life) {
        this.col.setXYZ(i, 0, 0, 0);
        continue;
      }
      const j = i * 3;
      const vy = (this.vel[j + 1] ?? 0) - this.o.gravity * dt;
      this.vel[j + 1] = vy;
      for (const k of [0, 1, 2]) this.vel[j + k] = (this.vel[j + k] ?? 0) * keep;
      this.pos.setXYZ(
        i,
        this.pos.getX(i) + (this.vel[j] ?? 0) * dt,
        this.pos.getY(i) + (this.vel[j + 1] ?? 0) * dt,
        this.pos.getZ(i) + (this.vel[j + 2] ?? 0) * dt,
      );
      const f = 1 - a / this.o.life;
      this.col.setXYZ(i, this.o.colour.r * f, this.o.colour.g * f, this.o.colour.b * f);
    }
    this.pos.needsUpdate = true;
    this.col.needsUpdate = true;
  }
}
