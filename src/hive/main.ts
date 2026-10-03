import { restOf } from "./camera";
import { type City, updateCity } from "./city/dynamic";
import { createGlitch } from "./city/glitch";
import { bake, mountCity, placeCity } from "./city/layers";
import { createScene } from "./city/scene";
import { DATA_ELEMENT_ID, type HiveData } from "./data";
import { decrypt } from "./fx/decrypt";
import { bindInput } from "./input";
import { sheetHooks } from "./interact";
import { buildBack, buildFront } from "./layout";
import { rng } from "./math";
import { cardAlpha, createNavigator, currentRoute, movingHex, phases } from "./nav";
import { setupHexButton } from "./overlay/hexbtn";
import { createLeaf } from "./overlay/leaf";
import { createPath } from "./overlay/path";
import { createSections } from "./overlay/sections";
import { loadPrefs } from "./prefs";
import { drawBack, drawFront, drawMoving } from "./render";
import { HOME_ROUTE, parseRoute, type Route } from "./route";
import { activeCam, createNav, on, onBack, type Hive } from "./state";
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

/** Canvas font family for the city signs; the fonts API hashes family names, so it is read from the CSS variable. */
function signFont(): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--font-zh").trim() || '"Noto Sans SC", sans-serif'
  );
}

function byId<T extends HTMLElement>(id: string, type: new () => T): T {
  const el = document.getElementById(id);
  if (!(el instanceof type)) throw new Error(`#${id} is missing`);
  return el;
}

/** Boots the hive over the page; throws if the shell markup is missing so the caller can fall back to the plain page. */
export function boot(): void {
  const cv = byId("hive", HTMLCanvasElement);
  const cityEl = byId("city", HTMLElement);
  const g = cv.getContext("2d");
  if (!g) throw new Error("2D canvas is unavailable");
  const data = readData();
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const W = innerWidth;
  const H = innerHeight;
  const h: Hive = {
    data,
    W,
    H,
    DPR: 1,
    ...layoutSheets({ data, W, H }),
    frontCam: { x: 0, y: 0, z: 1 },
    backCam: { x: 0, y: 0, z: 1 },
    pointer: { x: -9999, y: -9999 },
    clock: 0,
    nav: createNav(),
    hoverKey: null,
    hoverLoose: -1,
    grow: new Map(),
    drag: null,
    dragMoved: false,
    pending: null,
    prefs: loadPrefs(() => localStorage),
    reduced: reduceQuery.matches,
  };
  reduceQuery.addEventListener("change", (e) => (h.reduced = e.matches));
  const zh = signFont();
  let city: City | null = null;
  void bake().then((baked) => {
    city = { layers: mountCity(cityEl, baked), wins: baked.wins, scene: createScene(), glitch: createGlitch() };
  });

  const reveal = (el: Element, ms: number) => decrypt(el, ms, on(h, "decrypt"));
  const changed = () => {};
  const cells = byId("cells", HTMLElement);
  const leafBack = byId("leaf-back", HTMLButtonElement);
  const leaf = createLeaf(
    h,
    { leaf: byId("leaf", HTMLElement), inner: byId("leaf-inner", HTMLElement), back: leafBack, cells },
    reveal,
  );
  const path = createPath(h, byId("path", HTMLElement), reveal);
  const sections = createSections(h, cells, {
    activate: (where, i) => {
      if (where === "front") {
        if (h.data.home[i]?.cards) nav.openSection(i);
        else nav.openLeaf("front", i);
      } else if (i === 0) nav.back();
      else nav.openLeaf("back", i);
    },
    hover: (id) => {
      h.hoverKey = id;
      changed();
    },
    reveal,
  });
  const nav = createNavigator(
    h,
    {
      rebuild: sections.rebuild,
      showLeaf: leaf.show,
      hideLeaf: leaf.hide,
      busy: (busy) => {
        if (!busy) return;
        h.hoverKey = null;
        sections.clearHot();
      },
      settled: (from: Route) => {
        path();
        changed();
        const to = currentRoute(h);
        if (from.leaf && !to.leaf) sections.focus(from.leaf.where, from.leaf.idx);
        else if (from.sec >= 0 && to.sec < 0) sections.focus("front", from.sec);
        else if (from.sec < 0 && to.sec >= 0) sections.focus("back", 0);
      },
      sectionChange: changed,
    },
    data.homeTitle,
  );
  setupHexButton(leafBack, "above", () => on(h, "electric"), null);
  leafBack.addEventListener("click", () => nav.back());

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
    if (next.front.R === h.front.R && next.front.portrait === h.front.portrait) h.front.rect = next.front.rect;
    else h.front = next.front;
    h.backs = next.backs;
    h.drag = null;
    h.pending = null;
    Object.assign(h.frontCam, h.front.home);
    nav.applyInstant(route);
  };
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  });

  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!h.reduced) h.clock += dt;
    nav.tick(now);
    const n = h.nav;
    if (!n.secAnim && !n.cardFlip && !n.leafOpen && h.drag?.kind !== "pan") {
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
        placeCity(city.layers, h.reduced ? h.front.home : h.frontCam, h.front.home, h.front.hc, h.W, h.H);
        updateCity(city, {
          dt,
          now,
          clock: h.clock,
          life: on(h, "life"),
          weather: on(h, "weather"),
          glitch: on(h, "glitch"),
          reduced: h.reduced,
          DPR: h.DPR,
          zh,
        });
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
    sections.place();
    leaf.place();
    requestAnimationFrame(frame);
  };

  bindInput(h, cv, { ...sheetHooks(h, cv, changed), firstGesture: () => {}, escape: () => nav.back() });
  sizeCanvas();
  Object.assign(h.frontCam, h.front.home);
  nav.applyInstant(parseRoute(data, location.pathname) ?? HOME_ROUTE);
  document.documentElement.classList.add("hive");
  requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });
}
