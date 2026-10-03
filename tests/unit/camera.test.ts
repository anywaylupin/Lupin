import { describe, expect, it } from "vitest";
import { bounds, camLerp, restOf, rubber } from "../../src/hive/camera";

describe("camera", () => {
  it("interpolates zoom in log space and lands on both ends", () => {
    const a = { x: 0, y: 0, z: 1 };
    const b = { x: 100, y: 50, z: 4 };
    expect(camLerp(a, b, 0)).toEqual(a);
    const end = camLerp(a, b, 1);
    expect(end.x).toBeCloseTo(100);
    expect(end.z).toBeCloseTo(4);
    expect(camLerp(a, b, 0.5).z).toBeCloseTo(2);
  });

  it("centres a sheet smaller than the screen", () => {
    const r = { x0: -100, x1: 100, y0: -50, y1: 50 };
    expect(bounds(r, 1, 800, 600).fits).toEqual({ x: true, y: true });
    expect(restOf(r, { x: 300, y: -200, z: 1 }, 800, 600)).toEqual({ x: 0, y: 0 });
  });

  it("clamps inside a sheet larger than the screen", () => {
    const r = { x0: -1000, x1: 1000, y0: -1000, y1: 1000 };
    expect(restOf(r, { x: 5000, y: 0, z: 1 }, 800, 600)).toEqual({ x: 600, y: 0 });
  });

  it("stretches past the bounds at a third of the distance", () => {
    expect(rubber(5, 0, 10)).toBe(5);
    expect(rubber(20, 0, 10)).toBeCloseTo(13.5);
    expect(rubber(-10, 0, 10)).toBeCloseTo(-3.5);
  });
});
