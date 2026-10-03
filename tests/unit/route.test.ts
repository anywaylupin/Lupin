import { describe, expect, it } from "vitest";
import type { CardData, CellData, HiveData } from "../../src/hive/data";
import { cardAlpha, leafSize, phases } from "../../src/hive/nav";
import {
  HOME_ROUTE,
  normalizePath,
  parentRoute,
  parseRoute,
  routePath,
  routeTitle,
  sameRoute,
} from "../../src/hive/route";

const leaf = { cmd: "cat x.md", title: "X", html: "<p>x</p>", tags: [], links: [] };
const card = (id: string, path: string | null): CardData => ({
  id,
  icon: "box",
  title: id,
  text: null,
  tag: null,
  path,
  pageTitle: path ? `${id} page` : null,
  leaf: path ? leaf : null,
});
const cell = (id: string, cards: CardData[] | null): CellData => ({
  id,
  icon: "user",
  label: id,
  sub: null,
  path: `/${id}/`,
  pageTitle: `${id} page`,
  leaf: cards ? null : leaf,
  cards,
});

const data: HiveData = {
  homeTitle: "Home",
  home: [
    cell("about", null),
    cell("projects", [card("upstream", "/projects/upstream/"), card("juka", "/projects/juka/")]),
    cell("stack", [card("react", null)]),
    cell("now", null),
  ],
};

describe("paths", () => {
  it("normalizes slashes and index files", () => {
    expect(normalizePath("/projects")).toBe("/projects/");
    expect(normalizePath("projects/juka/index.html")).toBe("/projects/juka/");
    expect(normalizePath("/")).toBe("/");
  });
});

describe("routes", () => {
  it("parses home, single pages, sections and card pages", () => {
    expect(parseRoute(data, "/")).toEqual(HOME_ROUTE);
    expect(parseRoute(data, "/about/")).toEqual({ sec: -1, leaf: { where: "front", idx: 0 } });
    expect(parseRoute(data, "/projects")).toEqual({ sec: 1, leaf: null });
    expect(parseRoute(data, "/projects/juka/")).toEqual({ sec: 1, leaf: { where: "back", idx: 2 } });
  });

  it("returns null for unknown paths and for cards without a page", () => {
    expect(parseRoute(data, "/nope/")).toBeNull();
    expect(parseRoute(data, "/stack/react/")).toBeNull();
  });

  it("round trips every known path", () => {
    for (const path of ["/", "/about/", "/projects/", "/projects/upstream/", "/projects/juka/", "/stack/", "/now/"]) {
      const route = parseRoute(data, path);
      expect(route).not.toBeNull();
      if (route) expect(routePath(data, route)).toBe(path);
    }
  });

  it("titles each route and falls back to the home title", () => {
    expect(routeTitle(data, HOME_ROUTE, "Home")).toBe("Home");
    expect(routeTitle(data, { sec: 1, leaf: { where: "back", idx: 1 } }, "Home")).toBe("upstream page");
  });

  it("steps up one level at a time", () => {
    const juka = { sec: 1, leaf: { where: "back", idx: 2 } } as const;
    expect(parentRoute(juka)).toEqual({ sec: 1, leaf: null });
    expect(parentRoute({ sec: 1, leaf: null })).toEqual(HOME_ROUTE);
    expect(parentRoute({ sec: -1, leaf: { where: "front", idx: 0 } })).toEqual(HOME_ROUTE);
  });

  it("compares routes by value", () => {
    expect(sameRoute({ sec: 1, leaf: null }, { sec: 1, leaf: null })).toBe(true);
    expect(sameRoute({ sec: 1, leaf: null }, { sec: 1, leaf: { where: "back", idx: 1 } })).toBe(false);
  });
});

describe("section timing", () => {
  it("blacks out first, moves the hex second and fades cards last", () => {
    expect(phases(0)).toEqual({ A: 0, B: 0, D: 0 });
    expect(phases(0.3).A).toBe(1);
    expect(phases(0.3).D).toBe(0);
    expect(phases(1)).toEqual({ A: 1, B: 1, D: 1 });
  });

  it("fades inner cards in before outer ones", () => {
    expect(cardAlpha(0.8, 1, 10)).toBeGreaterThan(cardAlpha(0.8, 10, 10));
    expect(cardAlpha(1, 10, 10)).toBe(1);
  });

  it("sizes a leaf to the height on wide screens and the width on narrow ones", () => {
    expect(leafSize(1440, 900)).toBeCloseTo(378);
    expect(leafSize(390, 844)).toBeCloseTo((0.9 * 390) / Math.sqrt(3));
  });
});
