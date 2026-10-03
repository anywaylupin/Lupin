import { camLerp, type Cam } from "./camera";
import { SQ3, type Point } from "./hex";
import type { Placed } from "./layout";
import { clamp, ease, lerp } from "./math";
import { HOME_ROUTE, parentRoute, parseRoute, routePath, routeTitle, sameRoute, type Route } from "./route";
import type { Hive, Where } from "./state";
import { FLIP_MS, HEX, SEC_MS } from "./theme";

/** DOM work the navigation timers trigger; main wires these to the overlay modules. */
export interface NavUI {
  rebuild: () => void;
  showLeaf: (moveFocus: boolean) => void;
  hideLeaf: () => void;
  busy: (on: boolean) => void;
  settled: (from: Route) => void;
  sectionChange: (closing: boolean) => void;
  veil: (on: boolean) => Promise<void>;
}

/**
 * Opening a section runs on one timer: the screen goes black around the chosen hex (A), the hex slides to the centre as it turns into Back (B), then the cards fade in where they sit (D).
 */
export function phases(S: number) {
  return { A: ease(clamp(S / 0.3, 0, 1)), B: ease(clamp((S - 0.2) / 0.45, 0, 1)), D: clamp((S - 0.6) / 0.4, 0, 1) };
}

/** Cards fade in from the centre outwards, the last starting 60% of the way through the fade. */
export function cardAlpha(S: number, k: number, n: number): number {
  return ease(clamp(phases(S).D * 1.6 - (k / Math.max(n, 1)) * 0.6, 0, 1));
}

/** A leaf zooms until its hex fills 42% of the height, or 90% of the width on narrow screens. */
export function leafSize(W: number, H: number): number {
  return Math.min(0.42 * H, (0.9 * W) / SQ3);
}

/** The hex travelling from its slot on the front sheet to the centre of the back sheet, in screen space. */
export function movingHex(h: Hive): Point & { size: number; flip: number } {
  const p = h.front.powered[h.nav.sec] ?? { x: 0, y: 0 };
  const { B } = phases(h.nav.S);
  const R = h.front.R;
  const f = h.frontCam;
  const b = h.backCam;
  const s0 = { x: (p.x - f.x) * f.z + h.W / 2, y: (p.y - f.y) * f.z + h.H / 2, size: R * HEX * f.z };
  const s1 = { x: -b.x * b.z + h.W / 2, y: -b.y * b.z + h.H / 2, size: R * HEX * b.z };
  return { x: lerp(s0.x, s1.x, B), y: lerp(s0.y, s1.y, B), size: lerp(s0.size, s1.size, B), flip: B };
}

export function leafItem(h: Hive, where: Where, idx: number): Placed | undefined {
  return where === "front" ? h.front.powered[idx] : h.backs[h.nav.sec]?.items[idx];
}

export function currentRoute(h: Hive): Route {
  const n = h.nav;
  const leaf = n.leafOpen ? { where: n.leafOpen.where, idx: n.leafOpen.idx } : null;
  return { sec: n.sec, leaf };
}

/** Marks history entries the hive pushed, so in-app Back can step back through them instead of piling up new ones. */
const PUSHED = { hive: true } as const;

function isPushed(state: unknown): boolean {
  return typeof state === "object" && state !== null && "hive" in state;
}

export type Nav = ReturnType<typeof createNavigator>;

