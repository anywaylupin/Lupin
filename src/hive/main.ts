import { restOf, stepZoom } from "./camera";
import { byId, createChrome } from "./chrome";
import type { Ad } from "./city/billboards";
import type { City } from "./city/world";
import { DATA_ELEMENT_ID, type HiveData } from "./data";
import { bindInput } from "./input";
import { sheetHooks } from "./interact";
import { buildBack, buildFront, holeView } from "./layout";
import { rng } from "./math";
import { cardAlpha, currentRoute, movingHex, phases } from "./nav";
import { loadPrefs } from "./prefs";
import { drawBack, drawFront, drawMoving } from "./render";
import { HOME_ROUTE, parseRoute } from "./route";
import { emptyGaps, glassSlots } from "./sheet";
import { activeCam, createNav, lowGraphics, on, onBack, type Hive } from "./state";
import { C } from "./theme";

/** The JSON is written by our own build from schema-checked content, so it is trusted as is. */
function readData(): HiveData {
  const text = document.getElementById(DATA_ELEMENT_ID)?.textContent;
  if (!text) throw new Error(`#${DATA_ELEMENT_ID} is missing`);
  return JSON.parse(text) as HiveData;
}

function layoutSheets(h: Pick<Hive, "data" | "W" | "H">) {
  const ids = h.data.home.map((c) => c.id);
  const front = buildFront(ids, h.W, h.H, rng((Math.random() * 1e9) | 0));
  const backs = h.data.home.map((c) =>
    c.cards
      ? buildBack(
          c.id,
          c.cards.map((k) => k.id),
          h.W,
          h.H,
          front.R,
        )
      : null,
  );
  return { front, backs };
}

