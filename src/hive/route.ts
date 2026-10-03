import type { HiveData } from "./data";

/**
 * Where the hive is: an open section index (or -1) and an open leaf.
 * A back leaf indexes the back sheet, where item 0 is the Back cell, so card k sits at k + 1.
 */
export interface Route {
  sec: number;
  leaf: { where: "front" | "back"; idx: number } | null;
}

export const HOME_ROUTE: Route = { sec: -1, leaf: null };

export function normalizePath(pathname: string): string {
  const path = pathname.replace(/index\.html$/, "");
  const lead = path.startsWith("/") ? path : `/${path}`;
  return lead.endsWith("/") ? lead : `${lead}/`;
}

/** Maps a URL path to a route, or null when the path is not one the hive knows. */
export function parseRoute(data: HiveData, pathname: string): Route | null {
  const path = normalizePath(pathname);
  if (path === "/") return HOME_ROUTE;
  for (const [i, cell] of data.home.entries()) {
    if (cell.path === path) return cell.cards ? { sec: i, leaf: null } : { sec: -1, leaf: { where: "front", idx: i } };
    const k = cell.cards?.findIndex((c) => c.path === path && c.leaf) ?? -1;
    if (k >= 0) return { sec: i, leaf: { where: "back", idx: k + 1 } };
  }
  return null;
}

function routeTarget(data: HiveData, route: Route): { path: string | null; pageTitle: string | null } | null {
  if (route.leaf?.where === "front") return data.home[route.leaf.idx] ?? null;
  const cell = route.sec >= 0 ? data.home[route.sec] : undefined;
  if (!cell) return null;
  if (route.leaf?.where === "back") return cell.cards?.[route.leaf.idx - 1] ?? null;
  return cell;
}

export function routePath(data: HiveData, route: Route): string {
  return routeTarget(data, route)?.path ?? "/";
}

export function routeTitle(data: HiveData, route: Route, homeTitle: string): string {
  return routeTarget(data, route)?.pageTitle ?? homeTitle;
}

export function sameRoute(a: Route, b: Route): boolean {
  return a.sec === b.sec && a.leaf?.where === b.leaf?.where && a.leaf?.idx === b.leaf?.idx;
}

/** One level up: a leaf closes to its section or home, a section closes to home. */
export function parentRoute(route: Route): Route {
  if (route.leaf?.where === "back") return { sec: route.sec, leaf: null };
  return HOME_ROUTE;
}