export function createNavigator(h: Hive, ui: NavUI, homeTitle: string) {
  const n = h.nav;

  const leafTarget = (where: Where, idx: number): Cam | null => {
    const it = leafItem(h, where, idx);
    return it ? { x: it.x, y: it.y, z: leafSize(h.W, h.H) / (h.front.R * HEX) } : null;
  };

  const setBusy = (on: boolean) => {
    n.busy = on;
    ui.busy(on);
  };

  const syncUrl = (push: boolean) => {
    const route = currentRoute(h);
    document.title = routeTitle(h.data, route, homeTitle);
    const path = routePath(h.data, route);
    if (!push || location.pathname === path) return;
    try {
      history.pushState(PUSHED, "", path);
    } catch {}
  };

  const done = (push: boolean, from: Route) => {
    setBusy(false);
    syncUrl(push);
    ui.settled(from);
    step();
  };

  const openSection = (i: number, push = true) => {
    if (n.busy || n.sec >= 0 || !h.backs[i]) return;
    const from = currentRoute(h);
    setBusy(true);
    n.sec = i;
    Object.assign(h.backCam, h.backs[i]?.home);
    ui.rebuild();
    n.secAnim = { dir: "in", t0: performance.now(), done: () => done(push, from) };
    ui.sectionChange(false);
  };

  const closeSection = (push = true) => {
    if (n.busy || n.sec < 0) return;
    const from = currentRoute(h);
    setBusy(true);
    n.secAnim = {
      dir: "out",
      t0: performance.now(),
      done: () => {
        n.sec = -1;
        ui.rebuild();
        done(push, from);
      },
    };
    ui.sectionChange(true);
  };

  /** A page hex flips while the view zooms in on it, on the same eased timer, until its back face is big enough to read. */
  const openLeaf = (where: Where, idx: number, push = true) => {
    const target = leafTarget(where, idx);
    if (n.busy || n.leafOpen || !target) return;
    const from = currentRoute(h);
    setBusy(true);
    const base = { ...(where === "front" ? h.frontCam : h.backCam) };
    n.cardFlip = {
      where,
      idx,
      dir: "in",
      t0: performance.now(),
      base,
      target,
      done: () => {
        n.leafOpen = { where, idx, base, target };
        ui.showLeaf(true);
        done(push, from);
      },
    };
  };

  const closeLeaf = (push = true) => {
    const L = n.leafOpen;
    if (n.busy || !L) return;
    const from = currentRoute(h);
    setBusy(true);
    ui.hideLeaf();
    n.leafOpen = null;
    n.cardFlip = { ...L, dir: "out", t0: performance.now(), done: () => done(push, from) };
  };

  /** Walks one transition at a time towards `n.target`; every transition's done callback calls back in until the route matches. */
  const step = () => {
    const t = n.target;
    if (!t || n.busy) return;
    if (sameRoute(currentRoute(h), t)) {
      n.target = null;
      return;
    }
    if (n.leafOpen) closeLeaf(false);
    else if (n.sec >= 0 && n.sec !== t.sec) closeSection(false);
    else if (t.sec >= 0 && n.sec !== t.sec) openSection(t.sec, false);
    else if (t.leaf) openLeaf(t.leaf.where, t.leaf.idx, false);
    else n.target = null;
  };

  /** Jumps straight into a route without animation, for deep links and after a resize. */
  const applyInstant = (route: Route) => {
    n.secAnim = null;
    n.cardFlip = null;
    n.leafOpen = null;
    n.target = null;
    setBusy(false);
    ui.hideLeaf();
    const back = route.sec >= 0 ? h.backs[route.sec] : null;
    n.sec = back ? route.sec : -1;
    n.S = back ? 1 : 0;
    if (back) Object.assign(h.backCam, back.home);
    ui.rebuild();
    const leaf = route.leaf;
    const target = leaf ? leafTarget(leaf.where, leaf.idx) : null;
    if (leaf && target) {
      const cam = leaf.where === "front" ? h.frontCam : h.backCam;
      n.leafOpen = { where: leaf.where, idx: leaf.idx, base: { ...cam }, target };
      Object.assign(cam, target);
      ui.showLeaf(false);
    }
    document.title = routeTitle(h.data, currentRoute(h), homeTitle);
    ui.settled(currentRoute(h));
  };

  let fading = false;
  let queued: (() => void) | null = null;

  /**
   * Under reduced motion every transition becomes a short fade through the background instead of a flip or a slide.
   * The transition itself still runs, finishing in one frame behind the veil; a request arriving mid fade waits its turn.
   */
  const veiled = (run: () => void) => {
    if (!h.reduced) {
      run();
      return;
    }
    if (fading) {
      queued = run;
      return;
    }
    fading = true;
    void ui.veil(true).then(() => {
      run();
      const settle = () => {
        if (n.busy || n.target) {
          requestAnimationFrame(settle);
          return;
        }
        const next = queued;
        queued = null;
        if (next) {
          next();
          requestAnimationFrame(settle);
          return;
        }
        requestAnimationFrame(() => void ui.veil(false).then(() => (fading = false)));
      };
      requestAnimationFrame(settle);
    });
  };

  /**
   * Back steps through entries the hive pushed with the browser's own history, so the browser back button and this stay in sync.
   * On a deep link there is nothing of ours to step back to, so it closes one level and replaces the URL instead.
   */
  const back = () => {
    if (n.busy) return;
    const cur = currentRoute(h);
    if (sameRoute(cur, HOME_ROUTE)) return;
    if (isPushed(history.state)) {
      history.back();
      return;
    }
    const parent = parentRoute(cur);
    try {
      history.replaceState(null, "", routePath(h.data, parent));
    } catch {}
    veiled(() => {
      n.target = parent;
      step();
    });
  };

  const goTo = (route: Route) =>
    veiled(() => {
      n.target = route;
      step();
    });

  addEventListener("popstate", () => goTo(parseRoute(h.data, location.pathname) ?? HOME_ROUTE));

  /** Advances the section and flip timers; reduced motion finishes them on the next frame. */
  const tick = (now: number) => {
    const sa = n.secAnim;
    if (sa) {
      const p = h.reduced ? 1 : clamp((now - sa.t0) / SEC_MS, 0, 1);
      n.S = sa.dir === "in" ? p : 1 - p;
      if (p >= 1) {
        n.secAnim = null;
        sa.done();
      }
    }
    n.CF = null;
    const T = n.cardFlip;
    if (T) {
      const p = h.reduced ? 1 : clamp((now - T.t0) / FLIP_MS, 0, 1);
      const e = ease(p);
      const f = T.dir === "in" ? e : 1 - e;
      Object.assign(T.where === "front" ? h.frontCam : h.backCam, camLerp(T.base, T.target, f));
      n.CF = { where: T.where, idx: T.idx, f };
      if (p >= 1) {
        n.cardFlip = null;
        T.done();
      }
    } else if (n.leafOpen) n.CF = { where: n.leafOpen.where, idx: n.leafOpen.idx, f: 1 };
  };

  return {
    tick,
    openSection: (i: number) => veiled(() => openSection(i)),
    openLeaf: (where: Where, idx: number) => veiled(() => openLeaf(where, idx)),
    back,
    goTo,
    applyInstant,
  };
}
