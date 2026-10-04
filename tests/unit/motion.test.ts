import { describe, expect, it } from "vitest";
import { stepZoom, ZOOM_MAX, ZOOM_MIN, zoomTowards } from "../../src/hive/camera";
import { pathStep, type PathChar } from "../../src/hive/overlay/path";

describe("smooth zoom", () => {
  const W = 1000;
  const H = 800;

  it("clamps the target between the zoom limits", () => {
    const c = { x: 0, y: 0, z: 1 };
    expect(zoomTowards(c, null, -1e4, 500, 400, W, H).target).toBe(ZOOM_MAX);
    expect(zoomTowards(c, null, 1e4, 500, 400, W, H).target).toBe(ZOOM_MIN);
  });

  it("accumulates wheel ticks onto the running target", () => {
    const c = { x: 0, y: 0, z: 1 };
    const a = zoomTowards(c, null, -100, 500, 400, W, H);
    const b = zoomTowards(c, a, -100, 500, 400, W, H);
    expect(b.target).toBeGreaterThan(a.target);
  });

  it("eases toward the target over several frames and keeps the anchor under the pointer", () => {
    const c = { x: 0, y: 0, z: 1 };
    const z = zoomTowards(c, null, -200, 800, 200, W, H);
    const anchor = { x: (800 - W / 2) / c.z + c.x, y: (200 - H / 2) / c.z + c.y };
    expect(stepZoom(c, z, 1 / 60, W, H)).toBe(false);
    expect(c.z).toBeGreaterThan(1);
    expect(c.z).toBeLessThan(z.target);
    let frames = 1;
    while (!stepZoom(c, z, 1 / 60, W, H)) frames++;
    expect(frames).toBeGreaterThan(5);
    expect(c.z).toBe(z.target);
    expect((800 - W / 2) / c.z + c.x).toBeCloseTo(anchor.x);
    expect((200 - H / 2) / c.z + c.y).toBeCloseTo(anchor.y);
  });
});

const chars = (s: string): PathChar[] => [...s].map((ch) => ({ ch, cls: "text", noise: false }));
const text = (p: readonly PathChar[]) => p.map((c) => (c.noise ? "?" : c.ch)).join("");

function run(from: string, to: string): string[] {
  const frames: string[] = [];
  let shown = chars(from);
  for (let i = 0; i < 200; i++) {
    const next = pathStep(shown, chars(to));
    if (next === shown) break;
    shown = next;
    frames.push(text(shown));
  }
  return frames;
}

describe("path decrypt", () => {
  it("types new letters in one at a time, each as noise first", () => {
    expect(run("~", "~/ab")).toEqual(["~?", "~/", "~/?", "~/a", "~/a?", "~/ab"]);
  });

  it("scrambles letters out from the end before dropping them", () => {
    expect(run("~/ab", "~")).toEqual(["~/a?", "~/a", "~/?", "~/", "~?", "~"]);
  });

  it("keeps the shared prefix while switching branches", () => {
    const frames = run("~/stack", "~/now");
    expect(frames.every((f) => f.startsWith("~/"))).toBe(true);
    expect(frames.at(-1)).toBe("~/now");
  });

  it("stops when the target is reached", () => {
    const done = chars("~/x");
    expect(pathStep(done, chars("~/x"))).toBe(done);
  });
});