/** Canvas font families for the city's signs; the fonts API hashes family names, so they are read from the CSS variables. */
function cssFont(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** The owner's projects as billboard adverts, from the projects section's cards. */
function adverts(data: HiveData): Ad[] {
  const colours = ["255,110,200", "120,220,255", "255,200,90", "160,255,170"];
  const cards = data.home.find((c) => c.id === "projects")?.cards ?? [];
  return cards.map((c, i) => ({
    title: c.title,
    line: c.text ?? "",
    colour: colours[i % colours.length] ?? "255,255,255",
    mark: "project",
  }));
}

/** Screen points, as normalised device coordinates, of every slot where the city shows through the front sheet. */
function openSpots(h: Hive) {
  const c = h.frontCam;
  return [...emptyGaps(h.front), ...glassSlots(h.front)]
    .map((s) => ({
      x: (((s.x - c.x) * c.z + h.W / 2) / h.W) * 2 - 1,
      y: 1 - (((s.y - c.y) * c.z + h.H / 2) / h.H) * 2,
    }))
    .filter((p) => Math.abs(p.x) < 1 && Math.abs(p.y) < 1);
}

function createHive(data: HiveData, reduced: boolean): Hive {
  const W = innerWidth;
  const H = innerHeight;
  return {
    data,
    W,
    H,
    DPR: 1,
    ...layoutSheets({ data, W, H }),
    frontCam: { x: 0, y: 0, z: 1 },
    backCam: { x: 0, y: 0, z: 1 },
    pointer: { x: -9999, y: -9999 },
    nav: createNav(),
    hoverKey: null,
    hoverLoose: -1,
    grow: new Map(),
    drag: null,
    dragMoved: false,
    pending: null,
    prefs: loadPrefs(() => localStorage),
    reduced,
    zoom: null,
    dt: 0,
    carriers: [],
    autoLow: false,
    city: null,
  };
}

/** Boots the hive over the page; throws if the shell markup is missing so the caller can fall back to the plain page. */
export function boot(): void {
  const cv = byId("hive", HTMLCanvasElement);
  const cityEl = byId("city", HTMLElement);
  const g = cv.getContext("2d");
  if (!g) throw new Error("2D canvas is unavailable");
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const h = createHive(readData(), reduceQuery.matches);
  const chrome = createChrome(h);
  const nav = chrome.nav;
  reduceQuery.addEventListener("change", (e) => {
    h.reduced = e.matches;
    chrome.reducedChanged();
  });
  const zh = cssFont("--font-zh", '"Noto Sans SC", sans-serif');
  const mono = cssFont("--font-mono", "monospace");
  /** three.js loads as its own chunk after the sheet is up, so the first paint never waits on the city; without WebGL the flat backdrop stays. */
  let city: City | null = null;
  void import("./city/world")
    .then(({ createCity }) => {
      const c = createCity(cityEl, { zh, mono, ads: adverts(h.data), open: () => openSpots(h) });
      city = c;
      h.autoLow = c.soft;
      c.setLow(lowGraphics(h));
      c.resize(h.W, h.H, h.DPR, holeView(h.front, h.W, h.H));
      chrome.settings.apply();
      h.city = {
        reveal: (x, y) => c.reveal({ x: (x / h.W) * 2 - 1, y: 1 - (y / h.H) * 2 }),
        setLow: c.setLow,
      };
    })
    .catch(() => undefined);

  const sizeCanvas = () => {
    h.W = innerWidth;
    h.H = innerHeight;
    h.DPR = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(h.W * h.DPR);
    cv.height = Math.round(h.H * h.DPR);
  };

  /** Keeps pulled and loose hexes when the hex size and orientation survive the resize, as when a phone's address bar slides away. */
  const resize = () => {
    const route = currentRoute(h);
    sizeCanvas();
    const next = layoutSheets(h);
    if (next.front.R === h.front.R && next.front.portrait === h.front.portrait) {
      h.front.rect = next.front.rect;
      h.front.home = next.front.home;
    } else h.front = next.front;
    h.backs = next.backs;
    h.drag = null;
    h.pending = null;
    h.zoom = null;
    Object.assign(h.frontCam, h.front.home);
    city?.resize(h.W, h.H, h.DPR, holeView(h.front, h.W, h.H));
    chrome.relayout();
    nav.applyInstant(route);
  };
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  });

  let last = performance.now();
  /**
   * The city behind the sheet steps every other frame, at 30 fps, and renders in between only while the camera moves, so pans stay at 60.
   * Under Lighthouse's software rendering every city frame counted as a long task, holding the home page near 80; on phones it halves the battery the background costs.
   */
  let cityTurn = false;
  let cityDt = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    h.dt = dt;
    nav.tick(now);
    const n = h.nav;
    if (h.zoom && (n.secAnim || n.cardFlip || n.leafOpen)) h.zoom = null;
    if (h.zoom && stepZoom(activeCam(h), h.zoom, dt, h.W, h.H)) h.zoom = null;
    if (!n.secAnim && !n.cardFlip && !n.leafOpen && !h.zoom && h.drag?.kind !== "pan") {
      const c = activeCam(h);
      const rect = onBack(h) ? (h.backs[n.sec]?.rect ?? h.front.rect) : h.front.rect;
      const r = restOf(rect, c, h.W, h.H);
      const k = h.reduced ? 1 : 0.18;
      c.x += (r.x - c.x) * k;
      c.y += (r.y - c.y) * k;
    }
    const live = !n.busy && !n.leafOpen;
    g.setTransform(h.DPR, 0, 0, h.DPR, 0, 0);
    if (n.S < 1) {
      g.clearRect(0, 0, h.W, h.H);
      if (city) {
        cityDt += dt;
        cityTurn = !cityTurn;
        city.frame(
          { dt: cityDt, life: on(h, "life"), weather: on(h, "weather"), glitch: on(h, "glitch") },
          h.reduced ? h.front.home : h.frontCam,
          h.front.home,
          cityTurn,
          h.pointer.x > -999 ? { x: (h.pointer.x / h.W) * 2 - 1, y: 1 - (h.pointer.y / h.H) * 2 } : null,
        );
        if (cityTurn) cityDt = 0;
      }
      drawFront(g, h, h.frontCam, live && n.S === 0, now);
    } else {
      g.fillStyle = C.bg;
      g.fillRect(0, 0, h.W, h.H);
    }
    const B = h.backs[n.sec];
    if (n.S > 0 && B) {
      const { A, D } = phases(n.S);
      const count = B.items.length - 1;
      g.setTransform(h.DPR, 0, 0, h.DPR, 0, 0);
      g.fillStyle = `rgba(0,0,0,${A})`;
      g.fillRect(0, 0, h.W, h.H);
      const itemA = (k: number) => (k === 0 ? (n.S >= 1 ? 1 : 0) : cardAlpha(n.S, k, count));
      drawBack(g, h, B, h.backCam, live && n.S >= 1, D, itemA, n.S < 1, now);
      if (n.S < 1) drawMoving(g, h, movingHex(h));
    }
    chrome.place();
  };

  let raf = 0;
  const loop = (now: number) => {
    frame(now);
    raf = requestAnimationFrame(loop);
  };
  /** The loop stops while the tab is hidden; resuming resets the frame clock so the first frame back does not jump. */
  const resume = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame((t) => {
      last = t;
      loop(t);
    });
  };
  document.addEventListener("visibilitychange", () => (document.hidden ? cancelAnimationFrame(raf) : resume()));
  /** A resolution query fires once per value, so each change re-arms it for the new ratio, as when a window moves between monitors. */
  const watchDpr = () =>
    matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener(
      "change",
      () => {
        resize();
        watchDpr();
      },
      { once: true },
    );
  watchDpr();

  bindInput(h, cv, { ...sheetHooks(h, cv, chrome.changed), firstGesture: chrome.gesture, escape: chrome.escape });
  sizeCanvas();
  Object.assign(h.frontCam, h.front.home);
  nav.applyInstant(parseRoute(h.data, location.pathname) ?? HOME_ROUTE);
  document.documentElement.classList.add("hive");
  resume();
}
